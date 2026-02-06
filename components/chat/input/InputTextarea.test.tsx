import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { InputTextarea } from "./InputTextarea"

describe("InputTextarea", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    queueEnabled: false,
    disabled: false,
    disabledSend: false,
    isAIResponding: false,
    placeholder: "Type a message...",
    onPaste: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
  }

  it("renders without crashing", () => {
    render(<InputTextarea {...defaultProps} />)
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument()
  })

  it("displays the current value", () => {
    render(<InputTextarea {...defaultProps} value="Hello world" />)
    expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument()
  })

  it("calls onChange when text is typed", () => {
    const onChange = vi.fn()
    render(<InputTextarea {...defaultProps} onChange={onChange} />)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hi" } })
    expect(onChange).toHaveBeenCalledWith("Hi")
  })

  it("calls onSubmit on Enter (no shift)", () => {
    const onSubmit = vi.fn()
    render(<InputTextarea {...defaultProps} onSubmit={onSubmit} />)
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: false })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("does not call onSubmit on Shift+Enter", () => {
    const onSubmit = vi.fn()
    render(<InputTextarea {...defaultProps} onSubmit={onSubmit} />)
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("does not call onSubmit when AI is responding", () => {
    const onSubmit = vi.fn()
    render(<InputTextarea {...defaultProps} onSubmit={onSubmit} isAIResponding={true} />)
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: false })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("is disabled when disabled prop is true", () => {
    render(<InputTextarea {...defaultProps} disabled={true} />)
    expect(screen.getByRole("textbox")).toBeDisabled()
  })

  it("calls onFocus and onBlur", () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    render(<InputTextarea {...defaultProps} onFocus={onFocus} onBlur={onBlur} />)
    fireEvent.focus(screen.getByRole("textbox"))
    expect(onFocus).toHaveBeenCalledTimes(1)
    fireEvent.blur(screen.getByRole("textbox"))
    expect(onBlur).toHaveBeenCalledTimes(1)
  })
})
