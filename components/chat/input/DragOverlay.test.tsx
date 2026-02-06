import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { PropsWithChildren } from "react"
import { DragOverlay } from "./DragOverlay"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}))

describe("DragOverlay", () => {
  it("renders without crashing", () => {
    render(<DragOverlay />)
    expect(screen.getByText("Drop file to attach")).toBeInTheDocument()
  })
})
