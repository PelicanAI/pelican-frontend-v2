/**
 * Parse Server-Sent Events (SSE) from a ReadableStream
 * Handles backend streaming format: data: {json}\n\n
 */
export interface SSEMessage {
  type: 'status' | 'content' | 'attachments' | 'done' | 'error' | 'conversationId';
  message?: string;      // For status events
  delta?: string;        // For content events (token chunks)
  data?: Array<{ type: string; name: string; url: string }>; // For attachments events
  full_response?: string; // For done events
  latency_ms?: number;   // For done events
  conversationId?: string; // For conversationId events
}

export class SSEParser {
  private decoder = new TextDecoder();
  private buffer = '';
  private readonly MAX_BUFFER_SIZE = 1024 * 1024; // 1MB limit
  private readonly MAX_LINE_SIZE = 100 * 1024; // 100KB per line

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
        
        // Safety check: buffer overflow protection
        if (this.buffer.length > this.MAX_BUFFER_SIZE) {
          console.error('[SSE] Buffer overflow detected, clearing buffer');
          this.buffer = '';
          throw new Error('SSE buffer overflow - possible attack or malformed stream');
        }
        
        // Split by double newline (SSE message delimiter)
        const lines = this.buffer.split('\n\n');
        
        // Keep last incomplete line in buffer
        this.buffer = lines.pop() || '';
        
        // Process complete messages
        for (const line of lines) {
          // Safety check: line size limit
          if (line.length > this.MAX_LINE_SIZE) {
            console.error('[SSE] Line too large, skipping:', line.slice(0, 100));
            continue;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove "data: " prefix
              const message: SSEMessage = JSON.parse(jsonStr);
              yield message;
            } catch (e) {
              console.error('[SSE] Failed to parse message:', e, line.slice(0, 100));
              // Don't accumulate garbage - continue processing
            }
          }
        }
      }
    } catch (error) {
      // Clear buffer on any error
      this.buffer = '';
      throw error;
    } finally {
      reader.releaseLock();
      this.buffer = ''; // Clear buffer on cleanup
    }
  }
}
