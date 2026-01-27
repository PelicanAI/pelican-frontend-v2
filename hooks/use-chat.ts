/**
 * Chat Hook - Production Grade Implementation
 * =============================================
 * 
 * This hook manages conversation state and message sending with:
 * - Message loading when conversation changes
 * - Synchronous state/ref updates to prevent race conditions
 * - Proper conversation history capture before API calls
 * - Backend-handled message persistence (no dual persistence)
 * - THROTTLED streaming updates to prevent UI crashes on large responses
 * 
 * @author Pelican Engineering
 * @version 3.1.0 - Added streaming throttle
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStreamingChat } from './use-streaming-chat';
import { logger } from '@/lib/logger';
import type { Message, Attachment } from '@/lib/chat-utils';

// =============================================================================
// CONSTANTS
// =============================================================================

const LIMITS = {
  MESSAGE_CONTEXT: 150,
  MAX_MESSAGE_LENGTH: 50000,
  MIN_MESSAGE_LENGTH: 1,
};

// FIX: Throttle streaming UI updates to prevent crashes on large responses
const STREAMING_THROTTLE_MS = 50; // Update UI max 20 times/second

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
  attachments?: Attachment[];
  skipUserMessage?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createUserMessage(content: string, attachments?: Attachment[]): Message {
  return {
    id: createMessageId(),
    role: 'user',
    content: content,
    timestamp: new Date(),
    isStreaming: false,
    attachments: attachments,
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
  // SESSION BACKUP HELPERS
  // ---------------------------------------------------------------------------

  const STORAGE_PREFIX = 'pelican_chat_backup_';
  const LAST_CONVERSATION_KEY = 'pelican_last_conversation_id';

  const getBackupKey = useCallback((conversationId: string) => {
    return `${STORAGE_PREFIX}${conversationId}`;
  }, []);

  const safeSessionStorageGet = useCallback((key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }, []);

  const safeSessionStorageSet = useCallback((key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Ignore storage failures (private mode, disabled storage, quota, etc.)
    }
  }, []);

  const safeSessionStorageRemove = useCallback((key: string) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore storage failures
    }
  }, []);

  const serializeMessages = useCallback((messagesToStore: Message[]) => {
    return messagesToStore.map((msg) => ({
      ...msg,
      timestamp:
        msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
    }));
  }, []);

  const loadBackupMessages = useCallback(
    (conversationId: string): Message[] | null => {
      const raw = safeSessionStorageGet(getBackupKey(conversationId));
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        return parsed.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }));
      } catch {
        return null;
      }
    },
    [getBackupKey]
  );

  const persistBackupMessages = useCallback(
    (conversationId: string, nextMessages: Message[]) => {
      const payload = JSON.stringify(serializeMessages(nextMessages));
      safeSessionStorageSet(getBackupKey(conversationId), payload);
      safeSessionStorageSet(LAST_CONVERSATION_KEY, conversationId);
    },
    [getBackupKey, serializeMessages, safeSessionStorageSet]
  );

  const moveBackupMessages = useCallback(
    (fromId: string, toId: string) => {
      const raw = safeSessionStorageGet(getBackupKey(fromId));
      if (raw) {
        safeSessionStorageSet(getBackupKey(toId), raw);
        safeSessionStorageRemove(getBackupKey(fromId));
      }
      safeSessionStorageSet(LAST_CONVERSATION_KEY, toId);
    },
    [getBackupKey, safeSessionStorageGet, safeSessionStorageRemove, safeSessionStorageSet]
  );

  // ---------------------------------------------------------------------------
  // REFS
  // ---------------------------------------------------------------------------

  const messagesRef = useRef<Message[]>([]);
  const loadedConversationRef = useRef<string | null>(null);
  const lastSentMessageRef = useRef<string | null>(null);
  const loadingAbortRef = useRef<AbortController | null>(null);
  const currentConversationIdRef = useRef<string | null>(currentConversationId);
  const tempConversationIdRef = useRef<string | null>(null);
  
  // FIX: Refs for streaming throttle
  const lastStreamingUpdateRef = useRef<number>(0);
  const pendingStreamingContentRef = useRef<string>('');
  const streamingFlushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (loadingAbortRef.current) {
      loadingAbortRef.current.abort();
    }
    
    const abortController = new AbortController();
    loadingAbortRef.current = abortController;
    
    logger.info('[CHAT-LOAD] Loading conversation', { conversationId });
    setIsLoadingMessages(true);
    setError(null);
    setConversationNotFound(false);
    
    updateMessagesWithSync(() => []);
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        signal: abortController.signal,
      });
      
      if (abortController.signal.aborted) {
        return false;
      }
      
      if (response.status === 404) {
        logger.info('[CHAT-LOAD] No messages yet (new conversation)', { conversationId });
        const backup = loadBackupMessages(conversationId);
        if (backup && backup.length > 0) {
          logger.info('[CHAT-LOAD] Restoring messages from session backup', {
            conversationId,
            count: backup.length,
          });
          updateMessagesWithSync(() => backup);
          loadedConversationRef.current = conversationId;
          setConversationNotFound(false);
          return true;
        }
        updateMessagesWithSync(() => []);
        loadedConversationRef.current = conversationId;
        setConversationNotFound(false);
        return true;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (abortController.signal.aborted) {
        return false;
      }
      
      const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
        id: msg.id || createMessageId(),
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at || Date.now()),
        isStreaming: false,
      }));
      
      if (loadedMessages.length === 0) {
        const backup = loadBackupMessages(conversationId);
        if (backup && backup.length > 0) {
          logger.info('[CHAT-LOAD] Restoring messages from session backup', {
            conversationId,
            count: backup.length,
          });
          updateMessagesWithSync(() => backup);
          loadedConversationRef.current = conversationId;
          return true;
        }
      }

      logger.info('[CHAT-LOAD] Loaded messages', {
        conversationId,
        count: loadedMessages.length,
      });
      
      updateMessagesWithSync(() => loadedMessages);
      loadedConversationRef.current = conversationId;
      return true;
      
    } catch (err) {
      if (abortController.signal.aborted) {
        return false;
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (error.name !== 'AbortError') {
        logger.error('[CHAT-LOAD] Failed to load messages', error);
        const backup = loadBackupMessages(conversationId);
        if (backup && backup.length > 0) {
          logger.info('[CHAT-LOAD] Restoring messages from session backup after error', {
            conversationId,
            count: backup.length,
          });
          updateMessagesWithSync(() => backup);
          loadedConversationRef.current = conversationId;
          return true;
        }
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
  }, [updateMessagesWithSync, onError, loadBackupMessages]);

  // ---------------------------------------------------------------------------
  // SEND MESSAGE - STREAMING (with throttle fix)
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
      
      // FIX: Reset streaming throttle state
      lastStreamingUpdateRef.current = 0;
      pendingStreamingContentRef.current = '';
      if (streamingFlushTimeoutRef.current) {
        clearTimeout(streamingFlushTimeoutRef.current);
        streamingFlushTimeoutRef.current = null;
      }

      const userMessage = createUserMessage(content, sendOptions.attachments);
      const conversationHistory = captureConversationHistory();
      let conversationIdForSend = currentConversationIdRef.current;

      if (!conversationIdForSend) {
        const tempId = `temp_${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : createMessageId()}`;
        tempConversationIdRef.current = tempId;
        conversationIdForSend = tempId;
        loadedConversationRef.current = tempId;
        setCurrentConversationId(tempId);
        onConversationCreated?.(tempId);
      }

      logger.info('[CHAT-SEND] Preparing to send message', {
        messageLength: content.length,
        historyLength: conversationHistory.length,
        conversationId: conversationIdForSend,
        isNewConversation: !currentConversationIdRef.current,
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
            // FIX: Throttled onChunk handler
            onChunk: (chunk: string) => {
              const now = Date.now();
              pendingStreamingContentRef.current += chunk;
              
              // Check if we should update the UI
              const timeSinceLastUpdate = now - lastStreamingUpdateRef.current;
              
              if (timeSinceLastUpdate >= STREAMING_THROTTLE_MS) {
                // Enough time has passed, update now
                const contentToRender = pendingStreamingContentRef.current;
                pendingStreamingContentRef.current = '';
                lastStreamingUpdateRef.current = now;
                
                updateMessagesWithSync((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + contentToRender }
                      : msg
                  )
                );
              } else {
                // Schedule a flush if not already scheduled
                if (!streamingFlushTimeoutRef.current) {
                  streamingFlushTimeoutRef.current = setTimeout(() => {
                    streamingFlushTimeoutRef.current = null;
                    if (pendingStreamingContentRef.current) {
                      const contentToRender = pendingStreamingContentRef.current;
                      pendingStreamingContentRef.current = '';
                      lastStreamingUpdateRef.current = Date.now();
                      
                      updateMessagesWithSync((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: msg.content + contentToRender }
                            : msg
                        )
                      );
                    }
                  }, STREAMING_THROTTLE_MS - timeSinceLastUpdate);
                }
              }
            },
            onComplete: async (fullResponse: string, newConversationId?: string) => {
              // FIX: Clear any pending flush timeout
              if (streamingFlushTimeoutRef.current) {
                clearTimeout(streamingFlushTimeoutRef.current);
                streamingFlushTimeoutRef.current = null;
              }
              pendingStreamingContentRef.current = '';
              
              if (newConversationId && newConversationId !== conversationIdForSend) {
                logger.info('[CHAT-COMPLETE] Capturing conversation ID from backend', {
                  conversationId: newConversationId,
                });
                
                // FIX: Prevent useEffect from refetching messages
                loadedConversationRef.current = newConversationId;

                if (tempConversationIdRef.current) {
                  moveBackupMessages(tempConversationIdRef.current, newConversationId);
                  tempConversationIdRef.current = null;
                }

                setCurrentConversationId(newConversationId);
                onConversationCreated?.(newConversationId);
              }

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
                conversationId: newConversationId || currentConversationId,
              });
            },
            onError: (err: Error) => {
              // FIX: Clear streaming state on error
              if (streamingFlushTimeoutRef.current) {
                clearTimeout(streamingFlushTimeoutRef.current);
                streamingFlushTimeoutRef.current = null;
              }
              pendingStreamingContentRef.current = '';
              
              setError(err);
              onError?.(err);
              updateMessagesWithSync((prev) =>
                prev.filter((msg) => msg.id !== assistantMessageId)
              );
              logger.error('[CHAT-ERROR] Streaming error', err);
            },
          },
          conversationIdForSend,
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
      onError,
      onMessageSent,
      onResponseComplete,
      onFinish,
      onConversationCreated,
      sendStreamingMessage,
      updateMessagesWithSync,
      moveBackupMessages,
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
    
    // FIX: Clear streaming throttle state on stop
    if (streamingFlushTimeoutRef.current) {
      clearTimeout(streamingFlushTimeoutRef.current);
      streamingFlushTimeoutRef.current = null;
    }
    pendingStreamingContentRef.current = '';
    
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

  const loadMessagesRef = useRef(loadMessages);
  loadMessagesRef.current = loadMessages;

  useEffect(() => {
    const conversationId = initialConversationId;
    
    if (!conversationId) {
      const lastConversationId = safeSessionStorageGet(LAST_CONVERSATION_KEY);
      if (lastConversationId) {
        const backup = loadBackupMessages(lastConversationId);
        if (backup && backup.length > 0) {
          logger.info('[CHAT-LOAD] Restoring messages from session backup (no URL param)', {
            conversationId: lastConversationId,
            count: backup.length,
          });
          updateMessagesWithSync(() => backup);
          loadedConversationRef.current = lastConversationId;
          setCurrentConversationId(lastConversationId);
          onConversationCreated?.(lastConversationId);
          return;
        }
      }

      if (messagesRef.current.length > 0) {
        setMessages([]);
        messagesRef.current = [];
      }
      setConversationNotFound(false);
      loadedConversationRef.current = null;
      setCurrentConversationId(null);
      return;
    }
    
    if (loadedConversationRef.current === conversationId) {
      return;
    }

    setCurrentConversationId(conversationId);
    loadMessagesRef.current(conversationId);
    
    return () => {
      if (loadingAbortRef.current) {
        loadingAbortRef.current.abort();
      }
    };
  }, [initialConversationId, loadBackupMessages, onConversationCreated, updateMessagesWithSync, safeSessionStorageGet]);

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  useEffect(() => {
    if (currentConversationId) {
      persistBackupMessages(currentConversationId, messages);
    }
  }, [currentConversationId, messages, persistBackupMessages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // FIX: Cleanup streaming timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingFlushTimeoutRef.current) {
        clearTimeout(streamingFlushTimeoutRef.current);
      }
    };
  }, []);

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
