# 🚀 Vercel Deployment Guide - Pelican Chat

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables Setup
Create a `.env.local` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Pelican Backend API
PEL_API_KEY=your_pelican_api_key
PEL_API_URL=https://your-backend-url.com

# App URL (will be different in production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Migration
Run the SQL migration for partial messages:

```sql
-- In Supabase SQL Editor
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_is_partial 
ON messages(is_partial) WHERE is_partial = true;
```

### 3. Verify Build Locally
```bash
npm run type-check  # Check TypeScript
npm run lint        # Check linting
npm run build       # Test production build
npm run start       # Test production locally
```

---

## 📦 DEPLOYMENT STEPS

### Option 1: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. **Connect Repository:**
   - Go to vercel.com/new
   - Import your Git repository
   - Select the `Pelican-frontend` directory as root

2. **Configure Build Settings:**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Node Version: `20.x`

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Make sure to add them for `Production`, `Preview`, and `Development`

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

---

## 🔧 VERCEL CONFIGURATION

### Automatic Configuration
The `vercel.json` file is already configured with:

✅ **Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection enabled
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy restrictions

✅ **Caching Strategy**
- API routes: no-cache
- Static assets: 1-year cache
- Next.js static: immutable

✅ **Performance**
- Region: US East (iad1) - change if needed
- API memory: 1024 MB
- API max duration: 30 seconds

### Custom Domain Setup

1. **Add Domain in Vercel:**
   ```
   Settings → Domains → Add Domain
   ```

2. **Configure DNS:**
   - Add A record: `@` → Vercel IP
   - Add CNAME: `www` → `cname.vercel-dns.com`

3. **SSL Certificate:**
   - Auto-provisioned by Vercel
   - Usually takes 1-5 minutes

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### 1. Health Check
Visit: `https://your-app.vercel.app/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

### 2. Test Critical Features
- [ ] User authentication (sign up, login)
- [ ] Create new conversation
- [ ] Send message with streaming
- [ ] Stop message generation
- [ ] File upload
- [ ] Message history persistence
- [ ] Mobile responsiveness
- [ ] Dark mode toggle

### 3. Performance Audit
Run Lighthouse in Chrome DevTools:
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90
- SEO: ≥90

### 4. Error Monitoring
Check Vercel logs for:
- No 500 errors
- No XSS vulnerability warnings
- No memory leaks
- No race conditions

---

## 🔒 SECURITY CHECKLIST

### Production Environment Variables
✅ Never commit `.env` files to Git
✅ Use Vercel's encrypted environment variables
✅ Rotate API keys regularly
✅ Use Supabase RLS policies
✅ Enable CORS only for your domain

### Security Headers Verification
Test your headers at: https://securityheaders.com

Expected grade: **A+**

---

## 📊 MONITORING & ANALYTICS

### Vercel Analytics
Enable in: `Project Settings → Analytics`
- Real User Monitoring
- Core Web Vitals tracking
- Performance insights

### Error Tracking (Optional)
Consider adding Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Logging
Vercel automatically captures:
- console.log → Logs
- console.error → Errors
- Unhandled exceptions → Errors

---

## 🚨 TROUBLESHOOTING

### Build Failures

**Error: "Module not found"**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

**Error: "Type errors"**
```bash
npm run type-check
# Fix all TypeScript errors before deploying
```

**Error: "ESLint errors"**
```bash
npm run lint
# Fix linting errors or add exceptions
```

### Runtime Errors

**Error: "SUPABASE_URL not defined"**
- Check environment variables in Vercel dashboard
- Ensure they're set for the correct environment (Production/Preview)

**Error: "API timeout"**
- Increase `maxDuration` in `vercel.json` (up to 60s on Pro plan)
- Optimize API route performance

**Error: "Memory limit exceeded"**
- Increase `memory` in `vercel.json` (up to 3008 MB on Pro plan)
- Check for memory leaks

### Performance Issues

**Slow page loads:**
- Enable Vercel Edge Network
- Optimize images with `next/image`
- Enable ISR (Incremental Static Regeneration)

**API latency:**
- Move Supabase region closer to Vercel region
- Enable connection pooling
- Add Redis caching (optional)

---

## 🎯 OPTIMIZATION RECOMMENDATIONS

### 1. Enable Edge Functions (Optional)
```js
// app/api/route.ts
export const runtime = 'edge'
```

### 2. Image Optimization
Replace `<img>` with `<Image>` from `next/image`:
```tsx
import Image from 'next/image'

<Image
  src="/pelican-logo-transparent.png"
  alt="Pelican"
  width={128}
  height={128}
  priority
/>
```

### 3. Font Optimization
Already using `next/font/google` for Inter ✅

### 4. Enable Compression
Vercel automatically enables Brotli compression ✅

### 5. Database Connection Pooling
Add to Supabase URL:
```
?pgbouncer=true&connection_limit=10
```

---

## 📈 SCALING CONSIDERATIONS

### Current Setup (Free/Hobby Tier)
- ✅ Unlimited bandwidth
- ✅ Automatic SSL
- ✅ Global CDN
- ⚠️ 100GB bandwidth limit
- ⚠️ 100GB-hrs compute time
- ⚠️ 6,000 minutes build time

### When to Upgrade to Pro ($20/month)
- More than 100GB bandwidth usage
- Need longer API timeouts (60s)
- Need more memory (3GB)
- Need preview deployment protection
- Need advanced analytics

### When to Upgrade to Enterprise
- Custom SLA requirements
- Dedicated support
- SSO authentication
- Advanced security features

---

## 🎉 DEPLOYMENT COMPLETE!

Your Pelican Chat application is now live at:
```
https://your-app.vercel.app
```

### Next Steps:
1. **Share with Team:** Send the URL to stakeholders
2. **Monitor Performance:** Check Vercel Analytics daily
3. **Gather Feedback:** Create feedback loop with users
4. **Iterate:** Deploy updates as needed (git push triggers auto-deploy)

---

## 📚 USEFUL COMMANDS

```bash
# View deployment logs
vercel logs <deployment-url>

# List all deployments
vercel ls

# Promote preview to production
vercel promote <deployment-url>

# Remove old deployments
vercel rm <deployment-url>

# View environment variables
vercel env ls

# Add environment variable
vercel env add <KEY> production
```

---

## 🆘 SUPPORT RESOURCES

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Documentation](https://supabase.com/docs)

---

**🚀 Happy Deploying! Your production-grade application is ready for users!**

