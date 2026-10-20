import { expect, test } from "@playwright/test";

async function listingPath(page: import("@playwright/test").Page) {
  await page.goto("/opportunities");
  const href = await page.locator('a[href^="/opportunities/"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  return href!;
}

test("placement detail preserves content, typography and responsive application access", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const path = await listingPath(page);
  for (const width of [320, 767, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(path);
    const detail = page.locator(".placement-detail");
    await expect(detail.getByRole("heading", { level: 1 })).toHaveCSS("font-weight", "400");
    await expect(detail.locator("#about-placement")).toHaveCSS("font-size", width <= 767 ? "35px" : "37.5px");
    await expect(detail.locator(".placement-section-copy").first()).toHaveCSS("font-size", "17.5px");
    await expect(detail.locator(".placement-content section")).toHaveCount(3);
    for (const label of ["Location", "Start date", "End date"]) {
      await expect(detail.locator(".placement-application dt", { hasText: label })).toBeVisible();
    }
    await expect(detail.locator(".placement-orbit")).toHaveAttribute("aria-hidden", "true");
    await expect(detail.locator(".placement-content section").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const apply = width <= 767 ? detail.locator(".placement-mobile-apply a") : detail.locator(".placement-application a");
    await expect(apply).toBeVisible();
    await expect(apply).toHaveAttribute("href", /^\/apply\//);
    await apply.focus();
    await expect(apply).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test("section links move to each internship section", async ({ page }) => {
  const path = await listingPath(page);
  await page.goto(path);
  await page.getByRole("navigation", { name: "Internship sections" }).getByRole("link", { name: /Requirements/ }).click();
  await expect(page).toHaveURL(/#requirements$/);
});

test("GSAP reveals detail content without leaving hidden text", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const path = await listingPath(page);
  await page.goto(path);
  await expect(page.locator(".placement-hero h1")).toHaveCSS("opacity", "1");
  await expect(page.locator(".placement-content section").last()).toHaveCSS("opacity", "1");
  await expect(page.locator(".placement-orbit circle").last()).toHaveCSS("opacity", "1");
});
