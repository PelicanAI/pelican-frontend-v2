# Files Related to Chat, Auth, and Conversation Creation

This document lists all files related to:
1. Chat message rendering and streaming response handling
2. Authentication flow and post-login redirects
3. useEffect hooks that run on auth state changes or initial app load

---

## 1. Chat Message Rendering and Streaming Response Handling

### Core Chat Components
- `app/chat/page.tsx` - Main chat page component, orchestrates chat UI
- `components/chat/chat-container.tsx` - Container component that renders messages and handles scroll
- `components/chat/message-bubble.tsx` - Individual message bubble component with rendering logic
- `components/chat/streaming-message.tsx` - Component specifically for streaming messages with real-time updates
- `components/chat/chat-message.tsx` - Basic message rendering component
- `components/chat/chat-input.tsx` - Input component for sending messages
- `components/chat/chat-input-simple.tsx` - Simplified chat input variant
- `components/chat/welcome-screen.tsx` - Welcome screen when no messages exist
- `components/chat/message-skeleton.tsx` - Loading skeleton for messages
- `components/chat/enhanced-typing-dots.tsx` - Typing indicator animation
- `components/chat/TypingDots.tsx` - Basic typing indicator
- `components/chat/error-message.tsx` - Error message display component

### Streaming Hooks and Utilities
- `hooks/use-chat.ts` - Main chat hook managing conversation state, message sending, and streaming
- `hooks/use-streaming-chat.ts` - Hook specifically for handling SSE (Server-Sent Events) streaming from backend
- `lib/sse-parser.ts` - SSE parser utility for parsing streaming data
- `lib/pelican-direct.ts` - Direct API integration for streaming queries

### Message State and Context Management
- `hooks/use-message-handler.ts` - Handles message sending logic, drafts, and queue management
- `lib/chat-utils.ts` - Utility functions for chat operations and message types
- `lib/data-parsers.ts` - Parsers for handling structured data in messages

---

## 2. Authentication Flow and Post-Login Redirects

### Auth Providers and Context
- `lib/providers/auth-provider.tsx` - Auth context provider with session management and guest migration
- `lib/providers/index.tsx` - Provider composition including AuthProvider

### Auth Pages and Routes
- `app/auth/login/page.tsx` - Login page with redirect to /chat after successful login
- `app/auth/signup/page.tsx` - Signup page
- `app/auth/signup-success/page.tsx` - Post-signup success page
- `app/auth/error/page.tsx` - Auth error handling page
- `app/auth/signout/route.ts` - Signout API route handler

### Auth Middleware and Session Management
- `middleware.ts` - Next.js middleware handling session updates and route protection
- `lib/supabase/middleware.ts` - Supabase session middleware helper
- `lib/supabase/server.ts` - Server-side Supabase client creation
- `lib/supabase/client.ts` - Client-side Supabase client creation
- `lib/supabase/helpers.ts` - Supabase helper functions

### Conversation Router (Handles Post-Login Behavior)
- `hooks/use-conversation-router.ts` - Router hook that handles conversation selection and navigation, including bootstrap logic on auth

### Layout and Root Components
- `app/layout.tsx` - Root layout wrapping app with providers
- `app/chat/page.tsx` - Chat page with auth check and redirect to login if not authenticated

---

## 3. useEffect Hooks on Auth State Changes or Initial App Load

### Auth State Management
- `lib/providers/auth-provider.tsx` - Contains useEffect for:
  - Initial session loading (`getInitialSession`)
  - Auth state change listener (`onAuthStateChange`)
  - Guest conversation migration on SIGNED_IN event

### Conversation Management
- `hooks/use-conversations.ts` - Contains useEffect for:
  - Initial auth state check and conversation loading
  - Auth state change listener (`onAuthStateChange`) to reload conversations
  - Real-time subscription to conversation changes

### Conversation Router
- `hooks/use-conversation-router.ts` - Contains useEffect for:
  - Bootstrap logic: selecting most recent conversation when no URL param (runs on user auth)
  - Tracking conversation changes for draft cleanup

### Chat Page
- `app/chat/page.tsx` - Contains useEffect for:
  - Mount and network status monitoring (initial load)
  - Clearing guest data from localStorage (on mount)
  - Clearing guest conversation IDs from URL (when detected)
  - Conversation not found handling

### Chat Container
- `components/chat/chat-container.tsx` - Contains useEffect hooks for scroll management and message rendering

---

## Additional API Route Handlers

### Conversation API Routes
- `app/api/conversations/route.ts` - GET (list) and POST (create) conversations
- `app/api/conversations/[id]/route.ts` - GET, PATCH, DELETE individual conversation
- `app/api/conversations/[id]/messages/route.ts` - Message operations for a conversation

### Message API Routes
- `app/api/messages/[id]/regenerate/route.ts` - Regenerate message endpoint

---

## Supporting Files

### Type Definitions and Constants
- `lib/constants.ts` - Route constants and other app constants
- `types/translations.ts` - Translation types

### Utilities
- `lib/logger.ts` - Logging utility used throughout chat/auth flows
- `lib/utils.ts` - General utility functions

---

## Key Files to Focus On for External Review

### Most Critical for Conversation Creation Flow:
1. `lib/providers/auth-provider.tsx` - Auth state changes trigger guest migration
2. `hooks/use-conversation-router.ts` - Bootstrap logic runs on user auth (line 38-63)
3. `hooks/use-conversations.ts` - Auth state listener reloads conversations (line 150-193)
4. `app/chat/page.tsx` - Main chat page with multiple useEffect hooks on mount
5. `app/auth/login/page.tsx` - Login redirect to /chat (line 33)

### Most Critical for Streaming:
1. `hooks/use-chat.ts` - Main chat hook coordinating streaming
2. `hooks/use-streaming-chat.ts` - SSE streaming implementation
3. `components/chat/streaming-message.tsx` - Streaming message rendering
4. `components/chat/message-bubble.tsx` - Message rendering with streaming support

### Most Critical for Auth Flow:
1. `lib/providers/auth-provider.tsx` - Core auth state management
2. `middleware.ts` - Session middleware
3. `app/auth/login/page.tsx` - Login page with redirect
4. `hooks/use-conversation-router.ts` - Post-login conversation selection

