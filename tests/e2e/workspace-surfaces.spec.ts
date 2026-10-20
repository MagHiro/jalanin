import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const session = await page.request.post("/api/dev/session", {
    data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
  });
  expect(session.ok()).toBeTruthy();
});

test("admin overview shares the reference card and typography system", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/admin");
  await expect(page.locator(".workspace-body")).toHaveCSS("background-color", "rgb(245, 246, 248)");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "37.5px");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-weight", "400");
  await expect(page.locator(".ops-panel").first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.getByRole("link", { name: "Open applications", exact: true })).toHaveCSS("background-color", "rgb(16, 37, 104)");
  await page.getByRole("link", { name: "Open applications", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/applications$/);
  await expect(page.locator(".crm-records")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".crm-table th").first()).toHaveCSS("font-size", "15px");
  await expect(page.getByRole("searchbox")).toBeVisible();
});

test("workspace cards and headings remain readable on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["/admin", "/admin/applications", "/admin/placements"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "35px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();
});
