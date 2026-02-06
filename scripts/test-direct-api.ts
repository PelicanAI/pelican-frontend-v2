import { streamPelicanQuery, checkBackendHealth } from '../lib/pelican-direct';

async function testDirectAPI() {
  // 1. Health check
  const isHealthy = await checkBackendHealth();

  if (!isHealthy) {
    console.error('Backend is not accessible!');
    return;
  }

  // 2. Test streaming with a real token
  const testToken = process.env.TEST_SUPABASE_TOKEN || "eyJ...your-test-token"; // Get from browser DevTools → Application → Local Storage → Supabase session

  await streamPelicanQuery(
    {
      query: "What's SPY at?",
      onChunk: () => {},
      onComplete: () => {},
      onError: (error) => console.error("Error:", error),
    },
    testToken
  );
}

// Run: npx tsx scripts/test-direct-api.ts
testDirectAPI().catch(console.error);

