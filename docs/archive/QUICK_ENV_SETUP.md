# 🚀 Quick Environment Setup Guide

## ⚠️ CRITICAL: Your App Won't Work Without These

Your `.env.local` file has been created with placeholders. **You MUST replace these values for the app to work.**

---

## 📝 Step 1: Get Your Supabase Credentials

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your Pelican project**
3. **Click Settings → API** (in the left sidebar)
4. **Copy these values:**

| What to Copy | Where to Find It | Where to Paste It |
|--------------|------------------|-------------------|
| **Project URL** | Settings → API → Project URL | `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL` |
| **anon public** | Settings → API → Project API keys → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** | Settings → API → Project API keys → `service_role` ⚠️ | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ **Security Warning**: The `service_role` key bypasses Row Level Security. **Never** expose it in client-side code or commit it to Git!

---

## 📝 Step 2: Update `.env.local`

Open `Pelican-frontend/.env.local` and replace the placeholders:

### Before (Placeholders):
```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE
```

### After (Your Real Values):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Step 3: Get Your Pelican API Key (If Needed)

If your backend requires an API key:

```bash
PEL_API_KEY=your_actual_api_key
```

If your backend is **public** (no auth), you can leave this as is or set it to anything:

```bash
PEL_API_KEY=not-required
```

---

## 📝 Step 4: Restart Your Dev Server

**In PowerShell/Terminal:**

```powershell
# Stop current server (Ctrl + C in the terminal where it's running)
# Then restart:
cd "C:\Users\grove\Desktop\Pelican Docs\pelican-chat\Pelican-frontend"
npm run dev
```

**You should see:**
```
✓ Ready in X.Xs
- Local: http://localhost:3007
```

**WITHOUT** the Supabase error!

---

## 🧪 Step 5: Test Your Setup

### Test 1: Visit the App
Open: http://localhost:3007

You should see the app load **without middleware errors**.

### Test 2: Run Browser Console Diagnostic

Once the app loads, open **Browser Console** (F12) and paste:

```javascript
// Test Supabase connection
const { createClient } = await import('/node_modules/@supabase/supabase-js/dist/module/index.js');
const supabase = createClient(
  'YOUR_SUPABASE_URL',  // Replace with your actual URL
  'YOUR_ANON_KEY'       // Replace with your actual anon key
);

const { data: { user } } = await supabase.auth.getUser();
console.log('✅ Supabase connected! User:', user?.id || 'Not signed in');

// Check if you can query conversations
const { data, error } = await supabase.from('conversations').select('id').limit(1);
console.log('✅ Database query test:', error ? '❌ Error: ' + error.message : '✅ Success');
```

### Test 3: Run Message Save Diagnostic

**After you're signed in and have a conversation open**, run this in console:

```javascript
// Get current conversation ID from URL
const conversationId = new URLSearchParams(window.location.search).get('conversation');
console.log('Conversation ID:', conversationId);

// Import Supabase client
const { createClient } = await import('/node_modules/@supabase/supabase-js/dist/module/index.js');
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
);

// Get current user
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);

// Try to insert a test message
const testResult = await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    user_id: user?.id,
    role: 'user',
    content: 'TEST MESSAGE FROM CONSOLE - ' + new Date().toISOString(),
    created_at: new Date().toISOString()
  });

console.log('Manual insert result:', testResult);
console.log(testResult.error ? '❌ FAILED' : '✅ SUCCESS - Check your chat!');
```

---

## ✅ Success Checklist

- [ ] `.env.local` file has real Supabase URL (not placeholder)
- [ ] `.env.local` file has real anon key (not placeholder)
- [ ] `.env.local` file has real service role key (not placeholder)
- [ ] Dev server restarts **without** Supabase errors
- [ ] App loads at http://localhost:3007
- [ ] Browser console test shows "✅ Supabase connected"
- [ ] Can sign in/sign up
- [ ] Messages are saving to database

---

## 🆘 Troubleshooting

### Problem: "Your project's URL and Key are required"

**Solution**: You didn't replace the placeholders in `.env.local`. Edit the file and add your real values.

### Problem: "Invalid API key"

**Solution**: 
1. Double-check you copied the **anon** key (not service_role) for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Make sure there are no extra spaces before/after the key
3. Make sure the key starts with `eyJ`

### Problem: Messages still not saving

**Solution**:
1. Verify Fix 1 is in `app/api/chat/route.ts` (lines 215-261)
2. Check browser Network tab for `/api/chat` requests
3. Look for Sentry errors in dashboard
4. Run the browser console diagnostic above

---

## 🎯 What Happens Next

Once your environment is configured:

1. **Middleware works** ✅ - No more Supabase errors
2. **Authentication works** ✅ - Sign in/sign up functional
3. **Message saving works** ✅ - Frontend Fix 1 saves messages
4. **Sentry tracking works** ✅ - Errors get reported
5. **File uploads work** ✅ - Can attach files to messages

**You're ready to test the full application!** 🚀

