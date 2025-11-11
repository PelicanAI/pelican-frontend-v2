/**
 * Direct Pelican API Client - Calls Fly.io backend directly
 * Bypasses Vercel proxy to avoid timeout constraints
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev';

export interface StreamOptions {
  query: string;
  conversationId?: string;
  sessionId?: string;
  messages?: Array<{ role: string; content: string }>;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

/**
 * Stream responses from Pelican backend directly
 * No Vercel timeout constraints - can run indefinitely
 */
export async function streamPelicanQuery(
  options: StreamOptions,
  supabaseToken: string
): Promise<void> {
  const { 
    query, 
    conversationId, 
    sessionId, 
    messages,
    onChunk, 
    onComplete, 
    onError, 
    signal 
  } = options;

  try {
    const response = await fetch(`${BACKEND_URL}/api/pelican_stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        conversation_id: conversationId,
        session_id: sessionId,
        messages: messages || [],
      }),
      signal, // Allow request abortion
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from backend');
    }

    // Stream response chunks
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;

      if (onChunk) {
        onChunk(chunk);
      }
    }

    if (onComplete) {
      onComplete(fullResponse);
    }

  } catch (error) {
    console.error('[PELICAN-DIRECT] Stream error:', error);
    
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } else {
      throw error;
    }
  }
}

/**
 * Quick non-streaming query (for simple requests < 30s)
 */
export async function quickPelicanQuery(
  query: string,
  supabaseToken: string,
  conversationId?: string,
  sessionId?: string
): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/pelican_response`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      query,
      conversation_id: conversationId,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.response || data.message || data.text || '';
}

/**
 * Get current price (fast endpoint)
 */
export async function getCurrentPrice(
  ticker: string,
  supabaseToken: string
): Promise<{
  ticker: string;
  price: number;
  change: number;
  change_pct: number;
  timestamp: string;
}> {
  const response = await fetch(`${BACKEND_URL}/api/price/${ticker}`, {
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get price for ${ticker}: ${response.status}`);
  }

  return response.json();
}

/**
 * Health check - verify backend is accessible
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('[PELICAN-DIRECT] Health check failed:', error);
    return false;
  }
}

