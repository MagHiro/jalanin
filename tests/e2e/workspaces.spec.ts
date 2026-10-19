import { test, expect } from "@playwright/test";

const widths = [320, 375, 430, 768, 1024, 1280, 1440];

for (const role of ["admin", "student"] as const) {
  test(`${role} standalone workspace, responsive controls and navigation`, async ({ page }) => {
    test.setTimeout(60000);
    const userId = role === "admin"
      ? process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01"
      : "00000000-0000-0000-0000-000000000091";
    const session = await page.request.post("/api/dev/session", { data: { userId } });
    expect(session.ok()).toBeTruthy();
    const route = role === "admin" ? "/admin" : "/dashboard";
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of widths) {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(route);
      await expect(page.locator("main#main h1")).toBeVisible();
      if (width === 1440) await expect(page.locator("main#main h1")).toHaveCSS("font-weight", "500");
      await expect(page.locator(".public-header")).toHaveCount(0);
      await expect(page.locator("main#main")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      if (width === 1440) {
        const stat = page.locator(".workspace-stat").first();
        await expect(stat).toHaveCSS("border-left-width", "1px");
        await expect(stat).toHaveCSS("border-top-left-radius", "16px");
        await expect(stat).not.toHaveCSS("box-shadow", "none");
        await expect(page.locator(".workspace-sidebar .workspace-nav-label").first()).toBeVisible();
        await expect(page.locator(".workspace-quick-card")).toHaveCount(0);
      }
      if (width < 1024) {
        await page.getByRole("button", { name: "Open workspace navigation" }).click();
        await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog", { name: "Workspace navigation" })).not.toBeVisible();
        await expect(page.getByRole("button", { name: "Open workspace navigation" })).toBeFocused();
      }
      await page.screenshot({ path: `/tmp/opencode/workspace-${role}-${width}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${route}/applications`);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".workspace-sidebar a[aria-current=page]")).toContainText("Applications");
    await expect(page.locator(".crm-records")).toBeVisible();
    await expect(page.locator(".crm-view[aria-current=page]")).toHaveCount(1);
    if (role === "admin") {
      await expect(page.getByRole("form", { name: "Filter applications" })).toBeVisible();
      await page.getByRole("navigation", { name: "Application queues" }).getByRole("link", { name: "New", exact: true }).click();
      await expect(page).toHaveURL(/status=New/);
      await expect(page.locator(".crm-records")).toBeVisible();
      await page.goto("/admin/applications");
    } else {
      await page.getByRole("navigation", { name: "Application views" }).getByRole("link", { name: /Drafts/ }).click();
      await expect(page).toHaveURL(/view=drafts/);
      await expect(page.locator(".crm-records")).toBeVisible();
      await page.goto("/dashboard/applications");
    }
    if (role === "admin") {
      await page.goto("/admin/internships/new");
      await expect(page.getByRole("textbox", { name: "Title *", exact: true })).toBeVisible();
      await page.getByRole("textbox", { name: "Title *", exact: true }).fill("Workspace input QA");
      await expect(page.getByRole("textbox", { name: "Title *", exact: true })).toHaveValue("Workspace input QA");
      await page.getByRole("combobox", { name: "Publication status", exact: true }).click();
      await page.getByRole("option", { name: "Unpublished" }).click();
      await expect(page.locator('input[name="publicationStatus"]')).toHaveValue("Unpublished");
      await page.getByRole("textbox", { name: "Description *", exact: true }).fill("Form component verification");
      await page.getByLabel("Featured on landing").check();
      await expect(page.getByLabel("Featured on landing")).toBeChecked();
      await page.getByRole("button", { name: "Choose start date" }).click();
      const dateDialog = page.getByRole("dialog", { name: "Choose start date" });
      await expect(dateDialog).toBeVisible();
      await dateDialog.getByRole("button", { name: "Today" }).click();
      await expect(page.locator('input[name="startDate"]')).toHaveValue(/\\d{4}-\\d{2}-\\d{2}/);
      await page.getByRole("button", { name: "Choose application deadline" }).click();
      const dateTimeDialog = page.getByRole("dialog", { name: "Choose application deadline" });
      await expect(dateTimeDialog).toBeVisible();
      await dateTimeDialog.getByRole("button", { name: "Today" }).click();
      await dateTimeDialog.getByLabel("Time for application deadline").fill("10:30");
      await dateTimeDialog.getByRole("button", { name: "Apply" }).click();
      await expect(page.locator('input[name="applicationDeadline"]')).toHaveValue(/T10:30$/);
      await page.screenshot({ path: "/tmp/opencode/workspace-admin-form.png", fullPage: true });
      await page.setViewportSize({ width: 320, height: 960 });
      await page.goto("/admin/students");
      await expect(page.getByRole("searchbox", { name: "Search display name" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
    const nestedRoutes = role === "admin"
      ? ["/admin/internships", "/admin/internships/new", "/admin/students", "/admin/placements", "/admin/placements/new", "/admin/contacts", "/admin/notifications"]
      : ["/dashboard/applications", "/dashboard/placements"];
    for (const nestedRoute of nestedRoutes) {
      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: 960 });
        await page.goto(nestedRoute);
        await expect(page.locator("main h1")).toBeVisible();
        await expect(page.locator(".public-header")).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), nestedRoute).toBeLessThanOrEqual(1);
      }
    }
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog", { name: "Quick navigation" })).toBeVisible();
    await page.getByRole("textbox", { name: "Search destinations" }).fill("Applications");
    await expect(page.getByRole("dialog", { name: "Quick navigation" }).getByText("Applications")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Quick navigation" })).not.toBeVisible();
    expect(errors).toEqual([]);
  });
}
