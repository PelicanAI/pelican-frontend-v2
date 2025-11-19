# Pelican Frontend - Supabase Environment Setup Script
# This script helps you add Supabase credentials to .env.local

Write-Host "`n" -NoNewline
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  PELICAN - SUPABASE ENVIRONMENT SETUP" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envFile = Join-Path $PSScriptRoot ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "   Creating new .env.local file..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File -Force | Out-Null
}

# Read current content
$currentContent = Get-Content $envFile -Raw

# Check what's missing
$hasSupabaseUrl = $currentContent -match "NEXT_PUBLIC_SUPABASE_URL"
$hasAnonKey = $currentContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY"
$hasServiceKey = $currentContent -match "SUPABASE_SERVICE_ROLE_KEY"

Write-Host "📋 Current Status:" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_SUPABASE_URL: $(if($hasSupabaseUrl){"✅ Present"}else{"❌ Missing"})"
Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY: $(if($hasAnonKey){"✅ Present"}else{"❌ Missing"})"
Write-Host "   SUPABASE_SERVICE_ROLE_KEY: $(if($hasServiceKey){"✅ Present"}else{"❌ Missing"})"
Write-Host ""

if ($hasSupabaseUrl -and $hasAnonKey -and $hasServiceKey) {
    Write-Host "✅ All Supabase variables are already configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To update values, edit .env.local manually or delete it and run this script again." -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# Guide user to get credentials
Write-Host "📝 How to Get Your Supabase Credentials:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select your Pelican project" -ForegroundColor White
Write-Host "3. Click: Settings → API" -ForegroundColor White
Write-Host "4. Copy the required values (you'll be prompted below)" -ForegroundColor White
Write-Host ""

# Prompt for Supabase URL
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
$supabaseUrl = Read-Host "Enter your Supabase URL (e.g., https://xxxxx.supabase.co)"
while ([string]::IsNullOrWhiteSpace($supabaseUrl) -or -not ($supabaseUrl -match "^https://.*\.supabase\.co$")) {
    Write-Host "❌ Invalid URL format. Must be like: https://xxxxx.supabase.co" -ForegroundColor Red
    $supabaseUrl = Read-Host "Enter your Supabase URL"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
$anonKey = Read-Host "Enter your Supabase ANON KEY (starts with eyJ...)"
while ([string]::IsNullOrWhiteSpace($anonKey) -or -not ($anonKey -match "^eyJ")) {
    Write-Host "❌ Invalid key format. Anon key should start with 'eyJ'" -ForegroundColor Red
    $anonKey = Read-Host "Enter your Supabase ANON KEY"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
$serviceKey = Read-Host "Enter your Supabase SERVICE ROLE KEY (starts with eyJ...)"
while ([string]::IsNullOrWhiteSpace($serviceKey) -or -not ($serviceKey -match "^eyJ")) {
    Write-Host "❌ Invalid key format. Service role key should start with 'eyJ'" -ForegroundColor Red
    $serviceKey = Read-Host "Enter your Supabase SERVICE ROLE KEY"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Build the environment variables
$envVars = @"

# -----------------------------------------
# SUPABASE CONFIGURATION (Added by setup script)
# -----------------------------------------
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=$serviceKey

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3007
"@

# Append to existing file
Add-Content -Path $envFile -Value $envVars

Write-Host "✅ Environment variables added to .env.local!" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Your .env.local file now contains:" -ForegroundColor Cyan
Write-Host ""
Get-Content $envFile | ForEach-Object {
    if ($_ -match "SERVICE_ROLE_KEY") {
        # Mask the service key for security
        Write-Host "   $_" -replace "=.*", "=***MASKED***" -ForegroundColor DarkGray
    } else {
        Write-Host "   $_" -ForegroundColor DarkGray
    }
}
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart your dev server:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Visit your app:" -ForegroundColor White
Write-Host "      http://localhost:3007" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. The Supabase middleware error should be gone!" -ForegroundColor White
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

