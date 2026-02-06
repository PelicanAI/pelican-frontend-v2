import { safeTrim } from "@/lib/utils"
import { escapeHtml } from "@/lib/sanitize"
import DOMPurify from "isomorphic-dompurify"

export type ContentSegment =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language?: string }

const LINK_REGEX = /(https?:\/\/[^\s]+)/g

export function parseContentSegments(content: string): ContentSegment[] {
  const lines = content.split("\n")
  const segments: ContentSegment[] = []

  let isInCodeBlock = false
  let currentLanguage: string | undefined
  let codeBuffer: string[] = []
  let textBuffer: string[] = []

  const flushText = () => {
    if (textBuffer.length > 0) {
      const text = textBuffer.join("\n").trimEnd()
      if (text.length > 0) {
        segments.push({ type: "text", content: text })
      }
      textBuffer = []
    }
  }

  const flushCode = () => {
    const code = codeBuffer.join("\n")
    segments.push({ type: "code", content: code, language: currentLanguage })
    codeBuffer = []
    currentLanguage = undefined
  }

  for (const line of lines) {
    const fenceMatch = line.match(/^```(.*)?$/)

    if (fenceMatch) {
      if (isInCodeBlock) {
        flushCode()
        isInCodeBlock = false
      } else {
        flushText()
        isInCodeBlock = true
        const language = fenceMatch[1] ? safeTrim(fenceMatch[1]) : undefined
        currentLanguage = language ? language : undefined
      }
      continue
    }

    if (isInCodeBlock) {
      codeBuffer.push(line)
    } else {
      textBuffer.push(line)
    }
  }

  if (isInCodeBlock) {
    flushCode()
  }

  if (textBuffer.length > 0) {
    const text = textBuffer.join("\n").trimEnd()
    if (text.length > 0) {
      segments.push({ type: "text", content: text })
    }
  }

  return segments
}

export function formatLine(line: string): string {
  // Step 1: Escape HTML first
  let escaped = escapeHtml(line)

  // Step 2: Apply markdown formatting on escaped content
  // Handle bold text with colored section headers
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, (_, content) => {
    // Section headers end with colon - apply purple accent color
    if (content.endsWith(':')) {
      return `<strong class="font-semibold text-purple-400">${content}</strong>`
    }
    return `<strong class="font-[600]">${content}</strong>`
  })

  // Also handle non-bold section headers (word followed by colon at start of line)
  if (/^[A-Z][a-zA-Z\s]+:/.test(escaped) && !escaped.includes('<strong')) {
    escaped = escaped.replace(/^([A-Z][a-zA-Z\s]+:)/, '<strong class="font-semibold text-purple-400">$1</strong>')
  }

  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Step 3: Safe link handling with URL validation
  escaped = escaped.replace(LINK_REGEX, (match) => {
    try {
      const url = new URL(match)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return match
      }
      const sanitizedUrl = DOMPurify.sanitize(match, {ALLOWED_TAGS: []})
      return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-600 font-[500] break-all">${match}</a>`
    } catch {
      return match
    }
  })

  // Step 4: Final sanitization with strict URI regexp
  return DOMPurify.sanitize(escaped, {
    ALLOWED_TAGS: ["strong", "em", "a", "span", "br"],
    ALLOWED_ATTR: {
      a: ["href", "target", "rel", "class"],
      span: ["class"],
      strong: ["class"],
      em: ["class"],
    } as unknown as string[],
    ALLOWED_URI_REGEXP: /^https?:\/\//i
  })
}

/**
 * Wrap ticker symbols in clickable spans within already-formatted HTML.
 * Skips matches inside HTML tags to avoid corrupting markup.
 */
export function applyTickerLinks(html: string, tickers: string[]): string {
  if (!tickers || tickers.length === 0) return html

  let result = html
  for (const ticker of tickers) {
    // Match the ticker as a standalone word, but only outside of HTML tags.
    // Split on HTML tags, process only text parts.
    const parts = result.split(/(<[^>]*>)/g)
    result = parts
      .map((part) => {
        // If this part is an HTML tag, leave it alone
        if (part.startsWith("<")) return part
        // Replace standalone ticker matches in text content
        const re = new RegExp(`\\b(${ticker})\\b`, "g")
        return part.replace(
          re,
          `<span class="ticker-link text-purple-400 hover:text-purple-300 underline decoration-purple-400/40 hover:decoration-purple-300 cursor-pointer font-medium" data-ticker="${ticker}">$1</span>`
        )
      })
      .join("")
  }

  // Re-sanitize with data-ticker allowed
  return DOMPurify.sanitize(result, {
    ALLOWED_TAGS: ["strong", "em", "a", "span", "br"],
    ALLOWED_ATTR: {
      a: ["href", "target", "rel", "class"],
      span: ["class", "data-ticker"],
      strong: ["class"],
      em: ["class"],
    } as unknown as string[],
    ALLOWED_URI_REGEXP: /^https?:\/\//i,
  })
}
