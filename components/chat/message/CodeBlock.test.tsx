import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { CodeBlock } from "./code-block"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const safeProps: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          safeProps[key] = value
        }
      }
      return <div {...(safeProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
}))

// Mock DOMPurify
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: (input: string) => input,
  },
}))

describe("CodeBlock", () => {
  it("renders code content", () => {
    render(<CodeBlock content="const x = 1" index={0} />)
    expect(screen.getByText("const x = 1")).toBeInTheDocument()
  })

  it("displays language label when provided", () => {
    render(<CodeBlock content="print('hi')" language="python" index={0} />)
    expect(screen.getByText("python")).toBeInTheDocument()
  })

  it("renders copy button with correct aria-label", () => {
    render(<CodeBlock content="code" index={0} />)
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument()
  })
})
