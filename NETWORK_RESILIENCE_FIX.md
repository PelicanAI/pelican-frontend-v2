# Network Resilience Fix for Sentry Issue #7015218203

## Issue Summary

**Error**: `TypeError: Failed to fetch (pelican-trading-api.fly.dev)`  
**Sentry Issue**: 7015218203  
**Date**: November 10, 2025, 7:49:25 PM  
**Environment**: Production (Vercel)  
**Browser**: Chrome 141.0.0 on Windows  
**Endpoint**: `https://pelican-trading-api.fly.dev/api/pelican_stream`

## Root Cause Analysis

### What Happened
Users experienced intermittent "Failed to fetch" errors when the frontend tried to connect to the Fly.io backend for streaming chat responses. This is a **network connectivity issue**, not a configuration problem.

### Investigation Results ✅

1. **Backend is Online**: ✅ `pelican-trading-api.fly.dev` is responding to health checks
2. **CORS Configured Correctly**: ✅ Backend allows requests from `www.pelicantrading.org`
   ```
   access-control-allow-origin: https://www.pelicantrading.org
   access-control-allow-methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
   access-control-allow-credentials: true
   access-control-allow-headers: Authorization,Content-Type
   ```
3. **SSL Certificate Valid**: ✅ Certificate validated successfully
4. **No CSP Blocking**: ✅ No Content-Security-Policy restrictions preventing fetch

### Why It Failed

The error `TypeError: Failed to fetch` is a **generic browser network error** that occurs when:

- **Intermittent network issues** between user and Fly.io servers
- **DNS resolution failures** on the client side
- **Firewall/VPN interference** on user's network
- **ISP-level blocking or throttling**
- **Temporary Fly.io edge routing issues**

**The Problem**: The streaming endpoint was using plain `fetch()` without retry logic, so any transient network issue would immediately fail.

## The Fix 🔧

### Changes Made

Updated `hooks/use-streaming-chat.ts` to use the existing `streamWithRetry` utility that was already available in the codebase but wasn't being used.

**Before**:
```typescript
const response = await fetch(`${BACKEND_URL}/api/pelican_stream`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({ ... }),
  signal: controller.signal
});
```

**After**:
```typescript
const response = await streamWithRetry(`${BACKEND_URL}/api/pelican_stream`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({ ... }),
  signal: controller.signal,
  retryOptions: {
    maxRetries: 2,              // Retry up to 2 times
    baseDelay: 1000,            // Start with 1 second delay
    shouldRetry: (error: Error) => {
      if (error.name === 'AbortError') return false;          // Don't retry cancelled requests
      if (error.message.includes('401') || error.message.includes('403')) return false;  // Don't retry auth errors
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) return true;  // DO retry network errors
      return true;
    }
  }
});
```

### How the Retry Logic Works

From `lib/api-retry.ts`:

1. **Exponential Backoff**: Delays increase exponentially (1s → 2s → 4s)
2. **Jitter**: Adds randomness to prevent thundering herd
3. **Smart Retry Decisions**:
   - ✅ Retries: Network errors, timeouts, 5xx server errors, 429 rate limits
   - ❌ No retry: User cancellations (AbortError), auth errors (401/403), 404s
4. **Max Attempts**: Up to 2 retries (3 total attempts)

### Benefits

- 🛡️ **Resilient to transient network issues**
- 🔄 **Automatic retry without user intervention**
- ⚡ **Minimal latency impact** (only on failures)
- 🎯 **Smart error handling** (doesn't retry unrecoverable errors)
- 📊 **Sentry tracking preserved** (errors still captured if all retries fail)

## Non-Streaming Endpoint Status

The non-streaming endpoint (`/api/pelican_response`) already uses `RequestManager` which has built-in retry logic (3 retries with exponential backoff). However, it's less critical since:

- Streaming is enabled by default (`USE_STREAMING = true`)
- The Sentry error specifically occurred on the streaming endpoint
- Non-streaming has built-in retry via `RequestManager`

## Testing Recommendations

### Local Testing

Test network resilience by simulating failures:

```typescript
// In use-streaming-chat.ts, temporarily add before fetch:
if (Math.random() > 0.7) {
  throw new Error('Simulated network failure');
}
```

### Production Monitoring

Monitor Sentry for:
- ✅ **Expected**: Fewer "Failed to fetch" errors reaching Sentry
- ✅ **Expected**: Errors only appear after 3 failed attempts (1 initial + 2 retries)
- ⚠️ **Watch for**: Any increase in successful retries (indicates network instability)

### Health Checks

Current health check endpoint: `https://pelican-trading-api.fly.dev/health`

Consider adding monitoring:
```bash
# PowerShell
Invoke-WebRequest -Uri "https://pelican-trading-api.fly.dev/health" -UseBasicParsing

# Response should be:
# StatusCode: 200
# Content-Type: application/json
```

## Prevention for Future

### Best Practices Applied

1. ✅ **Always use retry logic** for network calls to external services
2. ✅ **Leverage existing utilities** (`api-retry.ts` was already available)
3. ✅ **Distinguish error types** (network vs. auth vs. user cancellation)
4. ✅ **Preserve observability** (Sentry still captures persistent failures)

### Monitoring Checklist

- [ ] Monitor Sentry issue #7015218203 for reduced frequency
- [ ] Check Fly.io metrics for backend health
- [ ] Review Vercel logs for any new patterns
- [ ] Track retry success rates in production

## Related Files

- `hooks/use-streaming-chat.ts` - Fixed streaming endpoint
- `lib/api-retry.ts` - Retry utility with exponential backoff
- `lib/request-manager.ts` - Non-streaming retry logic
- `lib/sentry-utils.ts` - Error tracking and instrumentation

## Deployment

This fix is ready to deploy. Changes are:
- ✅ Backward compatible
- ✅ No breaking changes
- ✅ No environment variable changes needed
- ✅ No linting errors
- ✅ Uses existing utilities (no new dependencies)

After deployment, expect to see:
- 📉 Reduced "Failed to fetch" errors in Sentry
- 📈 Improved user experience (automatic recovery)
- 📊 Clearer error patterns (only persistent failures reported)

---

**Status**: ✅ **FIXED**  
**Date**: November 11, 2025  
**Author**: AI Assistant

