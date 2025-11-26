/**
 * Streaming Chat Hook - Production Grade Implementation
 * ======================================================
 * 
 * This hook handles the actual streaming API call with:
 * - Proper payload construction with BOTH field names
 * - Comprehensive error handling
 * - Connection timeout handling
 * - SSE stream parsing
 * 
 * CRITICAL FIXES APPLIED:
 * 1. Sends BOTH conversationHistory AND conversation_history fields
 * 2. Comprehensive logging of payload before sending
 * 3. Proper error handling for stream failures
 * 4. Connection timeout handling
 * 
 * @author Pelican Engineering
 * @version 2.0.0
 */

import { useCallback, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

// =============================================================================
// CONSTANTS
// =============================================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev';
const STREAM_TIMEOUT_MS = 60000; // 60 seconds
const CHUNK_TIMEOUT_MS = 30000; // 30 seconds between chunks

// =============================================================================
// TYPES
// =============================================================================

interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

interface ConversationMessage {
  role: string;
  content: string;
}

interface StreamingPayload {
  message: string;
  conversationHistory: ConversationMessage[];
  conversation_history: ConversationMessage[]; // CRITICAL: Send both field names
  conversationId: string | null;
  files: string[];
  timestamp: string;
  stream: boolean;
}

interface UseStreamingChatReturn {
  sendMessage: (
    message: string,
    history: ConversationMessage[],
    callbacks: StreamCallbacks,
    conversationId: string | null,
    fileIds: string[]
  ) => Promise<void>;
  isStreaming: boolean;
  abortStream: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse SSE data from a chunk
 */
function parseSSEChunk(chunk: string): { content?: string; done?: boolean; error?: string } | null {
  if (!chunk.startsWith('data: ')) {
    return null;
  }

  const jsonStr = chunk.slice(6).trim();
  if (!jsonStr) {
    return null;
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    logger.warn('[STREAM-PARSE] Failed to parse SSE chunk', { chunk, error: e });
    return null;
  }
}

/**
 * Build the streaming payload with BOTH field names
 * 
 * CRITICAL FIX: Backend may look for either 'conversationHistory' (camelCase)
 * or 'conversation_history' (snake_case). We send BOTH to ensure compatibility.
 */
function buildStreamingPayload(
  message: string,
  history: ConversationMessage[],
  conversationId: string | null,
  fileIds: string[]
): StreamingPayload {
  // Filter out system messages and map to clean format
  const cleanHistory = history
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  const payload: StreamingPayload = {
    message,
    conversationHistory: cleanHistory, // camelCase for frontend compatibility
    conversation_history: cleanHistory, // snake_case for backend compatibility
    conversationId: conversationId,
    files: fileIds,
    timestamp: new Date().toISOString(),
    stream: true,
  };

  return payload;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useStreamingChat(): UseStreamingChatReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clear any active timeouts
   */
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Abort the current stream
   */
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearTimeouts();
    setIsStreaming(false);
  }, [clearTimeouts]);

  /**
   * Send a streaming message to the backend
   */
  const sendMessage = useCallback(
    async (
      message: string,
      history: ConversationMessage[],
      callbacks: StreamCallbacks,
      conversationId: string | null,
      fileIds: string[]
    ): Promise<void> => {
      // Abort any existing stream
      abortStream();

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // Build payload
      const payload = buildStreamingPayload(message, history, conversationId, fileIds);

      // -------------------------------------------------------------------------
      // CRITICAL: Log payload for debugging
      // -------------------------------------------------------------------------
      logger.info('[STREAM-SEND] Sending streaming request', {
        messageLength: message.length,
        historyLength: payload.conversationHistory.length,
        conversationId,
        hasFiles: fileIds.length > 0,
      });

      // Debug log for troubleshooting (remove in production)
      console.log('[STREAM-DEBUG] Full payload:', {
        message: message.substring(0, 100),
        conversationHistoryCount: payload.conversationHistory.length,
        conversation_historyCount: payload.conversation_history.length,
        conversationId,
        files: fileIds.length,
        payloadPreview: JSON.stringify(payload, null, 2).substring(0, 500),
      });

      // Warn if empty history for existing conversation
      if (payload.conversationHistory.length === 0 && conversationId) {
        logger.warn('[STREAM-SEND] WARNING: Sending empty history for existing conversation!', {
          conversationId,
          originalHistoryLength: history.length,
        });
        console.warn(
          '[STREAM-WARNING] Empty conversation history being sent for existing conversation!',
          { conversationId }
        );
      }

      setIsStreaming(true);

      let fullResponse = '';
      let lastChunkTime = Date.now();

      try {
        // Set connection timeout
        const connectionTimeoutId = setTimeout(() => {
          if (!signal.aborted) {
            abortControllerRef.current?.abort();
            callbacks.onError?.(new Error('Connection timeout'));
          }
        }, STREAM_TIMEOUT_MS);

        // Make request
        const response = await fetch(`${BACKEND_URL}/api/pelican_stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
        });

        clearTimeout(connectionTimeoutId);

        // Check response status
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        // Process stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Chunk timeout checker
        const checkChunkTimeout = () => {
          const elapsed = Date.now() - lastChunkTime;
          if (elapsed > CHUNK_TIMEOUT_MS && isStreaming) {
            logger.warn('[STREAM-TIMEOUT] No chunk received for 30s');
            abortStream();
            callbacks.onError?.(new Error('Stream timeout - no data received'));
          } else if (isStreaming) {
            timeoutRef.current = setTimeout(checkChunkTimeout, 5000);
          }
        };
        timeoutRef.current = setTimeout(checkChunkTimeout, CHUNK_TIMEOUT_MS);

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            logger.info('[STREAM-DONE] Stream complete', {
              responseLength: fullResponse.length,
            });
            break;
          }

          lastChunkTime = Date.now();

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            const parsed = parseSSEChunk(trimmedLine);
            if (!parsed) continue;

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.done) {
              logger.info('[STREAM-COMPLETE] Received done signal');
              continue;
            }

            if (parsed.content) {
              fullResponse += parsed.content;
              callbacks.onChunk?.(parsed.content);
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const parsed = parseSSEChunk(buffer.trim());
          if (parsed?.content) {
            fullResponse += parsed.content;
            callbacks.onChunk?.(parsed.content);
          }
        }

        // Call complete callback
        callbacks.onComplete?.(fullResponse);

      } catch (error) {
        if (signal.aborted) {
          logger.info('[STREAM-ABORTED] Stream was aborted');
          return;
        }

        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('[STREAM-ERROR] Streaming failed', { error: err.message });
        callbacks.onError?.(err);

      } finally {
        clearTimeouts();
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [abortStream, clearTimeouts, isStreaming]
  );

  return {
    sendMessage,
    isStreaming,
    abortStream,
  };
}

export default useStreamingChat;

