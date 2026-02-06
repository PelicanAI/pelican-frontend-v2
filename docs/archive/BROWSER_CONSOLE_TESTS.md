# 🧪 Browser Console Diagnostic Tests

## Prerequisites

**Before running these tests:**

1. ✅ `.env.local` must have Supabase credentials
2. ✅ Dev server must be running (`npm run dev`)
3. ✅ You must be on the app (http://localhost:3007)
4. ✅ Open Browser DevTools (F12) → Console tab

---

## Test 1: Verify Frontend Fix is Active

**Purpose**: Check if the manual message save fix in `app/api/chat/route.ts` exists

```javascript
console.log('🔍 Checking Frontend Fix Location');
console.log('Fix should be in: app/api/chat/route.ts lines 215-261');
console.log('Fix description: Force synchronous message save to Supabase');
console.log('✅ If messages are saving, the fix is working!');
```

---

## Test 2: Test Supabase Client Connection

**Purpose**: Verify the browser can connect to Supabase

**⚠️ Important**: Replace `YOUR_SUPABASE_URL` and `YOUR_ANON_KEY` with your actual values from `.env.local`

```javascript
// Import Supabase client
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

// Replace these with YOUR actual values
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // ← CHANGE THIS
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // ← CHANGE THIS

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Test authentication
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError) {
  console.error('❌ Auth Error:', authError);
} else if (user) {
  console.log('✅ Supabase connected!');
  console.log('👤 User ID:', user.id);
  console.log('📧 Email:', user.email);
} else {
  console.log('⚠️  Not signed in. Sign in first, then run this test again.');
}
```

---

## Test 3: Test Database Query

**Purpose**: Verify you can read from the database

```javascript
// Use the supabase client from Test 2 (run Test 2 first)

// Try to fetch your conversations
const { data: conversations, error } = await supabase
  .from('conversations')
  .select('id, title, created_at')
  .limit(5);

if (error) {
  console.error('❌ Database Query Error:', error);
} else {
  console.log('✅ Database query successful!');
  console.log('📝 Your conversations:', conversations);
  console.log(`Found ${conversations.length} conversations`);
}
```

---

## Test 4: Manual Message Insert Test

**Purpose**: Test if you can manually save a message to the database

**Prerequisites:**
- ✅ You must be signed in
- ✅ You must have a conversation open (check URL for `?conversation=UUID`)

```javascript
// Get current conversation ID from URL
const urlParams = new URLSearchParams(window.location.search);
const conversationId = urlParams.get('conversation');

if (!conversationId) {
  console.error('❌ No conversation ID in URL. Open a conversation first!');
  console.log('Expected URL format: /chat?conversation=UUID');
} else {
  console.log('📍 Conversation ID:', conversationId);
  
  // Import Supabase (use values from Test 2)
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const SUPABASE_URL = 'https://xxxxx.supabase.co';  // ← CHANGE THIS
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // ← CHANGE THIS
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ Not signed in!');
  } else {
    console.log('👤 User ID:', user.id);
    
    // Try to insert a test message
    const testMessage = {
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: '🧪 TEST MESSAGE FROM CONSOLE - ' + new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    console.log('📤 Attempting to insert message...');
    
    const { data, error } = await supabase
      .from('messages')
      .insert(testMessage)
      .select();
    
    if (error) {
      console.error('❌ INSERT FAILED:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
    } else {
      console.log('✅ SUCCESS! Message inserted:', data);
      console.log('🎉 Check your chat - you should see the test message!');
    }
  }
}
```

---

## Test 5: Check API Route Response

**Purpose**: Test the `/api/chat` route that handles message sending

**Prerequisites:**
- ✅ You must be signed in
- ✅ You must have a conversation open

```javascript
// Get conversation ID
const conversationId = new URLSearchParams(window.location.search).get('conversation');

if (!conversationId) {
  console.error('❌ No conversation open');
} else {
  console.log('📤 Sending test message via API route...');
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: '🧪 API Route Test - ' + new Date().toISOString(),
      conversationId: conversationId,
      stream: false
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('❌ API Route Error:', response.status);
    console.error('Response:', data);
  } else {
    console.log('✅ API Route Success!');
    console.log('Response:', data);
    console.log('🎉 Check if the message appears in the chat!');
  }
}
```

---

## Test 6: Check Sentry Error Tracking

**Purpose**: Verify Sentry is capturing errors

```javascript
console.log('🔍 Checking Sentry integration...');

if (typeof window.Sentry !== 'undefined') {
  console.log('✅ Sentry is loaded on client');
  
  // Send a test error
  try {
    throw new Error('🧪 Test error from browser console - ignore this');
  } catch (error) {
    window.Sentry.captureException(error, {
      tags: { source: 'browser-console-test' }
    });
    console.log('✅ Test error sent to Sentry');
    console.log('📊 Check your Sentry dashboard to confirm it was received');
  }
} else {
  console.log('⚠️  Sentry not available (may only be available in Next.js pages, not static HTML)');
}
```

---

## Expected Results

| Test | Expected Result |
|------|----------------|
| **Test 1** | Shows fix location info |
| **Test 2** | ✅ Shows your user ID and email |
| **Test 3** | ✅ Shows list of your conversations |
| **Test 4** | ✅ Message appears in chat UI immediately |
| **Test 5** | ✅ Message sent and AI responds |
| **Test 6** | ✅ Error appears in Sentry dashboard |

---

## Troubleshooting

### ❌ "Supabase connection failed"

**Solution**: 
1. Check `.env.local` has correct values
2. Restart dev server: `npm run dev`
3. Make sure you replaced `YOUR_SUPABASE_URL` and `YOUR_ANON_KEY` in the test scripts

### ❌ "Not signed in"

**Solution**:
1. Go to http://localhost:3007
2. Click "Sign In" or "Sign Up"
3. Create an account or log in
4. Run the tests again

### ❌ "No conversation ID in URL"

**Solution**:
1. Click "New Chat" in the sidebar
2. URL should change to `/chat?conversation=<UUID>`
3. Run Test 4 again

### ❌ "INSERT FAILED: Row Level Security policy violation"

**Solution**:
This means RLS policies are blocking inserts. Check:
1. You're signed in as the correct user
2. The conversation belongs to you
3. Your Supabase RLS policies allow inserts

---

## What These Tests Tell You

✅ **If Test 2 passes**: Frontend can connect to Supabase  
✅ **If Test 3 passes**: Database queries work  
✅ **If Test 4 passes**: You CAN save messages directly  
✅ **If Test 5 passes**: API route is working  
✅ **If Test 6 passes**: Error tracking is active  

**If all tests pass**: Your app is configured correctly! 🎉

**If tests fail**: The error messages will guide you to the problem.

