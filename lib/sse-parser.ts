/**
 * Parse Server-Sent Events (SSE) from a ReadableStream
 * Handles backend streaming format: data: {json}\n\n
 */
export interface SSEMessage {
  type: 'status' | 'content' | 'attachments' | 'done' | 'error';
  message?: string;      // For status events
  delta?: string;        // For content events (token chunks)
  data?: any;           // For attachments events
  full_response?: string; // For done events
  latency_ms?: number;   // For done events
}

export class SSEParser {
  private decoder = new TextDecoder();
  private buffer = '';

  /**
   * Parse SSE stream and yield structured messages
   * @param reader ReadableStream reader from fetch response
   */
  async *parse(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<SSEMessage> {
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode chunk and add to buffer
        this.buffer += this.decoder.decode(value, { stream: true });
        
        // Split by double newline (SSE message delimiter)
        const lines = this.buffer.split('\n\n');
        
        // Keep last incomplete line in buffer
        this.buffer = lines.pop() || '';
        
        // Process complete messages
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove "data: " prefix
              const message: SSEMessage = JSON.parse(jsonStr);
              yield message;
            } catch (e) {
              console.error('[SSE] Failed to parse message:', e, line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
