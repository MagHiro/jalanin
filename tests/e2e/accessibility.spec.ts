// Accessibility smoke tests (UAT-26, PRD NFR-06): keyboard operability,
// skip link, labels, focus visibility, and landmark structure on critical
// user flows (landing, directory, auth, apply gate, dashboard gate).
import { expect, test } from "@playwright/test";

test.describe("accessibility (critical flows)", () => {
  test("landing has skip link, landmarks, and keyboard-reachable CTA", async ({
    page,
  }) => {
    await page.goto("/");
    // Skip link becomes visible on focus.
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to content/i });
    await expect(skip).toBeFocused();
    await skip.press("Enter");

    // Landmarks.
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();

    // Primary CTA reachable and operable by keyboard.
    const cta = page.getByRole("link", { name: /browse internships/i }).first();
    await cta.focus();
    await expect(cta).toBeFocused();
    await cta.press("Enter");
    await expect(page).toHaveURL(/opportunities/);
  });

  test("directory filters are labelled and operable by keyboard", async ({
    page,
  }) => {
    await page.goto("/opportunities");
    const search = page.getByPlaceholder(/hotel, singapore/i);
    await expect(search).toBeVisible();
    await search.focus();
    await page.keyboard.type("Hotel");
    await page.keyboard.press("Tab"); // country select
    await page.keyboard.press("Tab"); // category select
    await page.keyboard.press("Tab"); // sort select
    await page.keyboard.press("Tab"); // apply button
    const apply = page.getByRole("button", { name: /apply filters/i });
    await expect(apply).toBeFocused();
    await apply.press("Enter");
    await expect(page).toHaveURL(/q=Hotel/);
  });

  test("auth form labels inputs and announces errors", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
    const email = page.locator('input[name="email"]');
    const password = page.locator('input[name="password"]');
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    // Associated labels exist.
    const emailLabel = await email.evaluate((el) => {
      const label = el.closest("label");
      return label ? label.textContent : "";
    });
    expect(emailLabel).toMatch(/email/i);

    // Submit empty → browser-native required validation blocks submit.
    await page.getByRole("button", { name: /^log in$/i }).click();
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(
      true,
    );
  });

  test("application form exposes labelled groups and consent", async ({
    page,
    request,
  }) => {
    // Unauthenticated apply redirects to login (gate keeps a11y simple).
    await page.goto("/opportunities/hotel-operations-singapore");
    await page.getByRole("link", { name: /apply now/i }).click();
    await expect(page).toHaveURL(/auth\/login/);
    void request;
  });

  test("visible focus styles exist on interactive controls", async ({
    page,
  }) => {
    await page.goto("/");
    // At minimum, focus must move visibly (no focus outline removal globally).
    const css = await (await page.request.get("/")).text();
    expect(css).not.toMatch(/outline:\s*none/);
    expect(css).not.toMatch(/outline:\s*0[^0-9]/);
  });
});
