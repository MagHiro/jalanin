import { expect, test } from "@playwright/test";

test("editorial shell keeps centered hero copy and inset Coda-inspired navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const selector of [".public-main", ".learn-footer-heading", ".learn-footer-content"]) {
    const box = await page.locator(selector).boundingBox();
    expect(box?.width, selector).toBe(1440);
    expect(box?.x, selector).toBe(240);
  }
  const header = await page.locator(".public-header").boundingBox();
  expect(header?.width).toBe(1600);
  expect(header?.x).toBe(160);
  await expect(page.locator(".public-header")).toHaveCSS("border-radius", "32px");
  await expect(page.locator(".public-header")).toHaveCSS("backdrop-filter", "blur(20px) saturate(1.2)");
  const navigation = await page.locator('nav[aria-label="Primary"]').boundingBox();
  expect(Math.abs(navigation!.x + navigation!.width / 2 - 960)).toBeLessThanOrEqual(1);
  await expect(page.locator(".public-header")).toHaveCSS("border-top-width", "0px");
  await expect(page.locator(".public-brand img")).toHaveAttribute("alt", "Jalanin Internship Program");
  await expect(page.locator('.public-header nav[aria-label="Primary"] a').first()).toHaveCSS("font-weight", "550");
  await expect(page.locator(".public-header-cta").first()).toHaveCSS("border-radius", "17px");
  await expect(page.locator(".public-header-cta").first().locator("svg")).toHaveCount(1);
  await expect(page.locator('.public-header a[href="/admin"]')).toHaveCount(0);
  await expect(page.locator(".public-header").getByRole("button", { name: /log out|sign out/i })).toHaveCount(0);
  for (const selector of [".learn-intro-strip", ".learn-section", ".learn-about"]) {
    for (const section of await page.locator(selector).all()) {
      const box = await section.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(232);
      expect(box!.x + box!.width).toBeLessThanOrEqual(1688);
    }
  }
  const hero = await page.locator(".learn-hero").boundingBox();
  expect(hero?.x).toBe(0);
  expect(hero?.width).toBe(1920);
  await expect(page.locator(".learn-intro-strip")).toHaveCount(0);
  expect(hero?.y).toBe(0);
  expect(header!.y).toBeGreaterThan(hero!.y);
  expect(header!.y + header!.height).toBeLessThan(hero!.y + hero!.height);
  const heading = await page.locator("#hero-heading").boundingBox();
  expect(Math.abs(heading!.x + heading!.width / 2 - 960)).toBeLessThanOrEqual(1);
  await expect(page.locator("#hero-heading")).toHaveCSS("font-weight", "400");
  await expect(page.locator("#hero-heading em")).toHaveCSS("font-weight", "400");
  await expect(page.locator(".origin-hero-description")).toHaveText("New places. Real experience. Your next chapter.");
  await expect(page.locator(".origin-hero-proof")).toHaveCount(0);
  await page.goto("/missing-public-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator(".public-state")).toHaveCSS("border-radius", "12px");
});

test("footer uses the approved type scale and preserves navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole("heading", { name: "Go further. Learn by doing." })).toHaveCSS("font-size", width === 375 ? "35px" : "37.5px");
    await expect(footer.getByRole("img", { name: "Jalanin Internship Program" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
    await expect(footer.getByRole("link", { name: "Terms of service" })).toHaveAttribute("href", "/terms");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
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

test("navbar uses regular compact typography on desktop and mobile", async ({ page }) => {
  for (const width of [375, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const header = page.locator(".origin-nav");
    if (width < 1024) {
      await header.getByRole("button", { name: "Menu" }).click();
      await expect(header.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    }
    const labels = header.locator(width < 1024
      ? ".public-menu-toggle, .public-mobile-link .flex-1 > span, .public-mobile-panel .public-account-link, .public-mobile-panel .public-header-cta"
      : ".public-nav-link, .public-account .public-account-link, .public-account .public-header-cta");
    for (const label of await labels.all()) {
      await expect(label).toHaveCSS("font-size", "15px");
      await expect(label).toHaveCSS("font-weight", "400");
      await expect(label).toHaveCSS("letter-spacing", "normal");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test("hero typography follows the approved responsive scale on desktop and mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [375, 767, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const hero = page.locator(".origin-hero");
    const heading = hero.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCSS("font-size", width < 880 ? "44px" : "72px");
    await expect(heading).toHaveCSS("font-weight", "400");
    await expect(heading.locator("em")).toHaveCSS("font-style", "normal");
    await expect(hero.locator(".origin-kicker")).toHaveCSS("text-transform", "none");
    await expect(hero.locator(".origin-hero-description")).toHaveCSS("font-size", width <= 767 ? "17.5px" : "18px");
    await expect(hero.locator(".origin-hero-description")).toHaveCSS("letter-spacing", "normal");
    const action = hero.locator(".origin-hero-action");
    await expect(action).toHaveCSS("font-size", "15px");
    await expect(action).toHaveCSS("font-weight", "400");
    await expect(action).toHaveAttribute("href", "/opportunities");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test("featured internships use compact responsive rows and preserve discovery links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const section = page.locator(".featured-internships");
    await expect(section.getByRole("heading", { name: "Featured internships" })).toBeVisible();
    await expect(section.getByRole("link", { name: "View all internships" })).toHaveAttribute("href", "/opportunities");
    await expect(section.locator(".learn-opportunity-grid")).toHaveCSS("grid-template-columns", /\d/);
    for (const card of await section.locator(".featured-role-row").all()) {
      await expect(card.locator(".featured-role-action")).toHaveAttribute("href", /^\/opportunities\//);
      await expect(card).toHaveCSS("border-radius", "0px");
      const box = await card.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
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
  await expect(page.locator(".origin-hero-description")).toHaveCSS("font-size", "17.5px");
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

test("editorial sections retain functional links, labels and the workplace hero photo", async ({ page }) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const heroPhoto = page.locator(".learn-hero img");
    await expect(heroPhoto).toBeVisible();
    await expect(heroPhoto).toHaveJSProperty("complete", true);
    expect(await heroPhoto.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByRole("heading", { name: "One step at a time." })).toBeVisible();
    await expect(page.getByRole("form", { name: "Contact Jalanin" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse internships/ }).first()).toHaveAttribute("href", "/opportunities");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `landing width ${width}`).toBeLessThanOrEqual(1);
    await page.goto("/opportunities");
    await expect(page.getByRole("heading", { name: /Available internships/ })).toBeVisible();
    await expect(page.getByRole("form", { name: "Search and filter internships" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `directory width ${width}`).toBeLessThanOrEqual(1);
  }
});
