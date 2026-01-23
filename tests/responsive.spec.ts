import { test, expect, type Page } from "@playwright/test"

const viewports = [
  { name: "320x568", width: 320, height: 568 },
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
  { name: "414x896", width: 414, height: 896 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "834x1112", width: 834, height: 1112 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x720", width: 1280, height: 720 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "2560x1440", width: 2560, height: 1440 },
  { name: "3840x2160", width: 3840, height: 2160 },
]

const routes = [
  { path: "/", label: "home" },
  { path: "/faq", label: "faq" },
  { path: "/pricing", label: "pricing" },
  { path: "/auth/login", label: "login" },
  { path: "/auth/signup", label: "signup" },
  { path: "/chat", label: "chat" },
  { path: "/settings", label: "settings" },
  { path: "/profile", label: "profile" },
]

async function assertNoHorizontalOverflow(page: Page) {
  const [scrollWidth, innerWidth] = await page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    const width = Math.max(
      doc.scrollWidth,
      doc.offsetWidth,
      body.scrollWidth,
      body.offsetWidth,
    )
    return [width, window.innerWidth]
  })
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1)
}

async function assertMarketingNav(page: Page) {
  const navLinks = page.locator("nav .nav-links")
  const navToggle = page.getByRole("button", { name: /open menu/i })
  const navLinksVisible = await navLinks.isVisible().catch(() => false)
  const navToggleVisible = await navToggle.isVisible().catch(() => false)
  expect(navLinksVisible || navToggleVisible).toBeTruthy()

  if (navToggleVisible) {
    await navToggle.click()
  }

  const cta = page.getByRole("button", { name: /launch app|get started/i }).first()
  await expect(cta).toBeVisible()
}

async function assertChatEntry(page: Page) {
  const chatInput = page.getByPlaceholder(/ask pelican|message pelican/i)
  const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/trader@example.com/i))

  if (await chatInput.isVisible().catch(() => false)) {
    await expect(chatInput).toBeVisible()
  } else {
    await expect(emailInput).toBeVisible()
  }
}

async function assertProfileOrLogin(page: Page) {
  const profileHeading = page.getByRole("heading", { name: /profile|trader/i })
  const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/trader@example.com/i))

  if (await profileHeading.isVisible().catch(() => false)) {
    await expect(profileHeading).toBeVisible()
  } else {
    await expect(emailInput).toBeVisible()
  }
}

test.describe("responsive smoke", () => {
  for (const viewport of viewports) {
    test(`viewport ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)

      for (const route of routes) {
        await page.goto(route.path, { waitUntil: "domcontentloaded" })
        await assertNoHorizontalOverflow(page)

        if (route.path === "/") {
          await assertMarketingNav(page)
          await expect(page.getByRole("heading", { name: /trading intelligence/i })).toBeVisible()
          await expect(page.getByText(/start trading/i)).toBeVisible()
        }

        if (route.path === "/faq") {
          await assertMarketingNav(page)
          await expect(page.getByText(/help center/i)).toBeVisible()
        }

        if (route.path === "/pricing") {
          await expect(page.getByRole("heading", { name: /pricing/i }).first()).toBeVisible()
        }

        if (route.path === "/auth/login" || route.path === "/auth/signup") {
          await expect(page.getByLabel(/email/i)).toBeVisible()
        }

        if (route.path === "/chat") {
          await assertChatEntry(page)
        }

        if (route.path === "/settings") {
          await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible()
        }

        if (route.path === "/profile") {
          await assertProfileOrLogin(page)
        }
      }
    })
  }
})

