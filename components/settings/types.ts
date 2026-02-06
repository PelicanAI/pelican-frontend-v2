/**
 * Shared types and constants for Settings components.
 */

// ============================================================================
// Types
// ============================================================================

export interface UserSettings {
  // Account
  email: string

  // Trading Preferences
  default_timeframes: string[]
  preferred_markets: string[]
  risk_tolerance: "conservative" | "moderate" | "aggressive"
  default_position_size?: number
  favorite_tickers: string[]
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_SETTINGS: Partial<UserSettings> = {
  default_timeframes: ["5m", "15m", "1h"],
  preferred_markets: ["stocks"],
  risk_tolerance: "moderate",
  favorite_tickers: [],
}

export const POPULAR_TICKERS = [
  "SPY", "QQQ", "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL",
  "META", "AMD", "NFLX", "DIS", "INTC", "BABA", "NIO", "PLTR"
]
