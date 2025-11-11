# Quick Start - Direct API Migration

## TL;DR

Your frontend now calls the Fly.io backend directly (no Vercel proxy). This eliminates the 300-second timeout issue.

## 3 Steps to Complete the Migration

### Step 1: Create Environment Files (2 minutes)

```powershell
# Open PowerShell in Pelican-frontend directory
cd "C:\Users\grove\Desktop\Pelican Docs\pelican-chat\Pelican-frontend"

# Create both environment files
@"
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

@"
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
"@ | Out-File -FilePath ".env.production" -Encoding UTF8

# Verify
Get-Content .env.local
```

### Step 2: Configure Vercel (1 minute)

Go to Vercel Dashboard:
1. Settings → Environment Variables → Add New
2. Name: `NEXT_PUBLIC_BACKEND_URL`
3. Value: `https://pelican-backend.fly.dev`
4. Environments: Check all (Production, Preview, Development)
5. Click Save

### Step 3: Test & Deploy (5 minutes)

```bash
# Test locally
npm run dev

# Open browser DevTools → Network tab
# Send a message
# Verify request goes to pelican-backend.fly.dev ✅

# Deploy
git add .
git commit -m "Direct API migration - bypass Vercel timeout"
git push
```

## What Changed?

| Aspect | Before | After |
|--------|--------|-------|
| Requests | Via Vercel proxy | Direct to Fly.io |
| Timeout | 300 seconds | ∞ (unlimited) |
| Hops | Frontend → Vercel → Backend | Frontend → Backend |
| Performance | Slower | Faster |
| Complexity | Higher | Lower |

## Verification

✅ **Success indicators:**
- Network requests show `pelican-backend.fly.dev` 
- No 504 timeout errors
- Long queries complete successfully
- Streaming works smoothly

❌ **Failure indicators:**
- "NEXT_PUBLIC_BACKEND_URL not configured" error
  → Create `.env.local` file and restart dev server
- Still seeing `/api/pelican_*` requests
  → Check environment variable, restart server
- "Authentication required" error
  → Log in to the app

## Files You Can Ignore

These are auto-generated documentation:
- `DIRECT_API_MIGRATION.md` - Detailed guide (optional reading)
- `ENV_SETUP_INSTRUCTIONS.md` - Alternative setup instructions
- `MIGRATION_SUMMARY.md` - Full summary of changes

**Just follow the 3 steps above and you're good to go!**

## Need Help?

Common issues:
1. **Environment variable not working** → Restart dev server
2. **Auth errors** → Log in to the app
3. **CORS errors** → Check backend CORS config
4. **Backend down** → Run `fly status --app pelican-backend`

## After 48 Hours

Once everything works well in production, optionally clean up old files:

```bash
# Remove old proxy routes (no longer used)
rm -rf Pelican-frontend/app/api/pelican_stream/
rm -rf Pelican-frontend/app/api/pelican_response/
```

---

**That's it! The migration eliminates your timeout issues. 🚀**

