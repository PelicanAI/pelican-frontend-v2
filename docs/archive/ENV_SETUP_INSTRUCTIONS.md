# Environment Setup Instructions

## ⚠️ ACTION REQUIRED: Create Environment Variable Files

The environment variable files (`.env.local` and `.env.production`) cannot be created automatically as they are in `.gitignore`. You need to create them manually:

### 1. Create `.env.local` (Local Development)

In `Pelican-frontend/` directory, create a file named `.env.local`:

```bash
# Navigate to the Pelican-frontend directory
cd Pelican-frontend

# Create .env.local file
# On Windows PowerShell:
New-Item -Path ".env.local" -ItemType File -Force

# Or use any text editor to create the file
```

Add this content:
```bash
# Direct Backend Access - No Vercel Proxy
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
```

### 2. Create `.env.production` (Vercel Deployment)

In `Pelican-frontend/` directory, create a file named `.env.production`:

```bash
# Create .env.production file
# On Windows PowerShell:
New-Item -Path ".env.production" -ItemType File -Force
```

Add this content:
```bash
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
```

### 3. Configure Vercel Environment Variables

You also need to set the environment variable in Vercel Dashboard:

#### Option A: Via Vercel Dashboard
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Click "Add New"
4. Name: `NEXT_PUBLIC_BACKEND_URL`
5. Value: `https://pelican-backend.fly.dev`
6. Select all environments: Production, Preview, Development
7. Click "Save"

#### Option B: Via Vercel CLI
```bash
# Production
vercel env add NEXT_PUBLIC_BACKEND_URL production
# When prompted, enter: https://pelican-backend.fly.dev

# Preview
vercel env add NEXT_PUBLIC_BACKEND_URL preview
# When prompted, enter: https://pelican-backend.fly.dev

# Development
vercel env add NEXT_PUBLIC_BACKEND_URL development
# When prompted, enter: https://pelican-backend.fly.dev
```

## Quick Setup Commands (Windows PowerShell)

```powershell
# Navigate to project
cd "C:\Users\grove\Desktop\Pelican Docs\pelican-chat\Pelican-frontend"

# Create .env.local
@"
# Direct Backend Access - No Vercel Proxy
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

# Create .env.production
@"
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
"@ | Out-File -FilePath ".env.production" -Encoding UTF8

# Verify files were created
Get-Content .env.local
Get-Content .env.production
```

## Testing

After creating the files:

```bash
# Install dependencies (if needed)
npm install

# Run dev server
npm run dev

# Open http://localhost:3000 and test
```

In browser DevTools → Network tab, you should see requests going to `pelican-backend.fly.dev` instead of `/api/pelican_*`.

## Verification Checklist

- [ ] `.env.local` file created in `Pelican-frontend/` directory
- [ ] `.env.production` file created in `Pelican-frontend/` directory
- [ ] Vercel environment variable `NEXT_PUBLIC_BACKEND_URL` configured
- [ ] Local dev server runs without errors
- [ ] Network requests in browser go to `pelican-backend.fly.dev`
- [ ] Messages send and receive successfully

## Troubleshooting

### "NEXT_PUBLIC_BACKEND_URL not configured" Error
- Verify `.env.local` file exists
- Verify the variable is spelled correctly
- Restart dev server after creating the file

### "Authentication required" Error
- This is expected if not logged in
- Log in to the app and try again

### Network Requests Still Go to `/api/pelican_*`
- Make sure you restarted the dev server after creating `.env.local`
- Clear browser cache
- Check that the environment variable is being loaded (add `console.log(process.env.NEXT_PUBLIC_BACKEND_URL)` temporarily)

## What's Next?

Once you've verified everything works locally:
1. Commit and push your changes
2. Vercel will automatically deploy
3. Verify production deployment works
4. Monitor for 24-48 hours
5. If all good, remove old API proxy routes (see DIRECT_API_MIGRATION.md)

