import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { PropsWithChildren } from "react"
import { DraftIndicator } from "./DraftIndicator"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}))

describe("DraftIndicator", () => {
  it("renders without crashing", () => {
    render(<DraftIndicator pendingDraft="Hello" />)
    expect(screen.getByText(/Queued/)).toBeInTheDocument()
  })

  it("shows the draft text", () => {
    render(<DraftIndicator pendingDraft="My draft message" />)
    expect(screen.getByText(/My draft message/)).toBeInTheDocument()
  })

  it("truncates long draft text at 30 chars with ellipsis", () => {
    const longText = "This is a very long draft message that exceeds thirty characters"
    render(<DraftIndicator pendingDraft={longText} />)
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument()
  })
})
