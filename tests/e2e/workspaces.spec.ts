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
      await expect(page.locator(".public-header")).toHaveCount(0);
      await expect(page.locator("main#main")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
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
    if (role === "admin") {
      await page.goto("/admin/internships/new");
      await expect(page.getByRole("textbox", { name: "Title *", exact: true })).toBeVisible();
      await page.getByRole("textbox", { name: "Title *", exact: true }).fill("Workspace input QA");
      await expect(page.getByRole("textbox", { name: "Title *", exact: true })).toHaveValue("Workspace input QA");
      await page.getByRole("combobox", { name: "Publication status *", exact: true }).selectOption("Unpublished");
      await expect(page.getByRole("combobox", { name: "Publication status *", exact: true })).toHaveValue("Unpublished");
      await page.getByRole("textbox", { name: "Description *", exact: true }).fill("Form component verification");
      await page.getByLabel("Featured on landing").check();
      await expect(page.getByLabel("Featured on landing")).toBeChecked();
      await page.screenshot({ path: "/tmp/opencode/workspace-admin-form.png", fullPage: true });
      await page.setViewportSize({ width: 320, height: 960 });
      await page.goto("/admin/students");
      await expect(page.getByRole("textbox", { name: "Search display name" })).toBeVisible();
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
    expect(errors).toEqual([]);
  });
}
