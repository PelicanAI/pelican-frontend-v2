/**
 * Chat Hook - Production Grade Implementation
 * =============================================
 * 
 * This hook manages conversation state and message sending with:
 * - Synchronous state/ref updates to prevent race conditions
 * - Proper conversation history capture before API calls
 * - Comprehensive logging for debugging
 * - Empty history detection and warnings
 * 
 * CRITICAL FIXES APPLIED:
 * 1. Synchronous ref update (not via useEffect)
 * 2. History captured BEFORE state updates
 * 3. Validation for empty history in existing conversations
 * 4. Comprehensive logging at each step
 * 
 * @author Pelican Engineering
 * @version 2.0.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStreamingChat } from './use-streaming-chat';
import { logger } from '@/lib/logger';
import type { Message } from '@/lib/chat-utils';

// =============================================================================
// CONSTANTS
// =============================================================================

const LIMITS = {
  MESSAGE_CONTEXT: 150, // Maximum messages to include in context
  MAX_MESSAGE_LENGTH: 50000, // Maximum message length
  MIN_MESSAGE_LENGTH: 1, // Minimum message length
};

// =============================================================================
// TYPES
// =============================================================================

interface UseChatOptions {
  conversationId?: string | null;
  userId?: string | null;
  onError?: (error: Error) => void;
  onMessageSent?: (message: Message) => void;
  onResponseComplete?: (response: string) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

interface SendMessageOptions {
  fileIds?: string[];
  skipUserMessage?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a unique message ID
 */
function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a user message object
 */
function createUserMessage(content: string): Message {
  return {
    id: createMessageId(),
    role: 'user',
    content: content.trim(),
    timestamp: new Date(),
    isStreaming: false,
  };
}

/**
 * Create an assistant message object (initially empty for streaming)
 */
function createAssistantMessage(content: string = ''): Message {
  return {
    id: createMessageId(),
    role: 'assistant',
    content,
    timestamp: new Date(),
    isStreaming: true,
  };
}

/**
 * Validate message content
 */
