/**
 * Chat Hook - Production Grade Implementation
 * =============================================
 * 
 * This hook manages conversation state and message sending with:
 * - Message loading when conversation changes
 * - Synchronous state/ref updates to prevent race conditions
 * - Proper conversation history capture before API calls
 * - Backend-handled message persistence (no dual persistence)
 * - Comprehensive logging for debugging
 * 
 * @author Pelican Engineering
 * @version 3.0.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStreamingChat } from './use-streaming-chat';
import { logger } from '@/lib/logger';
import type { Message } from '@/lib/chat-utils';

// =============================================================================
// CONSTANTS
// =============================================================================

const LIMITS = {
  MESSAGE_CONTEXT: 150,
  MAX_MESSAGE_LENGTH: 50000,
  MIN_MESSAGE_LENGTH: 1,
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
  onFinish?: (message: Message) => void;
  onConversationCreated?: (conversationId: string) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
  regenerateLastMessage: () => Promise<void>;
  retryLastMessage: () => Promise<void>;
  addSystemMessage: (content: string) => string;
  conversationNotFound: boolean;
  isLoadingMessages: boolean;
}

interface SendMessageOptions {
  fileIds?: string[];
  skipUserMessage?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createUserMessage(content: string): Message {
  return {
    id: createMessageId(),
    role: 'user',
    content: content.trim(),
    timestamp: new Date(),
    isStreaming: false,
  };
}

function createAssistantMessage(content: string = ''): Message {
  return {
    id: createMessageId(),
    role: 'assistant',
    content,
    timestamp: new Date(),
    isStreaming: true,
  };
}

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
    onFinish,
    onConversationCreated,
  } = options;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationNotFound, setConversationNotFound] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    initialConversationId ?? null
  );

  // ---------------------------------------------------------------------------
  // REFS
  // ---------------------------------------------------------------------------

  const messagesRef = useRef<Message[]>([]);
  const loadedConversationRef = useRef<string | null>(null);
  const lastSentMessageRef = useRef<string | null>(null);
  const loadingAbortRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // STREAMING HOOK
  // ---------------------------------------------------------------------------

  const { sendMessage: sendStreamingMessage, isStreaming, abortStream } = useStreamingChat();

  // ---------------------------------------------------------------------------
  // SYNCHRONOUS STATE UPDATE
  // ---------------------------------------------------------------------------

  const updateMessagesWithSync = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        return next;
      });
    },
    []
  );

  const getCurrentMessages = useCallback((): Message[] => {
    return messagesRef.current;
  }, []);

  // ---------------------------------------------------------------------------
  // HISTORY CAPTURE
  // ---------------------------------------------------------------------------

  const captureConversationHistory = useCallback(
    (excludeSystemMessages: boolean = true, maxMessages?: number): Array<{ role: string; content: string }> => {
      const currentMessages = getCurrentMessages();
      const limit = maxMessages ?? LIMITS.MESSAGE_CONTEXT - 1;

      logger.debug('[CHAT-CAPTURE] Capturing history', {
        currentMessagesCount: currentMessages.length,
        limit,
        conversationId: currentConversationId,
      });

      let history = currentMessages;

      if (excludeSystemMessages) {
        history = history.filter((msg) => msg.role !== 'system');
      }

      history = history.slice(-limit);

      const apiHistory = history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

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
  // LOAD MESSAGES
  // ---------------------------------------------------------------------------

  const loadMessages = useCallback(async (conversationId: string): Promise<boolean> => {
    // Abort any in-flight load
    if (loadingAbortRef.current) {
      loadingAbortRef.current.abort();
    }
    
    const abortController = new AbortController();
    loadingAbortRef.current = abortController;
    
    logger.info('[CHAT-LOAD] Loading conversation', { conversationId });
    setIsLoadingMessages(true);
    setError(null);
    setConversationNotFound(false);
    
    // Clear existing messages immediately
    updateMessagesWithSync(() => []);
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        signal: abortController.signal,
      });
      
      if (abortController.signal.aborted) {
        return false;
      }
      
      if (response.status === 404) {
        logger.warn('[CHAT-LOAD] Conversation not found', { conversationId });
        setConversationNotFound(true);
        loadedConversationRef.current = null;
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (abortController.signal.aborted) {
        return false;
      }
      
      // Transform API messages to our Message format
      const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
        id: msg.id || createMessageId(),
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at || Date.now()),
        isStreaming: false,
      }));
      
      logger.info('[CHAT-LOAD] Loaded messages', { 
        conversationId, 
        count: loadedMessages.length 
      });
      
      updateMessagesWithSync(() => loadedMessages);
      loadedConversationRef.current = conversationId;
      return true;
      
    } catch (err) {
      if (abortController.signal.aborted) {
        return false;
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Don't log abort errors
      if (error.name !== 'AbortError') {
        logger.error('[CHAT-LOAD] Failed to load messages', error);
        setError(error);
        onError?.(error);
      }
      return false;
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoadingMessages(false);
      }
      if (loadingAbortRef.current === abortController) {
        loadingAbortRef.current = null;
      }
    }
  }, [updateMessagesWithSync, onError]);

  // ---------------------------------------------------------------------------
  // SEND MESSAGE - STREAMING
  // ---------------------------------------------------------------------------

  const sendMessageStreaming = useCallback(
    async (content: string, sendOptions: SendMessageOptions = {}): Promise<void> => {
      const validation = validateMessage(content);
      if (!validation.valid) {
        const err = new Error(validation.error);
        setError(err);
        onError?.(err);
        return;
      }

      lastSentMessageRef.current = content;
      setError(null);
      setIsLoading(true);

      const userMessage = createUserMessage(content);
      const conversationHistory = captureConversationHistory();

      logger.info('[CHAT-SEND] Preparing to send message', {
        messageLength: content.length,
        historyLength: conversationHistory.length,
        conversationId: currentConversationId,
        isNewConversation: !currentConversationId,
      });

      console.log('[CHAT-DEBUG] Payload construction:', {
        stateLength: messages.length,
        refLength: messagesRef.current.length,
        historyLength: conversationHistory.length,
        conversationId: currentConversationId,
        isNewConversation: !currentConversationId,
        firstMsgPreview: conversationHistory[0]?.content?.slice(0, 50),
      });

      if (!sendOptions.skipUserMessage) {
        updateMessagesWithSync((prev) => [...prev, userMessage]);
        onMessageSent?.(userMessage);
      }

      const assistantMessage = createAssistantMessage('');
      const assistantMessageId = assistantMessage.id;

      updateMessagesWithSync((prev) => [...prev, assistantMessage]);

      try {
        await sendStreamingMessage(
          content,
          conversationHistory,
          {
            onChunk: (chunk: string) => {
              updateMessagesWithSync((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + chunk }
                    : msg
                )
              );
            },
            onComplete: async (fullResponse: string) => {
              const finalMessage: Message = {
                ...assistantMessage,
                content: fullResponse,
                isStreaming: false,
              };
              updateMessagesWithSync((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? finalMessage : msg
                )
              );
              onResponseComplete?.(fullResponse);
              onFinish?.(finalMessage);
              logger.info('[CHAT-COMPLETE] Response complete', {
                responseLength: fullResponse.length,
              });
            },
            onError: (err: Error) => {
              setError(err);
              onError?.(err);
              updateMessagesWithSync((prev) =>
                prev.filter((msg) => msg.id !== assistantMessageId)
              );
              logger.error('[CHAT-ERROR] Streaming error', err);
            },
          },
          currentConversationId,
          sendOptions.fileIds || []
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        updateMessagesWithSync((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
        );
        logger.error('[CHAT-ERROR] Send failed', error);
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
      onFinish,
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
    loadedConversationRef.current = null;
    logger.info('[CHAT-CLEAR] Messages cleared');
  }, [updateMessagesWithSync]);

  const retryLastMessage = useCallback(async () => {
    if (lastSentMessageRef.current) {
      updateMessagesWithSync((prev) => {
        const lastUserIndex = prev.findLastIndex((m) => m.role === 'user');
        if (lastUserIndex >= 0) {
          return prev.slice(0, lastUserIndex);
        }
        return prev;
      });
      await sendMessage(lastSentMessageRef.current);
    }
  }, [sendMessage, updateMessagesWithSync]);

  const regenerateLastMessage = retryLastMessage;

  const stopGeneration = useCallback(() => {
    abortStream();
    setIsLoading(false);
    updateMessagesWithSync((prev) =>
      prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
    );
    logger.info('[CHAT-STOP] Generation stopped');
  }, [abortStream, updateMessagesWithSync]);

  const addSystemMessage = useCallback(
    (content: string): string => {
      const systemMessage: Message = {
        id: createMessageId(),
        role: 'system',
        content,
        timestamp: new Date(),
        isStreaming: false,
      };
      updateMessagesWithSync((prev) => [...prev, systemMessage]);
      return systemMessage.id;
    },
    [updateMessagesWithSync]
  );

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  // Load messages when conversation changes
  useEffect(() => {
    const conversationId = initialConversationId;
    
    // Skip if no conversation ID
    if (!conversationId) {
      updateMessagesWithSync(() => []);
      setConversationNotFound(false);
      loadedConversationRef.current = null;
      setCurrentConversationId(null);
      return;
    }
    
    // Skip if already loaded this conversation
    if (loadedConversationRef.current === conversationId) {
      return;
    }

    // Update current conversation ID
    setCurrentConversationId(conversationId);
    
    // Load messages
    loadMessages(conversationId);
    
    // Cleanup: abort loading on unmount or conversation change
    return () => {
      if (loadingAbortRef.current) {
        loadingAbortRef.current.abort();
      }
    };
  }, [initialConversationId, loadMessages, updateMessagesWithSync]);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    stopGeneration,
    clearMessages,
    regenerateLastMessage,
    retryLastMessage,
    addSystemMessage,
    conversationNotFound,
    isLoadingMessages,
  };
}

export default useChat;
