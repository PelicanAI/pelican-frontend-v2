import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SettingsSidebar } from "./SettingsSidebar"

describe("SettingsSidebar", () => {
  it("renders all navigation sections", () => {
    render(
      <SettingsSidebar activeSection="account" onSectionChange={vi.fn()} />
    )
    expect(screen.getByText("Account")).toBeInTheDocument()
    expect(screen.getByText("Trading Preferences")).toBeInTheDocument()
    expect(screen.getByText("Data & Privacy")).toBeInTheDocument()
  })

  it("highlights the active section", () => {
    render(
      <SettingsSidebar activeSection="trading" onSectionChange={vi.fn()} />
    )
    const tradingButton = screen.getByText("Trading Preferences").closest("button")
    expect(tradingButton?.className).toContain("text-purple")
  })

  it("calls onSectionChange when a section is clicked", () => {
    const onSectionChange = vi.fn()
    render(
      <SettingsSidebar activeSection="account" onSectionChange={onSectionChange} />
    )
    fireEvent.click(screen.getByText("Data & Privacy"))
    expect(onSectionChange).toHaveBeenCalledWith("privacy")
  })
})
