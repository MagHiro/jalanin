import { expect, test } from "@playwright/test";

test("public shell and every landing section share the 1440px desktop boundary", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const selector of [".public-header", ".public-main", ".learn-footer-heading", ".learn-footer-content"]) {
    const box = await page.locator(selector).boundingBox();
    expect(box?.width, selector).toBe(1440);
    expect(box?.x, selector).toBe(240);
  }
  for (const selector of [".learn-hero", ".learn-intro-strip", ".learn-section", ".learn-about"]) {
    for (const section of await page.locator(selector).all()) {
      const box = await section.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(280);
      expect(box!.x + box!.width).toBeLessThanOrEqual(1640);
    }
  }
  await page.goto("/missing-public-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator(".public-state")).toHaveCSS("border-radius", "16px");
});

test("public motion survives navigation and respects live reduced-motion changes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator(".learn-hero .learn-hero-action").click();
  await expect(page).toHaveURL(/opportunities/);
  await page.goBack();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#hero-heading")).toHaveCSS("opacity", "1");
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();
  await expect(page.locator(".learn-process-step").first()).toHaveCSS("opacity", "1");
  expect(errors).toEqual([]);
});

test("public content and hero action remain available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#hero-heading")).toBeVisible();
  await page.locator(".learn-hero .learn-hero-action").click();
  await expect(page).toHaveURL(/opportunities/);
  await expect(page.getByRole("form", { name: "Search and filter internships" })).toBeVisible();
  await context.close();
});

test("secondary public routes fit small and large viewports", async ({ page }) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/auth/sign-up", "/auth/forgot-password", "/auth/reset-password", "/terms", "/opportunities/hotel-operations-singapore"]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${route} at ${width}`).toBeLessThanOrEqual(1);
    }
  }
});

test("mobile navigation dismisses with Escape and landing sections render", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const menu = page.locator('button[aria-controls="public-mobile-navigation"]');
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  for (const id of ["how-it-works", "about", "contact"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "/tmp/opencode/jalanin-g-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await page.locator("#about").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>(".learn-hero img, .learn-about img")).every((image) => image.complete && image.naturalWidth > 0));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "/tmp/opencode/jalanin-g-desktop.png", fullPage: true });
});
