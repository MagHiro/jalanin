import { expect, test } from "@playwright/test";

test("admin overview has a restrained, responsive hierarchy", async ({ page }) => {
  const session = await page.request.post("/api/dev/session", {
    data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
  });
  expect(session.ok()).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
    await expect(page.locator(".ops-quiet-graphic")).toBeVisible();
    await expect(page.locator(".ops-quiet-graphic")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".ops-metric")).toHaveCount(4);
    await expect(page.locator(".ops-stage")).toHaveCount(6);
    await expect(page.locator(".ops-stage-fill").first()).toHaveCSS("background-color", "rgb(129, 148, 191)");
    await expect(page.locator(".ops-priority > a")).toBeVisible();
    await expect(page.locator(".ops-panel-head .ops-label")).toHaveCount(0);
    await expect(page.locator(".ops-placement-summary .ops-placement-action, .ops-placement-summary .discovery-empty-action")).toHaveCSS("background-color", "rgb(16, 37, 104)");
    if (await page.locator(".ops-placement-summary .discovery-empty").count()) {
      await expect(page.locator(".ops-placement-summary .placement-line-graphic")).toBeVisible();
      await expect(page.locator(".ops-placement-summary .discovery-empty h2")).toHaveText("No placements yet");
    }
    if (await page.locator(".ops-activity .discovery-empty").count()) {
      await expect(page.locator(".ops-activity-footer")).toHaveCount(0);
      await expect(page.locator(".ops-activity .discovery-empty-action")).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
