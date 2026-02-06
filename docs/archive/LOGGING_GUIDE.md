# Logging Best Practices

## Overview
This project uses a structured logger (`lib/logger.ts`) instead of `console.log` for production-ready logging.

## Why Not console.log?

❌ **Problems with console.log:**
- No filtering or log levels
- Clutters production logs
- Can't be disabled in production
- No structured data
- Can expose sensitive information
- Can't be sent to monitoring services (Sentry, DataDog)

✅ **Benefits of proper logging:**
- Structured logging with context
- Can be filtered by level (info, warn, error)
- Automatically sent to error tracking services
- Includes metadata (timestamps, user IDs, etc.)
- Can be disabled in production

---

## Replacement Patterns

### ✅ Already Fixed Files:
- `app/api/chat/route.ts` - All 21 instances replaced
- `app/chat/page.tsx` - All 4 instances removed/replaced

### ⚠️ Files Still Needing Updates:
- `hooks/use-chat.ts` (~23 instances)
- `hooks/use-conversations.ts` (~19 instances)
- `app/api/upload/route.ts` (~14 instances)
- Other hooks and components (~69 instances)

---

## How to Replace

### Pattern 1: Simple Info Log
```typescript
// ❌ BEFORE
console.log('[v0] User logged in:', userId)

// ✅ AFTER
import { logger } from '@/lib/logger'
logger.info('User logged in', { userId })
```

### Pattern 2: Error Log
```typescript
// ❌ BEFORE
console.error('[v0] Failed to save:', error)

// ✅ AFTER
import { logger } from '@/lib/logger'
logger.error('Failed to save data', error, { userId, documentId })
```

### Pattern 3: Debug Info (Remove in Production)
```typescript
// ❌ BEFORE
console.log('Render state:', { user, loading })

// ✅ AFTER - Option 1: Remove entirely
// (These are development-only logs)

// ✅ AFTER - Option 2: Keep for debugging
if (process.env.NODE_ENV === 'development') {
  logger.info('Debug: Render state', { user: !!user, loading })
}
```

### Pattern 4: Multiple console.log Statements
```typescript
// ❌ BEFORE
console.log('[v0] API call started')
console.log('[v0] User ID:', userId)
console.log('[v0] Endpoint:', endpoint)

// ✅ AFTER - Combine into one structured log
logger.info('API call started', { 
  userId, 
  endpoint,
  timestamp: new Date().toISOString() 
})
```

---

## Logger API

### logger.info(message, context?)
Use for general information logs
```typescript
logger.info('User action completed', { 
  action: 'file_upload',
  fileSize: file.size,
  userId 
})
```

### logger.error(message, error, context?)
Use for error logging
```typescript
logger.error('Database operation failed', error, {
  operation: 'insert',
  table: 'messages',
  userId
})
```

### logger.warn(message, context?)
Use for warnings (not yet implemented, add if needed)
```typescript
logger.warn('Rate limit approaching', { 
  remaining: 5,
  limit: 30,
  userId 
})
```

---

## Running the Helper Script

To see which files still have console statements:
```bash
./scripts/replace-console-logs.sh
```

This will show:
- Count of console statements per file
- Total remaining console statements
- List of files that need updating

---

## Testing After Changes

After replacing console logs:

1. **Check for TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

2. **Check for ESLint errors:**
   ```bash
   npm run lint
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Test locally:**
   ```bash
   npm run dev
   # Test key features:
   # - Chat functionality
   # - File uploads
   # - Conversation creation
   # - Error scenarios
   ```

---

## What to Log

### ✅ DO log:
- User actions (login, logout, chat message sent)
- API calls to external services
- Database operations (create, update, delete)
- Errors and exceptions
- Performance metrics
- Security events (failed auth, rate limiting)

### ❌ DON'T log:
- Sensitive data (passwords, API keys, tokens)
- Personal information (full names, emails, phone numbers)
- Payment information
- Excessive render logs
- Development-only debugging

---

## Priority Order for Replacement

### High Priority (Core functionality):
1. ✅ `app/api/chat/route.ts` - DONE
2. `app/api/upload/route.ts`
3. `hooks/use-chat.ts`
4. `hooks/use-conversations.ts`

### Medium Priority (Features):
5. `hooks/use-file-upload.ts`
6. `app/api/conversations/route.ts`
7. `app/api/conversations/[id]/route.ts`

### Low Priority (Utils & UI):
8. `lib/files.ts`
9. `lib/request-manager.ts`
10. Component files

---

## Next Steps

1. Run the helper script to see remaining console statements
2. Start with high-priority files
3. Test after each file is updated
4. Run `npm run build` to ensure no build errors
5. Deploy and monitor logs in production

---

## Monitoring Setup (Future)

Once console.log statements are replaced, you can:

1. **Add Sentry** for error tracking
2. **Add LogRocket** for session replay
3. **Add DataDog** for performance monitoring
4. **Add custom log aggregation** (CloudWatch, Loggly, etc.)

All of these integrate with the structured logger automatically.

