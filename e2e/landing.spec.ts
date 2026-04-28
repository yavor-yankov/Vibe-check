import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders hero section with CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("link", { name: /start free/i })).toBeVisible();
  });

  test("pricing section shows three tiers", async ({ page }) => {
    await page.goto("/");
    // Scroll to pricing section
    await page.locator("text=Pick a plan").scrollIntoViewIfNeeded();
    await expect(page.locator("text=Free")).toBeVisible();
    await expect(page.locator("text=Pro")).toBeVisible();
    await expect(page.locator("text=Lifetime")).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    // Click pricing link
    await page.getByRole("link", { name: /pricing/i }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.locator("h1")).toContainText("Pick a plan");
  });
});

test.describe("Sign-in page", () => {
  test("renders email input and sign-in form", async ({ page }) => {
    await page.goto("/signin");
    await expect(
      page.getByPlaceholder(/email/i)
    ).toBeVisible();
  });
});

test.describe("Pricing page", () => {
  test("renders correct quota (3 checks)", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("text=3 vibe checks")).toBeVisible();
  });

  test("does not mention Gemini anywhere", async ({ page }) => {
    await page.goto("/pricing");
    const content = await page.textContent("body");
    expect(content?.toLowerCase()).not.toContain("gemini");
  });
});
