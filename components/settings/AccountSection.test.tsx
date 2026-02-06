import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AccountSection } from "./AccountSection"
import type { UserSettings } from "./types"

vi.mock("./SubscriptionCard", () => ({
  SubscriptionCard: () => <div data-testid="subscription-card" />,
}))

vi.mock("./SecuritySection", () => ({
  SecuritySection: () => <div data-testid="security-section" />,
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import type { SupabaseClient } from "@supabase/supabase-js"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const mockSupabase = {} as unknown as SupabaseClient

const defaultSettings: UserSettings = {
  email: "test@example.com",
  default_timeframes: ["5m"],
  preferred_markets: ["stocks"],
  risk_tolerance: "moderate",
  favorite_tickers: [],
}

const mockUser = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "test@example.com",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "",
} as unknown as SupabaseUser

describe("AccountSection", () => {
  it("renders without crashing for authenticated user", () => {
    render(
      <AccountSection user={mockUser} settings={defaultSettings} supabase={mockSupabase} />
    )
    expect(screen.getByText("Account Information")).toBeInTheDocument()
    expect(screen.getByTestId("subscription-card")).toBeInTheDocument()
    expect(screen.getByTestId("security-section")).toBeInTheDocument()
  })

  it("shows guest banner when user is null", () => {
    render(
      <AccountSection user={null} settings={defaultSettings} supabase={mockSupabase} />
    )
    expect(screen.getByText("Sign in to save your settings")).toBeInTheDocument()
    expect(screen.queryByTestId("subscription-card")).not.toBeInTheDocument()
  })

  it("displays the user email", () => {
    render(
      <AccountSection user={mockUser} settings={defaultSettings} supabase={mockSupabase} />
    )
    const emailInput = screen.getByDisplayValue("test@example.com")
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toBeDisabled()
  })
})
