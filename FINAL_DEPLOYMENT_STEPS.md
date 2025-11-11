# Final Deployment Steps - Start Here! 🚀

All code changes are complete. Follow these steps to deploy.

## Quick Start (5 Minutes)

### 1. Create Environment Files

**Windows PowerShell:**
```powershell
cd Pelican-frontend
.\setup-env.ps1
```

**Mac/Linux:**
```bash
cd Pelican-frontend
chmod +x setup-env.sh
./setup-env.sh
```

### 2. Test Locally

```bash
npm run dev
```

Open http://localhost:3000 and test:
- Log in
- Send message: "What's SPY at?"
- Check DevTools → Network tab
- Verify requests go to `pelican-backend.fly.dev` ✅

### 3. Deploy to Vercel

```bash
git add .
git commit -m "Direct backend integration"
git push
```

### 4. Set Vercel Environment Variable

**Dashboard Method:**
1. https://vercel.com/dashboard → Your Project
2. Settings → Environment Variables → Add New
3. Name: `NEXT_PUBLIC_BACKEND_URL`
4. Value: `https://pelican-backend.fly.dev`
5. Check all environments → Save

**CLI Method:**
```bash
vercel env add NEXT_PUBLIC_BACKEND_URL production
# Enter: https://pelican-backend.fly.dev

vercel env add NEXT_PUBLIC_BACKEND_URL preview
# Enter: https://pelican-backend.fly.dev
```

### 5. Verify Production

Open your production URL and test:
- Send a message
- Check Network tab → should show `pelican-backend.fly.dev`
- Try a long query (2+ minutes) → should complete without timeout ✅

## That's It!

No more 300-second timeouts. Your queries can run as long as needed.

## Files Changed

✅ All code changes are already complete:
- `lib/pelican-direct.ts` - Created
- `hooks/use-streaming-chat.ts` - Updated
- `hooks/use-chat.ts` - Updated
- `components/pelican-error-boundary.tsx` - Created
- `vercel.json` - Updated
- And more...

## Support

- **Full checklist:** See `DEPLOYMENT_CHECKLIST.md`
- **Detailed guide:** See `DIRECT_API_MIGRATION.md`
- **Troubleshooting:** Check `DEPLOYMENT_CHECKLIST.md` → Troubleshooting section

## Success Indicators

✅ Network requests show `pelican-backend.fly.dev`
✅ No 504 timeout errors
✅ Streaming works smoothly
✅ Long queries (2+ min) complete successfully

---

**Time Required:** ~10 minutes
**Complexity:** Low (just 5 steps)
**Benefit:** No more timeout issues! 🎉

