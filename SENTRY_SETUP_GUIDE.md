# Sentry Setup Guide - Production Logging & Error Tracking

## ✅ Installation Complete

Sentry has been successfully installed and configured for PelicanAI with production-ready security and minimal performance overhead.

---

## 🔐 Security Configuration

All three config files have been hardened with data scrubbing:

### Files Configured:
- `sentry.server.config.ts` - Server-side errors
- `sentry.edge.config.ts` - Edge runtime errors  
- `instrumentation-client.ts` - Browser/client-side errors

### Data Protection:
All configs include `beforeSend` hooks that automatically strip:
- ✅ Authorization headers
- ✅ API keys (x-api-key headers)
- ✅ Query strings
- ✅ Trading data: `positions`, `entry_price`, `portfolio`, `balance`
- ✅ Sensitive tokens and secrets

**PII Protection:** `sendDefaultPii: false` on all configs

**Session Replay:** Configured with `maskAllText: true` and `blockAllMedia: true` to protect user privacy

---

## ⚡ Performance Configuration

**Traces Sample Rate:** `0.1` (10% sampling)
- Monitors 10% of requests to reduce overhead
- Captures all errors regardless of sampling

**Session Replay Sampling:**
- Normal sessions: 10% (`replaysSessionSampleRate: 0.1`)
- Sessions with errors: 100% (`replaysOnErrorSampleRate: 1.0`)

**Experimental Logs:** Enabled via `_experiments.enableLogs: true`

---

## 🎯 Instrumented Critical Paths

### 1. Backend API Calls (`hooks/use-chat.ts`)
**What:** All POST requests to `/api/pelican_response`

**Tracking:**
- ✅ Performance monitoring with `Sentry.startSpan()`
- ✅ Error capture with context (conversation ID, message length)
- ✅ Excludes user cancellations (AbortError)

**Code location:** Line ~230 and ~346

### 2. Message Streaming (`hooks/use-streaming-chat.ts`)
**What:** SSE streaming from `/api/pelican_stream`

**Tracking:**
- ✅ Performance monitoring for stream initiation
- ✅ Error capture for stream failures
- ✅ Excludes user cancellations

**Code location:** Line ~36 and ~108

### 3. Authentication Failures
**What:** Auth errors in all API routes

**Instrumented routes:**
- ✅ `/api/pelican_response/route.ts` (Line ~75)
- ✅ `/api/chat/route.ts` (Line ~62)
- ✅ `/api/pelican_stream/route.ts` (Line ~59)

**Tracking:**
- Captures `AuthenticationError` exceptions
- Includes auth error messages as context

---

## 🛠️ Helper Utilities

Created `lib/sentry-utils.ts` with two helper functions:

### `instrumentedFetch(endpoint, fetchFn)`
Wraps API calls with performance monitoring.

```typescript
const response = await instrumentedFetch("/api/chat", async () => {
  return await fetch("/api/chat", { /* options */ });
});
```

### `captureCriticalError(error, context)`
Captures errors with structured context.

```typescript
captureCriticalError(error, {
  location: "api_call" | "streaming" | "authentication",
  endpoint: "/api/chat",
  conversationId: "abc-123",
  messageLength: 150
});
```

**⚠️ Important:** Only use these for critical errors, not routine operations.

---

## 📊 What Gets Tracked

### Automatically Tracked (by Sentry):
- ✅ All unhandled JavaScript errors
- ✅ Unhandled promise rejections
- ✅ Console errors (browser only)
- ✅ Network requests (as breadcrumbs)
- ✅ User clicks and navigation (breadcrumbs)
- ✅ Page load performance

### Manually Instrumented:
- ✅ Backend API call failures
- ✅ Message streaming errors
- ✅ Authentication failures
- ✅ Performance spans for critical API calls

### NOT Tracked:
- ❌ User cancellations (AbortError)
- ❌ Button clicks (routine operations)
- ❌ State changes (routine operations)
- ❌ Successful operations
- ❌ Console.logs in production

---

## 🚀 Testing Your Setup

### Local Testing:
1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000/sentry-example-page`
3. Click buttons to test different error types
4. Check Sentry dashboard for captured errors

### API Testing:
Visit: `http://localhost:3000/api/sentry-example-api`
This will trigger a server-side error for testing.

### Production Testing:
After deploying:
1. Trigger an auth error (logout and try to send message)
2. Trigger an API error (disconnect internet briefly)
3. Check Sentry dashboard for real-time errors

