import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely trim a value, converting to string if needed
 * Prevents TypeError when .trim() is called on non-string values
 */
export function safeTrim(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  if (typeof value === 'string') {
    return value.trim()
  }
  
  if (typeof value === 'object') {
    // If it's an object with a 'message' or 'content' field, use that
    if ('message' in value && typeof value.message === 'string') {
      return value.message.trim()
    }
    if ('content' in value && typeof value.content === 'string') {
      return value.content.trim()
    }
    // Otherwise stringify the object
    return JSON.stringify(value).trim()
  }
  
  return String(value).trim()
}