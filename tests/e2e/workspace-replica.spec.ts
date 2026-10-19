import { test, expect } from "@playwright/test";

test.describe("Mobbin-derived workspace structure", () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.request.post("/api/dev/session", {
      data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
    });
    expect(response.ok()).toBeTruthy();
  });

  test("admin overview prioritizes review queue and genuine operational records", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin");
    await expect(page.locator(".ops-metrics .ops-metric")).toHaveCount(4);
    await expect(page.locator(".ops-stage")).toHaveCount(6);
    await expect(page.getByRole("link", { name: /Go to review queue/ })).toHaveAttribute("href", "/admin/applications?status=New");
    await expect(page.locator(".ops-submissions")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent submissions" })).toBeVisible();
    await expect(page.locator(".ops-activity")).toBeVisible();
    await expect(page.locator(".ops-placement-summary")).toBeVisible();
    await expect(page.getByRole("link", { name: "View all" }).last()).toHaveAttribute("href", "/admin/placements");
    const events = page.locator(".ops-activity-entry");
    if (await events.count()) {
      await expect(events.first().locator(".ops-activity-entry-title")).not.toContainText("status:");
    }
    await expect(page.locator(".workspace-sidebar")).toBeVisible();
    await expect(page.locator(".workspace-topbar")).toBeVisible();
  });

  test("admin overview remains contained and navigable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 850 });
    await page.goto("/admin");
    await expect(page.locator(".ops-activity")).toBeVisible();
    await expect(page.locator(".ops-placement-summary")).toBeVisible();
    const mobileRecords = page.locator(".ops-mobile-records");
    if (await mobileRecords.count()) {
      await expect(mobileRecords).toBeVisible();
      await expect(page.locator(".ops-table-scroll")).toBeHidden();
      await expect(mobileRecords.getByRole("link").first()).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test("student overview provides genuine journey milestones and next action", async ({ page }) => {
    const response = await page.request.post("/api/dev/session", {
      data: { userId: "00000000-0000-0000-0000-000000000091" },
    });
    expect(response.ok()).toBeTruthy();
    await page.setViewportSize({ width: 375, height: 850 });
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /The next chapter/ })).toBeVisible();
    await expect(page.locator(".journey-path > li")).toHaveCount(3);
    await expect(page.locator(".journey-metrics .journey-metric")).toHaveCount(3);
    const action = page.locator(".journey-primary-link");
    await expect(action).toBeVisible();
    expect(await action.getAttribute("href")).toMatch(new RegExp("^/(?:apply|dashboard|opportunities)"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
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
    await expect(page.getByRole("option", { name: "Published", exact: true })).toBeVisible();
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