---

## 📈 Viewing Logs in Production

### Sentry Dashboard:
1. Visit: https://sentry.io
2. Navigate to: `pelican-trading-xr` → `javascript-nextjs`
3. View:
   - **Issues** - All errors grouped intelligently
   - **Performance** - API call timings and bottlenecks
   - **Replays** - Session recordings (when errors occur)

### Filtering:
Use tags to filter:
- `error_location:api_call` - Backend API failures
- `error_location:streaming` - Streaming failures
- `error_location:authentication` - Auth failures
- `endpoint:/api/pelican_response` - Specific endpoint

### During Stress Testing:
1. Watch **Issues** tab in real-time
2. Check **Performance** for slow endpoints
3. Set up Slack/Discord alerts for error spikes
4. Review **Replays** to see what users did before errors

---

## 🔧 Environment Variables

Your Sentry DSN is configured in the config files:
```
DSN: https://d77e0a5be44d5c1dddfddebe2ac38a90@o4510343032799232.ingest.us.sentry.io/4510343040663552
```

**Source maps auth token:**
Stored in: `.env.sentry-build-plugin` (gitignored)

**Vercel Integration:**
⚠️ For Vercel deployments, install the Sentry Vercel integration:
https://vercel.com/integrations/sentry

This ensures source maps are uploaded automatically on each deployment.

---

## 📝 Best Practices

### DO:
- ✅ Monitor Sentry dashboard during stress tests
- ✅ Set up alerts for error rate spikes
- ✅ Use tags to filter issues by location/endpoint
- ✅ Review replays to understand user behavior before errors
- ✅ Check performance monitoring for slow endpoints

### DON'T:
- ❌ Add Sentry calls to every function (creates noise)
- ❌ Capture routine successful operations
- ❌ Send PII or sensitive trading data (already protected)
- ❌ Ignore rate limit warnings (upgrade plan if needed)
- ❌ Forget to upload source maps (needed for readable stack traces)

---

## 🐛 Troubleshooting

### Source Maps Not Working?
**Problem:** Stack traces show minified code
**Solution:** 
1. Check `.env.sentry-build-plugin` exists
2. Verify Vercel Sentry integration is installed
3. Rebuild: `npm run build`

### Too Many Events?
**Problem:** Hitting Sentry quotas
**Solution:**
1. Reduce `tracesSampleRate` to 0.05 (5%)
2. Add more filters in `beforeSend` hooks
3. Upgrade Sentry plan

### Errors Not Appearing?
**Problem:** Errors in local dev not showing up
**Solution:**
1. Check console - errors still logged locally
2. Production mode: `npm run build && npm start`
3. Visit example page: `/sentry-example-page`

### Auth Token Issues on Vercel?
**Problem:** Source maps failing on Vercel
**Solution:**
1. Install Vercel Sentry integration: https://vercel.com/integrations/sentry
2. Remove `.env.sentry-build-plugin` from Vercel (integration handles it)

---

## 📊 Stress Testing Checklist

Before stress test:
- [ ] Verify Sentry dashboard access
- [ ] Set up Slack/Discord alerts
- [ ] Test example error page works
- [ ] Confirm source maps are uploading

During stress test:
- [ ] Monitor Issues tab in real-time
- [ ] Check Performance tab for slow endpoints
- [ ] Note error rate spikes and timing
- [ ] Review top 5 most common errors

After stress test:
- [ ] Download error reports
- [ ] Review session replays for UX issues
- [ ] Analyze performance bottlenecks
- [ ] Prioritize fixes by error frequency

---

## 🔗 Useful Links

- **Sentry Dashboard:** https://sentry.io/organizations/pelican-trading-xr/projects/javascript-nextjs/
- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Vercel Integration:** https://vercel.com/integrations/sentry
- **Performance Monitoring:** https://docs.sentry.io/product/performance/
- **Session Replay:** https://docs.sentry.io/product/session-replay/

---

## 🎉 You're Ready!

Your frontend now has production-grade error tracking and performance monitoring. All errors from `pelicantrading.ai` will be captured with full context, while protecting sensitive trading data.

**During your stress test, you'll see:**
- Every error, grouped intelligently
- Which users/sessions are affected
- Performance bottlenecks in real-time
- User behavior leading up to errors

Good luck with your stress testing! 🚀

