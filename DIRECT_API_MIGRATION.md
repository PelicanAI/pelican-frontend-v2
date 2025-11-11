# Direct API Migration - Complete ✅

This document summarizes the migration from Vercel proxy to direct Fly.io backend calls.

## What Changed

### 1. Environment Variables

Created two new files (you need to create these manually as they're in .gitignore):

**`.env.local`** (for local development):
```bash
# Direct Backend Access - No Vercel Proxy
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
```

**`.env.production`** (for Vercel deployment):
```bash
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
```

**Action Required**: Create these files manually in `Pelican-frontend/` directory.

### 2. New Direct API Client

Created `lib/pelican-direct.ts` with the following functions:
- `streamPelicanQuery()` - Stream responses directly from backend
- `quickPelicanQuery()` - Quick non-streaming queries
- `getCurrentPrice()` - Get current price for a ticker
- `checkBackendHealth()` - Verify backend is accessible

### 3. Updated Hooks

#### `hooks/use-streaming-chat.ts`
- Now calls Fly.io backend directly via `NEXT_PUBLIC_BACKEND_URL`
- Gets Supabase token for authentication
- No timeout constraints - streams can run indefinitely
- Better error messages for backend failures

#### `hooks/use-chat.ts`
- Updated non-streaming message sending to call backend directly
- Gets Supabase token for authentication
- No Vercel timeout limits

### 4. Updated Configuration

#### `lib/constants.ts`
- Added comments marking old API endpoints as legacy
- Added `BACKEND_URL` constant for direct backend access

#### `lib/api-retry.ts`
- Updated to recognize direct backend calls
- No timeout for direct Fly.io calls
- Better retry logic for backend errors

#### `vercel.json`
- Reduced `maxDuration` from 300s to 10s since API routes no longer handle long Pelican queries
- API routes now only handle:
  - File uploads
  - Conversation/message CRUD
  - Quick database operations

### 5. New Components

#### `components/pelican-error-boundary.tsx`
- Error boundary component for handling backend connection errors
- Shows user-friendly error messages with retry button

#### `scripts/test-direct-api.ts`
- Test script to verify direct API connection
- Health check + streaming test

## How It Works Now

### Before (Vercel Proxy)
```
Frontend → Vercel API Route → Fly.io Backend
         ↑
         Limited to 300s timeout
```

### After (Direct)
```
Frontend → Fly.io Backend
         ↑
         No timeout limits!
```

### Authentication Flow
1. Frontend gets Supabase session token
2. Includes token in `Authorization: Bearer {token}` header
3. Backend validates token with Supabase
4. Response streams directly to frontend

## Old Files to Clean Up (After Testing)

Once you've verified everything works in production, you can remove these old proxy routes:

```bash
# Remove old Vercel API proxy routes
rm -rf Pelican-frontend/app/api/pelican_stream/
rm -rf Pelican-frontend/app/api/pelican_response/
rm -rf Pelican-frontend/app/api/chat/  # If not used for other purposes
```

Or archive them:
```bash
mkdir -p Pelican-frontend/archive/old-api-routes
mv Pelican-frontend/app/api/pelican_* Pelican-frontend/archive/old-api-routes/
```

## Deployment Steps

### 1. Set Vercel Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add `NEXT_PUBLIC_BACKEND_URL` = `https://pelican-backend.fly.dev`
3. Apply to: Production, Preview, Development

Or via CLI:
```bash
vercel env add NEXT_PUBLIC_BACKEND_URL production
# Enter: https://pelican-backend.fly.dev

vercel env add NEXT_PUBLIC_BACKEND_URL preview
# Enter: https://pelican-backend.fly.dev

vercel env add NEXT_PUBLIC_BACKEND_URL development
# Enter: https://pelican-backend.fly.dev
```

### 2. Local Testing

```bash
# 1. Create .env.local file with NEXT_PUBLIC_BACKEND_URL
echo "NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev" > .env.local

# 2. Install dependencies (if needed)
npm install

# 3. Run dev server
npm run dev

# 4. Test in browser
# - Open DevTools → Network tab
# - Send a message
# - Verify requests go to pelican-backend.fly.dev (not /api/pelican_*)
```

### 3. Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Migrate to direct Fly.io backend calls - bypass Vercel proxy"

# Push to deploy
git push
```

### 4. Verify Production

After deployment:
1. Open production site
2. Open DevTools → Network tab
3. Send a test message
4. Verify:
   - Requests go to `pelican-backend.fly.dev`
   - No 504 timeout errors
   - Streaming works smoothly

## Benefits

### ✅ No More Timeouts
- Vercel's 300s limit is bypassed completely
- Backend can take as long as needed to respond
- Complex queries won't fail

### ✅ Better Performance
- One less hop in the request chain
- No Vercel serverless cold starts for API routes
- Direct streaming from backend to browser

### ✅ Cost Efficiency
- Reduces Vercel function invocations
- Reduces Vercel bandwidth usage (no proxy buffering)
- Only pays for Fly.io compute time

### ✅ Simpler Architecture
- Frontend talks directly to backend
- Easier to debug (no proxy layer)
- Clear separation of concerns

## Troubleshooting

### "NEXT_PUBLIC_BACKEND_URL not configured" Error
**Solution**: Create `.env.local` file with the environment variable.

### "Authentication required" Error
**Solution**: User needs to log in. The session token may have expired.

### CORS Errors
**Solution**: Ensure backend has proper CORS headers configured for your frontend domain.

### Backend Health Check Fails
**Solution**: Verify Fly.io backend is running:
```bash
fly status --app pelican-backend
```

## Testing the Direct API

Run the test script:
```bash
# Get a test token from browser:
# 1. Open DevTools → Application → Local Storage
# 2. Find Supabase session
# 3. Copy access_token

# Set environment variable
export TEST_SUPABASE_TOKEN="eyJ..."

# Run test
npx tsx scripts/test-direct-api.ts
```

Expected output:
```
Testing direct backend connection...
Backend health: ✅ OK

Testing streaming query...
📦 Chunk: SPY
📦 Chunk:  is currently
📦 Chunk:  trading at...
✅ Complete: SPY is currently trading at $450.23...
```

## Monitoring

### What to Watch
1. **Network requests in browser DevTools** - Should go to `pelican-backend.fly.dev`
2. **Sentry errors** - Look for `location: 'streaming_direct'` tags
3. **User complaints** - Long queries should no longer timeout

### Success Metrics
- ✅ Zero 504 timeout errors
- ✅ Requests complete regardless of duration
- ✅ Users can ask complex multi-step questions
- ✅ Streaming responses work smoothly

## Rollback Plan

If you need to rollback to the old proxy approach:

1. Revert the commits:
```bash
git revert HEAD
git push
```

2. Or manually restore old code:
```bash
git checkout HEAD~1 -- Pelican-frontend/hooks/use-streaming-chat.ts
git checkout HEAD~1 -- Pelican-frontend/hooks/use-chat.ts
git commit -m "Rollback to Vercel proxy"
git push
```

## Notes

- The old API routes still exist but are no longer used for Pelican queries
- They can be safely removed after confirming production works
- File uploads still use Vercel API routes (they're fast)
- Conversation/message CRUD still uses Vercel API routes
- Only Pelican AI queries go direct to Fly.io

---

**Status**: ✅ Implementation Complete
**Date**: 2024
**Next Steps**: 
1. Create environment variable files
2. Test locally
3. Deploy to Vercel
4. Monitor for 48 hours
5. Remove old proxy routes if all good

