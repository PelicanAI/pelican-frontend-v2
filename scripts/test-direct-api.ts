import { streamPelicanQuery, checkBackendHealth } from '../lib/pelican-direct';

async function testDirectAPI() {
  console.log('Testing direct backend connection...');
  
  // 1. Health check
  const isHealthy = await checkBackendHealth();
  console.log('Backend health:', isHealthy ? '✅ OK' : '❌ FAILED');
  
  if (!isHealthy) {
    console.error('Backend is not accessible!');
    return;
  }

  // 2. Test streaming with a real token
  const testToken = process.env.TEST_SUPABASE_TOKEN || "eyJ...your-test-token"; // Get from browser DevTools → Application → Local Storage → Supabase session
  
  console.log('\nTesting streaming query...');
  
  await streamPelicanQuery(
    {
      query: "What's SPY at?",
      onChunk: (chunk) => console.log("📦 Chunk:", chunk),
      onComplete: (response) => console.log("✅ Complete:", response),
      onError: (error) => console.error("❌ Error:", error),
    },
    testToken
  );
}

// Run: npx tsx scripts/test-direct-api.ts
testDirectAPI().catch(console.error);

