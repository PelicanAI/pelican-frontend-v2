# PowerShell setup script for environment variables
# Run this from the Pelican-frontend directory: .\setup-env.ps1

Write-Host "🚀 Setting up Pelican Direct API environment variables..." -ForegroundColor Cyan
Write-Host ""

# Create .env.local for local development
Write-Host "Creating .env.local..." -ForegroundColor Yellow
@"
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
"@ | Out-File -FilePath ".env.local" -Encoding UTF8 -NoNewline

# Create .env.production for Vercel deployment
Write-Host "Creating .env.production..." -ForegroundColor Yellow
@"
NEXT_PUBLIC_BACKEND_URL=https://pelican-backend.fly.dev
"@ | Out-File -FilePath ".env.production" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ Environment files created!" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Contents of .env.local:" -ForegroundColor Cyan
Get-Content .env.local
Write-Host ""
Write-Host "📄 Contents of .env.production:" -ForegroundColor Cyan
Get-Content .env.production
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run dev"
Write-Host "2. Open http://localhost:3000"
Write-Host "3. Check DevTools → Network tab for requests to pelican-backend.fly.dev"
Write-Host "4. If working, commit and push to deploy"
Write-Host ""

