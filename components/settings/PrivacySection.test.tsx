import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { PrivacySection } from "./PrivacySection"

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import type { User as SupabaseUser } from "@supabase/supabase-js"

const mockUser = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "test@example.com",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "",
} as unknown as SupabaseUser

describe("PrivacySection", () => {
  it("renders without crashing", () => {
    render(<PrivacySection user={mockUser} />)
    expect(screen.getByText("Data & Privacy")).toBeInTheDocument()
  })

  it("shows legal links", () => {
    render(<PrivacySection user={mockUser} />)
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument()
    expect(screen.getByText("Terms of Service")).toBeInTheDocument()
  })

  it("shows logout button for authenticated users", () => {
    render(<PrivacySection user={mockUser} />)
    expect(screen.getByText("Log Out")).toBeInTheDocument()
  })

  it("hides logout button for guests", () => {
    render(<PrivacySection user={null} />)
    expect(screen.queryByText("Log Out")).not.toBeInTheDocument()
  })
})
