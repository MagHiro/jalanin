import { test, expect } from "@playwright/test";

test.describe("Mobbin-derived workspace structure", () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.request.post("/api/dev/session", {
      data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
    });
    expect(response.ok()).toBeTruthy();
  });

  test("admin overview uses genuine records and divided metric ribbon", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin");
    await expect(page.locator(".workspace-stat-strip .workspace-stat")).toHaveCount(4);
    await expect(page.locator(".workspace-recent-records")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent submissions" })).toBeVisible();
    await expect(page.locator(".workspace-sidebar")).toBeVisible();
    await expect(page.locator(".workspace-topbar")).toBeVisible();
  });

  test("admin list screens share authentic CRM views and metadata", async ({ page }) => {
    for (const route of ["/admin/internships", "/admin/applications", "/admin/students", "/admin/placements", "/admin/contacts", "/admin/notifications"]) {
      await page.goto(route);
      await expect(page.locator(".page-heading h1")).toBeVisible();
      await expect(page.locator(".crm-records")).toBeVisible();
      await expect(page.locator(".crm-table-meta")).toBeVisible();
    }
    await page.goto("/admin/applications");
    await expect(page.getByRole("navigation", { name: "Application queues" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Application queues" }).getByRole("link", { name: "New", exact: true })).toBeVisible();
  });

  test("editor layouts preserve real forms, dropdown and contextual guidance", async ({ page }) => {
    for (const route of ["/admin/internships/new", "/admin/placements/new"]) {
      await page.goto(route);
      await expect(page.locator(".workspace-editor-heading h1")).toBeVisible();
      await expect(page.locator(".workspace-editor-layout")).toBeVisible();
      await expect(page.locator(".workspace-editor-aside")).toBeVisible();
      await expect(page.locator(".workspace-editor-layout form")).toBeVisible();
    }
    await page.goto("/admin/internships/new");
    await page.getByRole("combobox", { name: "Publication status" }).click();
    await expect(page.getByRole("option", { name: "Published" })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("compact viewport editor does not produce horizontal overflow", async ({ page }) => {
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("/admin/internships/new");
      await expect(page.locator(".workspace-editor-layout")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
});
