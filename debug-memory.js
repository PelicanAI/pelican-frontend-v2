// Debug Memory Issue - Test Script
// Run this in browser console on http://localhost:3000

console.log("🔍 Pelican Memory Debug Test");
console.log("=============================");

// Test 1: Check if we're authenticated
async function checkAuth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    console.log("✅ Server is running:", data);
    return true;
  } catch (error) {
    console.log("❌ Server not responding:", error);
    return false;
  }
}

// Test 2: Send test message and check logs
async function testMemorySequence() {
  console.log("\n🧪 Testing Memory Sequence:");
  console.log("1. Sending: 'Test memory: I own 500 shares of TSLA at $240'");
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Test memory: I own 500 shares of TSLA at $240'
          }
        ],
        conversationId: null,
        guestMode: false,
        isFirstMessage: true
      })
    });
    
    if (response.ok) {
      console.log("✅ First message sent successfully");
      console.log("📝 Check server logs for:");
      console.log("   - [INFO] Created new conversation");
      console.log("   - [INFO] Messages saved to conversation");
      
      // Wait a moment then send follow-up
      setTimeout(async () => {
        console.log("\n2. Sending: 'How many TSLA shares do I own?'");
        
        const followUpResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: 'Test memory: I own 500 shares of TSLA at $240'
              },
              {
                role: 'assistant', 
                content: 'I understand you own 500 shares of TSLA at $240.'
              },
              {
                role: 'user',
                content: 'How many TSLA shares do I own?'
              }
            ],
            conversationId: 'test-conversation-id', // You'll need to get this from first response
            guestMode: false,
            isFirstMessage: false
          })
        });
        
        if (followUpResponse.ok) {
          console.log("✅ Follow-up message sent");
          console.log("📝 Check server logs for:");
          console.log("   - [INFO] Retrieved conversation context { messageCount: X }");
          console.log("   - [INFO] Calling Pelican API { contextLength: X }");
          console.log("   - If contextLength > 0, memory is working!");
          console.log("   - If contextLength = 0, memory is broken!");
        }
      }, 2000);
      
    } else {
      console.log("❌ Failed to send message:", response.status);
    }
  } catch (error) {
    console.log("❌ Error sending message:", error);
  }
}

// Test 3: Check localStorage for guest data
function checkGuestMode() {
  console.log("\n🔍 Checking Guest Mode:");
  const guestUserId = localStorage.getItem('pelican_guest_user_id');
  const guestConversations = localStorage.getItem('pelican_guest_conversations');
  
  console.log("Guest User ID:", guestUserId);
  console.log("Guest Conversations:", guestConversations);
  
  if (guestUserId) {
    console.log("⚠️  You're in guest mode - memory won't work!");
    console.log("   Sign in to test memory properly");
  } else {
    console.log("✅ Not in guest mode - memory should work");
  }
}

// Run all tests
async function runDebugTests() {
  console.log("Starting debug tests...\n");
  
  await checkAuth();
  checkGuestMode();
  
  console.log("\n📋 Next Steps:");
  console.log("1. Check server terminal for logs");
  console.log("2. Look for 'contextLength' in logs");
  console.log("3. If contextLength = 0, run database fix SQL");
  console.log("4. If contextLength > 0 but AI doesn't remember, check backend PEL_MEMORY_ENABLED");
  
  // Uncomment to run the memory test
  // await testMemorySequence();
}

// Export for manual testing
window.debugMemory = {
  checkAuth,
  testMemorySequence,
  checkGuestMode,
  runDebugTests
};

console.log("💡 Run: debugMemory.runDebugTests() to start");
console.log("💡 Run: debugMemory.testMemorySequence() to test memory");
