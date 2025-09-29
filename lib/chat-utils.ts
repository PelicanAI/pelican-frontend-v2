export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isStreaming?: boolean
  isPinned?: boolean
  isEdited?: boolean
  attachments?: Attachment[] // Added attachments property
  retryAction?: () => void // Added retry action to system messages
}

export interface Attachment {
  type: string
  name: string
  url: string
}

export interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function createUserMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: "user",
    content,
    timestamp: new Date(),
  }
}

export function createAssistantMessage(content = ""): Message {
  return {
    id: generateMessageId(),
    role: "assistant",
    content,
    timestamp: new Date(),
    isStreaming: true,
  }
}

export function createSystemMessage(content: string, retryAction?: () => void): Message {
  return {
    id: generateMessageId(),
    role: "system",
    content,
    timestamp: new Date(),
    retryAction,
  }
}
