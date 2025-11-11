# Sentry Quick Reference - Stress Testing

## 🔗 Quick Links

**Dashboard:** https://sentry.io/organizations/pelican-trading-xr/projects/javascript-nextjs/

**Key Tabs:**
- **Issues** - All errors (grouped)
- **Performance** - API timings
- **Replays** - User session recordings

---

## 🔍 Common Filters

```
error_location:api_call           # Backend API failures
error_location:streaming          # Streaming failures  
error_location:authentication     # Auth failures
endpoint:/api/pelican_response    # Specific endpoint
```

---

## 📊 What's Tracked

### ✅ Automatically:
- All unhandled errors
- Network failures
- Performance issues
- User session replays (on error)

### ✅ Manually Instrumented:
- `/api/pelican_response` - Main chat API
- `/api/pelican_stream` - Streaming API
- Authentication failures

---

## 🔐 Data Protection

**Automatically scrubbed:**
- Authorization headers
- API keys
- Trading data (positions, prices, portfolio)
- Query strings
- Sensitive tokens

**PII:** Not sent (`sendDefaultPii: false`)

---

## 📈 Performance Settings

- **Trace sampling:** 10% (all errors captured)
- **Replay sampling:** 10% normal, 100% on error
- **Minimal overhead:** Optimized for production

---

## 🚨 During Stress Test

1. Keep dashboard open in separate window
2. Watch for error rate spikes
3. Check performance tab for slow endpoints
4. Review top errors first (by frequency)
5. Use replays to see user behavior

---

## 🐛 Quick Troubleshooting

**No errors showing?**
- Check: http://localhost:3000/sentry-example-page

**Stack traces minified?**
- Check source maps uploaded (Vercel integration)

**Too many events?**
- Adjust `tracesSampleRate` in config files

---

## 🎯 Test Endpoints

**Local:**
- Frontend: http://localhost:3000/sentry-example-page
- API: http://localhost:3000/api/sentry-example-api

**Production:**
- Trigger auth error: logout and send message
- Trigger API error: disconnect internet briefly

---

## 📞 Alert Setup

1. Go to: **Settings** → **Alerts**
2. Create rule: "Error rate spike"
3. Add Slack/Discord webhook
4. Test alert before stress test

---

## ✅ Pre-Stress Test Checklist

- [ ] Dashboard access confirmed
- [ ] Alerts configured (Slack/Discord)
- [ ] Example error page tested
- [ ] Source maps verified
- [ ] Team has dashboard access

---

**Full docs:** See `SENTRY_SETUP_GUIDE.md`

