# Frontend Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment (Local Setup)

### Step 1: Create Environment Files ⚠️ REQUIRED

**Option A: Using PowerShell Script (Windows - Recommended)**
```powershell
cd Pelican-frontend
.\setup-env.ps1
```

**Option B: Using Bash Script (Mac/Linux)**
```bash
cd Pelican-frontend
chmod +x setup-env.sh
./setup-env.sh
```

**Option C: Manual Creation**
```powershell
# In Pelican-frontend directory
@"
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

@"
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
"@ | Out-File -FilePath ".env.production" -Encoding UTF8
```

- [ ] `.env.local` created
- [ ] `.env.production` created
- [ ] Both files contain `NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev`

### Step 2: Verify Code Changes

- [ ] `lib/pelican-direct.ts` exists
- [ ] `hooks/use-streaming-chat.ts` updated
- [ ] `hooks/use-chat.ts` updated
- [ ] `components/pelican-error-boundary.tsx` exists
- [ ] `scripts/test-direct-api.ts` exists

### Step 3: Local Testing

```bash
npm run dev
```

Open http://localhost:3000

- [ ] Dev server starts without errors
- [ ] Can log in to the app
- [ ] Can send a test message
- [ ] DevTools Network tab shows requests to `pelican-backend.fly.dev` (NOT `/api/pelican_*`)
- [ ] Message streams successfully
- [ ] No console errors
- [ ] No 401/CORS errors

**✋ STOP HERE if any checkbox is unchecked. Fix issues before deploying.**

## Deployment to Vercel

### Step 4: Commit Changes

```bash
git add .
git commit -m "Direct Fly.io backend integration - eliminate Vercel proxy timeout"
git push
```

- [ ] All changes committed
- [ ] Pushed to GitHub/GitLab
- [ ] Vercel auto-deploy triggered (check Vercel dashboard)

### Step 5: Configure Vercel Environment Variables

**Option A: Vercel CLI (Recommended)**
```bash
npm i -g vercel

vercel env add NEXT_PUBLIC_BACKEND_URL production
# Enter: https://pelican-backend.fly.dev

vercel env add NEXT_PUBLIC_BACKEND_URL preview
# Enter: https://pelican-backend.fly.dev

vercel env add NEXT_PUBLIC_BACKEND_URL development
# Enter: https://pelican-backend.fly.dev
```

**Option B: Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add New: `NEXT_PUBLIC_BACKEND_URL` = `https://pelican-backend.fly.dev`
5. Check all environments (Production, Preview, Development)
6. Save

- [ ] Environment variable added to Production
- [ ] Environment variable added to Preview
- [ ] Environment variable added to Development

### Step 6: Wait for Deployment

- [ ] Vercel deployment completed successfully
- [ ] No build errors in Vercel logs
- [ ] Deployment URL accessible

## Post-Deployment Verification

### Step 7: Test Production

Open your production URL (e.g., https://pelican-chat.vercel.app)

- [ ] Production site loads
- [ ] Can log in
- [ ] Can send a test message: "What's SPY at?"
- [ ] DevTools Network tab shows requests to `pelican-backend.fly.dev`
- [ ] Streaming works (text appears character by character)
- [ ] No 401 Unauthorized errors
- [ ] No CORS errors
- [ ] No console errors

### Step 8: Test Long Query (No Timeout)

Send a complex query that would take 2+ minutes:
- "Analyze the current market trends and provide a comprehensive trading strategy"

- [ ] Query completes without timeout
- [ ] No 504 Gateway Timeout error
- [ ] Streaming continues beyond 30 seconds
- [ ] Full response received

### Step 9: Monitor for 24-48 Hours

- [ ] No user complaints
- [ ] No Sentry errors with `location: 'streaming_direct'`
- [ ] All queries complete successfully
- [ ] No timeout issues reported

## Optional Cleanup (After 48 Hours)

Once everything is stable:

```bash
# Remove old proxy routes
rm -rf app/api/pelican_stream/
rm -rf app/api/pelican_response/
rm -rf app/api/chat/

git add .
git commit -m "Remove deprecated Vercel proxy routes"
git push
```

- [ ] Old proxy routes removed
- [ ] Committed and deployed
- [ ] Production still works after cleanup

## Troubleshooting Guide

### Issue: Local dev shows `/api/pelican_*` instead of `pelican-backend.fly.dev`

**Solution:**
```bash
# Verify .env.local exists
cat .env.local  # Should show NEXT_PUBLIC_BACKEND_URL

# Restart dev server
npm run dev
```

### Issue: 401 Unauthorized in Production

**Cause:** Backend JWT secret not configured or incorrect

**Solution:**
```bash
# Check backend secrets
fly secrets list --app pelican-backend

# Should include SUPABASE_JWT_SECRET
# If missing, contact backend team
```

### Issue: CORS Error

**Cause:** Backend doesn't allow your frontend domain

**Solution:** Backend team needs to add your Vercel domain to `ALLOWED_ORIGINS` in backend config

### Issue: Network Request Failed

**Solution:**
```bash
# Check backend health
curl https://pelican-backend.fly.dev/health

# Should return: {"status":"healthy"}
# If not, backend is down - contact backend team
```

### Issue: Environment Variable Not Working

**Solution:**
```powershell
# Check variable is set
$env:NEXT_PUBLIC_BACKEND_URL  # Windows
echo $NEXT_PUBLIC_BACKEND_URL # Mac/Linux

# Should show: https://pelican-backend.fly.dev

# If empty, recreate .env.local and restart server
```

## Success Criteria

✅ **Deployment is successful when:**
- All checkboxes in Steps 1-8 are checked
- Production shows requests to `pelican-backend.fly.dev`
- No timeout errors after 300 seconds
- Streaming works smoothly
- No console errors

## Benefits Achieved

✅ **No More Timeouts** - Queries can run indefinitely
✅ **Better Performance** - Direct connection, no proxy overhead  
✅ **Cost Savings** - Reduced Vercel function invocations
✅ **Simpler Architecture** - Direct frontend → backend communication

---

**Current Status:** ⚠️ Environment setup required

**Next Action:** Run `.\setup-env.ps1` to create environment files

**Estimated Time:** 10-15 minutes total

