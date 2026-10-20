import { expect, test } from "@playwright/test";

test("application form covers all sections with responsive neutral styling", async ({ page }) => {
  const session = await page.request.post("/api/dev/session", {
    data: { userId: "00000000-0000-0000-0000-000000000091" },
  });
  expect(session.ok()).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/opportunities");
  await page.locator('main a[href^="/opportunities/"]').first().click();
  const apply = page.locator('a[href^="/apply/"]').first();
  await expect(apply).toBeVisible();
  const href = await apply.getAttribute("href");
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(href!);
    await expect(page.locator(".application-page-calm")).toBeVisible();
    await expect(page.locator(".form-section")).toHaveCount(5);
    await expect(page.getByRole("navigation", { name: "Application sections" })).toBeVisible();
    await expect(page.locator(".consent-panel")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.locator(".upload-zone")).toHaveCSS("border-top-style", "dashed");
    await expect(page.locator(".application-save-actions")).toBeVisible();
    await expect(page.locator(".page-heading h1")).toHaveCSS("font-weight", "400");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
