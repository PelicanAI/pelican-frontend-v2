export const LIMITS = {
  FILE_SIZE_MB: 25, // Updated to match backend 25MB limit
  MESSAGE_CONTEXT: 150, // Context window for comprehensive conversation history
  CHAT_MAX_TOKENS: 4000,
  FREE_TIER_MESSAGES: 10,
  TITLE_PREVIEW_LENGTH: 50,
  MESSAGE_PREVIEW_LENGTH: 100,
  TYPING_INTERVAL_MIN_MS: 15,
  TYPING_INTERVAL_MAX_MS: 45,
} as const

export const UI = {
  TEXTAREA_MIN_HEIGHT: 40,
  TEXTAREA_MAX_HEIGHT: 200,
  CHAR_COUNT_THRESHOLD: 0.75,
  CHAR_COUNT_WARNING_THRESHOLD: 0.85,
  CHAR_COUNT_DANGER_THRESHOLD: 0.95,
  THINKING_NOTE_DURATION_MS: 3000,
  ERROR_DISPLAY_DURATION_MS: 3000,
  MESSAGE_MIN_LENGTH_FOR_PATTERN: 10,
  USER_PATTERN_LIMIT: 50,
  PREMIUM_CHAR_COUNT_THRESHOLD: 3000,
  PREMIUM_CHAR_COUNT_WARNING_THRESHOLD: 3500,
  PREMIUM_CHAR_COUNT_DANGER_THRESHOLD: 3900,
  PREMIUM_MAX_CHARS: 4000,
} as const

export const PLACEHOLDERS = [
  "Ask about market trends...",
  "Analyze your trading strategy...",
  "Get insights on your portfolio...",
] as const

export const ACCEPTED_FILE_TYPES = {
  // Images
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/bmp": [".bmp"],
  "image/tiff": [".tiff", ".tif"],
  "image/svg+xml": [".svg"],
  "image/heic": [".heic"],
  "image/heif": [".heif"],
  // Documents
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/rtf": [".rtf"],
  // Spreadsheets
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
  // Data files
  "text/csv": [".csv"],
  "application/csv": [".csv"],
  "text/plain": [".txt"],
  "text/tab-separated-values": [".tsv"],
  "application/json": [".json"],
  "application/xml": [".xml"],
  "text/xml": [".xml"],
  // Archives
  "application/zip": [".zip"],
  "application/gzip": [".gz"],
} as const

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB - match backend

export const FILE_TYPE_NAMES = {
  xlsx: "Excel",
  xls: "Excel",
  csv: "CSV",
  pdf: "PDF",
  jpeg: "Image",
  png: "Image",
  txt: "Text",
} as const

export const ROUTES = {
  CHAT: "/chat",
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    SIGNOUT: "/auth/signout",
  },
  MARKETING: "/marketing",
  PROFILE: "/profile",
} as const

export const STORAGE_KEYS = {
  LAST_CONVERSATION: "pelican:lastConversationId",
  GUEST_CONVERSATIONS: "pelican_guest_conversations",
  GUEST_USER_ID: "pelican_guest_user_id",
  THEME: "theme",
} as const

export const API_ENDPOINTS = {
  CHAT: "/api/chat", // Legacy - not used for Pelican queries
  PELICAN_STREAM: "/api/pelican_stream", // Legacy - now calls Fly.io directly
  UPLOAD: "/api/upload",
  CONVERSATIONS: "/api/conversations",
  MESSAGES: "/api/messages",
} as const

// Direct backend URLs (no Vercel proxy)
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pelican-backend.fly.dev'