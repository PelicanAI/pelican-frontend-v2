import { useState, useCallback, useRef } from 'react';
import { SSEParser, type SSEMessage } from '@/lib/sse-parser';
import type { Message } from '@/lib/chat-utils';

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
    conversationId?: string | null
  ) => {
    // Create abort controller for cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);
    
    try {
      callbacks.onStart?.();
      
      // POST to streaming endpoint
      const response = await fetch('/api/pelican_stream', {
        method: 'POST',
        headers: {
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
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
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
            callbacks.onError?.(event.message || 'Unknown error');
            break;
        }
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[Stream] Cancelled by user');
      } else {
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
