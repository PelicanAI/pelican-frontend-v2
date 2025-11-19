# Sentry Environment Variables

## Current Configuration

Your Sentry integration is **already configured** with hardcoded DSN values in the following files:

- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation-client.ts`

**Current DSN**: `https://d77e0a5be44d5c1dddfddebe2ac38a90@o4510343032799232.ingest.us.sentry.io/4510343040663552`

---

## Optional: Environment Variable Setup

If you want to manage Sentry configuration through environment variables instead of hardcoded values, you can optionally set these:

### `.env.local` (Development)

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://d77e0a5be44d5c1dddfddebe2ac38a90@o4510343032799232.ingest.us.sentry.io/4510343040663552

# Optional: For release tracking
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=${VERCEL_GIT_COMMIT_SHA}

# Optional: Organization/Project info (not currently used)
SENTRY_ORG=your_org
SENTRY_PROJECT=pelican-frontend
SENTRY_AUTH_TOKEN=your_auth_token
```

### Vercel Environment Variables (Production)

If deploying to Vercel, you can set these in your project settings:

1. Go to: Project Settings → Environment Variables
2. Add the following:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://d77e...@sentry.io/...` | Production, Preview, Development |
| `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` | Auto-populated by Vercel | All |

---

## Migrating to Environment Variables

If you want to switch from hardcoded DSN to environment variables:

### 1. Update `sentry.server.config.ts`

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  // ... rest of config
});
```

### 2. Update `sentry.edge.config.ts`

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // ... rest of config
});
```

### 3. Update `instrumentation-client.ts`

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // ... rest of config
});
```

---

## Why `NEXT_PUBLIC_` Prefix?

- **Client-side access**: Variables with `NEXT_PUBLIC_` are available in the browser
- **Security**: Without this prefix, the variable is only available server-side
- **Requirement**: Client-side Sentry initialization needs the DSN

---

## Verification

After setting environment variables, verify they're loaded:

```bash
# Check if environment variable is set (in your terminal)
echo $NEXT_PUBLIC_SENTRY_DSN
```

Or check the health endpoint:

```bash
curl https://your-domain.com/api/monitoring/sentry
```

---

## Current State

✅ **You're all set!** Sentry is working with hardcoded DSN values. No environment variable changes are required unless you want centralized configuration management.

