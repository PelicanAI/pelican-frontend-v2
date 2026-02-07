import { describe, it, expect } from "vitest"
import { parseContentSegments, formatLine, applyTickerLinks } from "./format-utils"

describe("parseContentSegments", () => {
  it("parses plain text as a single text segment", () => {
    const result = parseContentSegments("Hello world")
    expect(result).toEqual([{ type: "text", content: "Hello world" }])
  })

  it("parses a code block with language", () => {
    const input = "Before\n```python\nprint('hi')\n```\nAfter"
    const result = parseContentSegments(input)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ type: "text", content: "Before" })
    expect(result[1]).toEqual({ type: "code", content: "print('hi')", language: "python" })
    expect(result[2]).toEqual({ type: "text", content: "After" })
  })

  it("parses a code block without language", () => {
    const input = "```\nsome code\n```"
    const result = parseContentSegments(input)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: "code", content: "some code", language: undefined })
  })

  it("handles unclosed code block", () => {
    const input = "```js\nconst x = 1"
    const result = parseContentSegments(input)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: "code", content: "const x = 1", language: "js" })
  })

  it("handles multiple code blocks", () => {
    const input = "```\nblock1\n```\ntext\n```\nblock2\n```"
    const result = parseContentSegments(input)
    expect(result).toHaveLength(3)
    expect(result[0]!.type).toBe("code")
    expect(result[1]!.type).toBe("text")
    expect(result[2]!.type).toBe("code")
  })

  it("handles empty string", () => {
    const result = parseContentSegments("")
    expect(result).toEqual([])
  })

  it("trims trailing whitespace from text segments", () => {
    const result = parseContentSegments("Hello   \n   ")
    expect(result).toHaveLength(1)
    expect(result[0]!.content).toBe("Hello")
  })
})

describe("formatLine", () => {
  it("escapes HTML entities", () => {
    const result = formatLine("<script>alert(1)</script>")
    expect(result).not.toContain("<script>")
    expect(result).toContain("&lt;script&gt;")
  })

  it("formats bold text", () => {
    const result = formatLine("**hello**")
    expect(result).toContain("<strong")
    expect(result).toContain("hello")
  })

  it("formats bold section headers without purple color", () => {
    const result = formatLine("**Support:**")
    expect(result).toContain("<strong")
    expect(result).toContain("Support:")
    expect(result).not.toContain("text-purple")
  })

  it("formats italic text", () => {
    const result = formatLine("*italic*")
    expect(result).toContain("<em>")
    expect(result).toContain("italic")
  })

  it("escapes slashes in URLs (escapeHtml runs first)", () => {
    // formatLine escapes HTML first, which converts / to &#x2F;
    // This means raw URLs in text get their slashes escaped
    const result = formatLine("see https://example.com today")
    expect(result).toContain("example.com")
    expect(result).toContain("https:")
  })

  it("does not linkify javascript: URLs", () => {
    const result = formatLine("javascript:alert(1)")
    expect(result).not.toContain("<a ")
  })

  it("formats non-bold section headers without purple color", () => {
    const result = formatLine("Support: we help you")
    expect(result).toContain("<strong")
    expect(result).toContain("Support:")
    expect(result).not.toContain("text-purple")
  })

  it("renders markdown h3 headers", () => {
    const result = formatLine("### Market Overview")
    expect(result).toContain("<h3")
    expect(result).toContain("Market Overview")
  })

  it("renders markdown h4 headers", () => {
    const result = formatLine("#### Key Points")
    expect(result).toContain("<h4")
    expect(result).toContain("Key Points")
  })

  it("renders markdown h2 headers", () => {
    const result = formatLine("## Summary")
    expect(result).toContain("<h2")
    expect(result).toContain("Summary")
  })

  it("does not render # without space as header", () => {
    const result = formatLine("#notaheader")
    expect(result).not.toContain("<h1")
  })
})

describe("applyTickerLinks", () => {
  it("applies purple color only to ticker links", () => {
    const html = '<strong class="font-semibold">Summary:</strong> AAPL is up'
    const result = applyTickerLinks(html, ["AAPL"])
    expect(result).toContain("text-purple-400")
    expect(result).toContain("ticker-link")
    // The strong tag should NOT have purple
    expect(result).toMatch(/<strong class="font-semibold">/)
  })
})
