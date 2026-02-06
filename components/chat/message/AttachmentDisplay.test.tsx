import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AttachmentDisplay } from "./attachment-display"

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

// Mock child components
vi.mock("../attachment-chip", () => ({
  AttachmentChip: ({ name }: { name: string }) => <div data-testid="attachment-chip">{name}</div>,
}))

vi.mock("../table-image-display", () => ({
  TableImageDisplay: () => <div data-testid="table-image">Table</div>,
}))

describe("AttachmentDisplay", () => {
  it("returns null for undefined attachments", () => {
    const { container } = render(<AttachmentDisplay attachments={undefined} />)
    expect(container.innerHTML).toBe("")
  })

  it("returns null for empty attachments array", () => {
    const { container } = render(<AttachmentDisplay attachments={[]} />)
    expect(container.innerHTML).toBe("")
  })

  it("renders non-image attachment as AttachmentChip", () => {
    render(
      <AttachmentDisplay
        attachments={[{ name: "report.pdf", type: "application/pdf", url: "https://example.com/report.pdf" }]}
      />
    )
    expect(screen.getByTestId("attachment-chip")).toBeInTheDocument()
    expect(screen.getByText("report.pdf")).toBeInTheDocument()
  })

  it("renders Pelican table image with TableImageDisplay", () => {
    render(
      <AttachmentDisplay
        attachments={[{ name: "pelican_table_1.png", type: "image/png", url: "https://example.com/table.png" }]}
      />
    )
    expect(screen.getByTestId("table-image")).toBeInTheDocument()
  })

  it("renders regular image with img tag", () => {
    render(
      <AttachmentDisplay
        attachments={[{ name: "photo.jpg", type: "image/jpeg", url: "https://example.com/photo.jpg" }]}
      />
    )
    const img = screen.getByAltText("photo.jpg")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg")
  })
})
