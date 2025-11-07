// Test script for streaming functionality
const fetch = require('node-fetch');

async function testNonStreamingEndpoint() {
  console.log('=== Testing Non-Streaming Endpoint ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/pelican_response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "What's AAPL at?",
        conversationHistory: [],
      }),
    });

    if (!response.ok) {
      console.log('❌ Non-streaming endpoint failed:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response:', text);
    } else {
      const data = await response.json();
      console.log('✅ Non-streaming endpoint works');
      console.log('Response preview:', data.choices?.[0]?.message?.content?.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('❌ Error calling non-streaming endpoint:', error.message);
  }
}

async function testStreamingEndpoint() {
  console.log('\n=== Testing Streaming Endpoint ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/pelican_stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "What's AAPL at?",
        conversationHistory: [],
      }),
    });

    if (!response.ok) {
      console.log('❌ Streaming endpoint failed:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response:', text);
    } else {
      console.log('✅ Streaming endpoint accessible');
      console.log('Content-Type:', response.headers.get('content-type'));
      
      // Read a bit of the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chunks = 0;
      
      while (chunks < 3) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        console.log(`Chunk ${chunks + 1}:`, chunk.substring(0, 100) + '...');
        chunks++;
      }
      
      reader.releaseLock();
    }
  } catch (error) {
    console.log('❌ Error calling streaming endpoint:', error.message);
  }
}

async function runTests() {
  console.log('Starting API endpoint tests...\n');
  
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await testNonStreamingEndpoint();
  await testStreamingEndpoint();
  
  console.log('\n✅ Test script complete');
}

runTests().catch(console.error);
