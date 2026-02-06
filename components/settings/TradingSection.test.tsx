import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TradingSection } from "./TradingSection"
import type { UserSettings } from "./types"

const defaultSettings: UserSettings = {
  email: "test@example.com",
  default_timeframes: ["5m", "15m"],
  preferred_markets: ["stocks"],
  risk_tolerance: "moderate",
  favorite_tickers: ["AAPL"],
}

describe("TradingSection", () => {
  it("renders without crashing", () => {
    render(
      <TradingSection settings={defaultSettings} updateSetting={vi.fn()} />
    )
    expect(screen.getByText("Default Timeframes")).toBeInTheDocument()
    expect(screen.getByText("Preferred Markets")).toBeInTheDocument()
    expect(screen.getByText("Risk Tolerance")).toBeInTheDocument()
    expect(screen.getByText("Favorite Tickers")).toBeInTheDocument()
  })

  it("displays current favorite tickers", () => {
    render(
      <TradingSection settings={defaultSettings} updateSetting={vi.fn()} />
    )
    expect(screen.getByText("AAPL")).toBeInTheDocument()
  })

  it("calls updateSetting when a timeframe is toggled", () => {
    const updateSetting = vi.fn()
    render(
      <TradingSection settings={defaultSettings} updateSetting={updateSetting} />
    )
    // Click on "1h" checkbox (not currently in the settings)
    const checkbox = screen.getByLabelText("1h")
    fireEvent.click(checkbox)
    expect(updateSetting).toHaveBeenCalledWith("default_timeframes", ["5m", "15m", "1h"])
  })

  it("calls updateSetting when risk tolerance changes", () => {
    const updateSetting = vi.fn()
    render(
      <TradingSection settings={defaultSettings} updateSetting={updateSetting} />
    )
    fireEvent.click(screen.getByLabelText(/Aggressive/))
    expect(updateSetting).toHaveBeenCalledWith("risk_tolerance", "aggressive")
  })

  it("adds a ticker via the input", () => {
    const updateSetting = vi.fn()
    render(
      <TradingSection settings={defaultSettings} updateSetting={updateSetting} />
    )
    const input = screen.getByPlaceholderText("Enter ticker symbol (e.g., AAPL)")
    fireEvent.change(input, { target: { value: "MSFT" } })
    fireEvent.click(screen.getByText("Add"))
    expect(updateSetting).toHaveBeenCalledWith("favorite_tickers", ["AAPL", "MSFT"])
  })
})
