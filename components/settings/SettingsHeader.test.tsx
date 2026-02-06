import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SettingsHeader } from "./SettingsHeader"

vi.mock("@/components/language-selector", () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
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

describe("SettingsHeader", () => {
  it("renders without crashing", () => {
    render(
      <SettingsHeader
        user={mockUser}
        isSaving={false}
        hasUnsavedChanges={false}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("shows Save Changes button for authenticated users", () => {
    render(
      <SettingsHeader
        user={mockUser}
        isSaving={false}
        hasUnsavedChanges={true}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText("Save Changes")).toBeInTheDocument()
  })

  it("shows Sign Up button for guests", () => {
    render(
      <SettingsHeader
        user={null}
        isSaving={false}
        hasUnsavedChanges={false}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText("Sign Up to Save")).toBeInTheDocument()
  })

  it("disables save button when no unsaved changes", () => {
    render(
      <SettingsHeader
        user={mockUser}
        isSaving={false}
        hasUnsavedChanges={false}
        onSave={vi.fn()}
      />
    )
    const saveButton = screen.getByText("Save Changes").closest("button")
    expect(saveButton).toBeDisabled()
  })

  it("shows loading state when saving", () => {
    render(
      <SettingsHeader
        user={mockUser}
        isSaving={true}
        hasUnsavedChanges={true}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText("Saving...")).toBeInTheDocument()
  })
})
