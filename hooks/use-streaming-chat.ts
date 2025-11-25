import { useState, useCallback, useRef } from 'react';
import { SSEParser, type SSEMessage } from '@/lib/sse-parser';
import type { Message } from '@/lib/chat-utils';
import { instrumentedFetch, captureCriticalError } from '@/lib/sentry-utils';
import { createClient } from '@/lib/supabase/client';
import { streamWithRetry } from '@/lib/api-retry';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev';

interface StreamingCallbacks {
  onStart?: () => void;
  onStatus?: (message: string) => void;
  onChunk?: (delta: string) => void;
  onComplete?: (fullResponse: string, latencyMs: number) => void;
  onAttachments?: (attachments: any[]) => void;
  onError?: (error: string) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    conversationHistory: Message[],
    callbacks: StreamingCallbacks,
    conversationId?: string | null,
    fileIds?: string[]
  ) => {
    // Create abort controller for cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);
    
    try {
      callbacks.onStart?.();
      
      // Get Supabase session token for authentication
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const token = session.access_token;
      
      // Call Fly.io backend directly with retry logic for network resilience
      const response = await instrumentedFetch(`${BACKEND_URL}/api/pelican_stream`, async () => {
        return await streamWithRetry(`${BACKEND_URL}/api/pelican_stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationHistory: conversationHistory
              .filter(msg => msg.role !== 'system')
              .map(msg => ({
                role: msg.role,
                content: msg.content
              })),
            conversationId: conversationId,
            files: fileIds || [],
          }),
          signal: controller.signal,
          retryOptions: {
            maxRetries: 2, // Retry failed connections up to 2 times
            baseDelay: 1000, // Start with 1 second delay
            shouldRetry: (error: Error) => {
              // Don't retry if user cancelled
              if (error.name === 'AbortError') return false;
              // Don't retry auth errors
              if (error.message.includes('401') || error.message.includes('403')) return false;
              // Retry network errors (Failed to fetch)
              if (error.message.includes('Failed to fetch') || error.message.includes('network')) return true;
              return true;
            }
          }
        });
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received from backend');
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const parser = new SSEParser();
      
      for await (const event of parser.parse(reader)) {
        switch (event.type) {
          case 'conversationId':
            // Handle new conversation ID event
            if (event.conversationId) {
              callbacks.onConversationCreated?.(event.conversationId);
            }
            break;
            
          case 'status':
            callbacks.onStatus?.(event.message || '');
            break;
            
          case 'content':
            callbacks.onChunk?.(event.delta || '');
            break;
            
          case 'attachments':
            callbacks.onAttachments?.(event.data || []);
            break;
            
          case 'done':
            callbacks.onComplete?.(
              event.full_response || '',
              event.latency_ms || 0
            );
            break;
            
          case 'error':
            console.error('[STREAMING] Error event from backend:', event.message);
            // Capture streaming errors in Sentry
            captureCriticalError(new Error(event.message || 'Unknown streaming error'), {
              location: 'streaming',
              endpoint: `${BACKEND_URL}/api/pelican_stream`,
              conversationId: conversationId || null,
              messageLength: message.length,
            });
            callbacks.onError?.(event.message || 'Unknown error');
            break;
        }
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[PELICAN-DIRECT] Stream cancelled by user');
      } else {
        // Capture critical streaming errors in Sentry
        captureCriticalError(error, {
          location: 'streaming',
          endpoint: `${BACKEND_URL}/api/pelican_stream`,
          conversationId: conversationId || null,
          messageLength: message.length,
        });
        
        callbacks.onError?.(
          error instanceof Error ? error.message : 'Stream failed'
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    sendMessage,
    cancelStream,
    isStreaming
  };
}