function validateMessage(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' };
  }

  const trimmed = content.trim();

  if (trimmed.length < LIMITS.MIN_MESSAGE_LENGTH) {
    return { valid: false, error: 'Message is too short' };
  }

  if (trimmed.length > LIMITS.MAX_MESSAGE_LENGTH) {
    return { valid: false, error: 'Message is too long' };
  }

  return { valid: true };
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    conversationId: initialConversationId,
    userId,
    onError,
    onMessageSent,
    onResponseComplete,
  } = options;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Current conversation ID (can change during conversation)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    initialConversationId ?? null
  );

  // ---------------------------------------------------------------------------
  // REFS - CRITICAL FOR AVOIDING STALE CLOSURES
  // ---------------------------------------------------------------------------

  /**
   * CRITICAL: This ref holds the current messages and is updated SYNCHRONOUSLY.
   * 
   * Unlike the useState messages, this ref is updated immediately when we
   * call updateMessagesWithSync, ensuring we always have the latest state
   * available without waiting for React's async state update cycle.
   */
  const messagesRef = useRef<Message[]>([]);

  /**
   * Track which conversation we've loaded to prevent duplicate loads
   */
  const loadedConversationRef = useRef<string | null>(null);

  /**
   * Track the last sent message for retry functionality
   */
  const lastSentMessageRef = useRef<string | null>(null);

  // ---------------------------------------------------------------------------
  // STREAMING HOOK
  // ---------------------------------------------------------------------------

  const { sendMessage: sendStreamingMessage, isStreaming } = useStreamingChat();

  // ---------------------------------------------------------------------------
  // SYNCHRONOUS STATE UPDATE
  // ---------------------------------------------------------------------------

  /**
   * Update messages state AND ref synchronously.
   * 
   * CRITICAL FIX: This ensures messagesRef.current is always up-to-date
   * when we capture history for the API call, preventing the race condition
   * where history was captured before the ref was updated via useEffect.
   */
  const updateMessagesWithSync = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        // Update ref SYNCHRONOUSLY within the same call
        messagesRef.current = next;
        return next;
      });
    },
    []
  );

  /**
   * Get current messages from ref (always latest)
   */
  const getCurrentMessages = useCallback((): Message[] => {
    return messagesRef.current;
  }, []);

  // ---------------------------------------------------------------------------
  // HISTORY CAPTURE
  // ---------------------------------------------------------------------------

  /**
   * Capture conversation history for API call.
   * 
   * CRITICAL: This must be called BEFORE any state updates to ensure
   * we capture the history as it was before the new message was added.
   * 
   * @param excludeSystemMessages - Filter out system messages
   * @param maxMessages - Maximum messages to include
   * @returns Array of message objects suitable for API call
   */
  const captureConversationHistory = useCallback(
    (excludeSystemMessages: boolean = true, maxMessages?: number): Array<{ role: string; content: string }> => {
      const currentMessages = getCurrentMessages();
      const limit = maxMessages ?? LIMITS.MESSAGE_CONTEXT - 1; // Reserve 1 for new message

      // Log current state
      logger.debug('[CHAT-CAPTURE] Capturing history', {
        currentMessagesCount: currentMessages.length,
        limit,
        conversationId: currentConversationId,
      });

      // Filter and map messages
      let history = currentMessages;

      if (excludeSystemMessages) {
        history = history.filter((msg) => msg.role !== 'system');
      }

      // Take last N messages
      history = history.slice(-limit);

      // Map to API format
      const apiHistory = history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Log captured history
      logger.debug('[CHAT-CAPTURE] History captured', {
        historyLength: apiHistory.length,
        firstMessagePreview: apiHistory[0]?.content?.substring(0, 50),
        lastMessagePreview: apiHistory[apiHistory.length - 1]?.content?.substring(0, 50),
      });

      // CRITICAL: Warn if sending empty history for existing conversation
      if (apiHistory.length === 0 && currentConversationId) {
        logger.warn('[CHAT-CAPTURE] WARNING: Empty history for existing conversation!', {
          conversationId: currentConversationId,
          messagesStateLength: currentMessages.length,
          messagesRoles: currentMessages.map((m) => m.role),
        });
      }

      return apiHistory;
    },
    [getCurrentMessages, currentConversationId]
  );

  // ---------------------------------------------------------------------------
  // SEND MESSAGE - STREAMING
  // ---------------------------------------------------------------------------

  /**
   * Send a message using streaming.
   * 
   * Flow:
   * 1. Validate message
   * 2. Capture history BEFORE state update
   * 3. Update state with user message
   * 4. Update state with empty assistant message
   * 5. Make API call with captured history
   * 6. Update assistant message as chunks arrive
   */
  const sendMessageStreaming = useCallback(
    async (content: string, sendOptions: SendMessageOptions = {}): Promise<void> => {
      // Validate
      const validation = validateMessage(content);
      if (!validation.valid) {
        const err = new Error(validation.error);
        setError(err);
        onError?.(err);
        return;
      }

      // Save for retry
      lastSentMessageRef.current = content;

      // Clear error
      setError(null);
      setIsLoading(true);

      // Create user message
      const userMessage = createUserMessage(content);

      // ------------------------------------
      // STEP 1: Capture history BEFORE state update
      // ------------------------------------
      const conversationHistory = captureConversationHistory();

      // Log what we're about to send
      logger.info('[CHAT-SEND] Preparing to send message', {
        messageLength: content.length,
        historyLength: conversationHistory.length,
        conversationId: currentConversationId,
        isNewConversation: !currentConversationId,
      });

      // Debug log for troubleshooting
      console.log('[CHAT-DEBUG] Payload construction:', {
        stateLength: messages.length,
        refLength: messagesRef.current.length,
        historyLength: conversationHistory.length,
        conversationId: currentConversationId,
        isNewConversation: !currentConversationId,
        firstMsgPreview: conversationHistory[0]?.content?.slice(0, 50),
      });

      // ------------------------------------
      // STEP 2: Update state with user message
      // ------------------------------------
      if (!sendOptions.skipUserMessage) {
        updateMessagesWithSync((prev) => [...prev, userMessage]);
        onMessageSent?.(userMessage);
      }

      // ------------------------------------
      // STEP 3: Create assistant message placeholder
      // ------------------------------------
      const assistantMessage = createAssistantMessage('');
      const assistantMessageId = assistantMessage.id;

      updateMessagesWithSync((prev) => [...prev, assistantMessage]);

      // ------------------------------------
      // STEP 4: Make streaming API call
      // ------------------------------------
      try {
        await sendStreamingMessage(
          content,
          conversationHistory,
          {
            // On each chunk, update assistant message
            onChunk: (chunk: string) => {
              updateMessagesWithSync((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + chunk }
                    : msg
                )
              );
            },
            // On complete, mark as not streaming
            onComplete: (fullResponse: string) => {
              updateMessagesWithSync((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullResponse, isStreaming: false }
                    : msg
                )
              );
              onResponseComplete?.(fullResponse);
              logger.info('[CHAT-COMPLETE] Response complete', {
                responseLength: fullResponse.length,
              });
            },
            // On error
            onError: (err: Error) => {
              setError(err);
              onError?.(err);
              // Remove the empty assistant message on error
              updateMessagesWithSync((prev) =>
                prev.filter((msg) => msg.id !== assistantMessageId)
              );
              logger.error(`[CHAT-ERROR] Streaming error: ${err.message}`);
            },
          },
          currentConversationId,
          sendOptions.fileIds || []
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        // Remove the empty assistant message on error
        updateMessagesWithSync((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
        );
        logger.error(`[CHAT-ERROR] Send failed: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [
      captureConversationHistory,
      currentConversationId,
      messages.length,
      onError,
      onMessageSent,
      onResponseComplete,
      sendStreamingMessage,
      updateMessagesWithSync,
    ]
  );

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions): Promise<void> => {
      return sendMessageStreaming(content, options);
    },
    [sendMessageStreaming]
  );

  const clearMessages = useCallback(() => {
    updateMessagesWithSync(() => []);
    setError(null);
    logger.info('[CHAT-CLEAR] Messages cleared');
  }, [updateMessagesWithSync]);

  const retryLastMessage = useCallback(async () => {
    if (lastSentMessageRef.current) {
      // Remove the last user message and any assistant response
      updateMessagesWithSync((prev) => {
        const lastUserIndex = prev.findLastIndex((m) => m.role === 'user');
        if (lastUserIndex >= 0) {
          return prev.slice(0, lastUserIndex);
        }
        return prev;
      });

      // Retry
      await sendMessage(lastSentMessageRef.current);
    }
  }, [sendMessage, updateMessagesWithSync]);

  // ---------------------------------------------------------------------------
  // CONVERSATION LOADING
  // ---------------------------------------------------------------------------

  /**
   * Sync initial conversation ID
   */
  useEffect(() => {
    if (initialConversationId !== currentConversationId) {
      setCurrentConversationId(initialConversationId ?? null);
    }
  }, [initialConversationId, currentConversationId]);

  /**
   * Initialize ref on mount
   */
  useEffect(() => {
    messagesRef.current = messages;
  }, []); // Only on mount - sync updates handle the rest

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}

export default useChat;

