import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import type { PropsWithChildren } from "react"
import { SendButton } from "./SendButton"

// Mock framer-motion to render plain elements
vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
}))

describe("SendButton", () => {
  it("renders without crashing", () => {
    render(
      <SendButton
        isAIResponding={false}
        isSendDisabled={false}
        onStop={undefined}
        onSend={vi.fn()}
      />,
    )
    // The send icon (SVG) should be present
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("calls onSend when clicked and not disabled", () => {
    const onSend = vi.fn()
    render(
      <SendButton
        isAIResponding={false}
        isSendDisabled={false}
        onStop={undefined}
        onSend={onSend}
      />,
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it("is disabled when isSendDisabled is true and not responding", () => {
    const onSend = vi.fn()
    render(
      <SendButton
        isAIResponding={false}
        isSendDisabled={true}
        onStop={undefined}
        onSend={onSend}
      />,
    )
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("calls onStop when AI is responding and onStop is provided", () => {
    const onStop = vi.fn()
    const onSend = vi.fn()
    render(
      <SendButton
        isAIResponding={true}
        isSendDisabled={false}
        onStop={onStop}
        onSend={onSend}
      />,
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onSend).not.toHaveBeenCalled()
  })

  it("is not disabled when AI is responding (stop button active)", () => {
    render(
      <SendButton
        isAIResponding={true}
        isSendDisabled={true}
        onStop={vi.fn()}
        onSend={vi.fn()}
      />,
    )
    expect(screen.getByRole("button")).not.toBeDisabled()
  })
})
