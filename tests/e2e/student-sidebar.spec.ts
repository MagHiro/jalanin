import { expect, test } from "@playwright/test";

test("admin uses the shared sidebar, header and search design", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 960 });
  const session = await page.request.post("/api/dev/session", {
    data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
  });
  expect(session.ok()).toBeTruthy();
  await page.goto("/admin");
  const sidebar = page.locator(".workspace-admin .workspace-sidebar");
  await expect(sidebar).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(sidebar.locator(".workspace-brand-mark")).toHaveCount(0);
  await expect(sidebar.locator('[aria-current="page"]')).toHaveCSS("background-color", "rgb(233, 240, 255)");
  await expect(sidebar.getByRole("link", { name: "Students", exact: true })).toBeVisible();
  await expect(page.locator(".workspace-topbar")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".workspace-breadcrumb-root")).toHaveText("Admin workspace");
  await sidebar.getByRole("button", { name: "Collapse navigation" }).click();
  await expect(sidebar).toHaveCSS("width", "72px");
  await sidebar.getByRole("button", { name: "Expand navigation" }).click();
  await expect(sidebar).toHaveCSS("width", "256px");
  await page.getByRole("button", { name: "Search workspace pages" }).click();
  const dialog = page.getByRole("dialog", { name: "Quick navigation" });
  await dialog.getByRole("textbox").fill("Students");
  await page.keyboard.press("ArrowDown");
  await expect(dialog.getByRole("link", { name: "Students", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/admin\/students/);
  await expect(dialog).not.toBeVisible();
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`student sidebar navigation and collapse (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 1440, height: 960 });
    const session = await page.request.post("/api/dev/session", {
      data: { userId: "00000000-0000-0000-0000-000000000091" },
    });
    expect(session.ok()).toBeTruthy();
    await page.goto("/dashboard");
    const sidebar = page.locator(".workspace-student .workspace-sidebar");
    await expect(sidebar).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(sidebar).toHaveCSS("width", "256px");
    await expect(sidebar.locator(".workspace-nav-label").first()).toHaveText("Your workspace");
    const active = sidebar.locator('[aria-current="page"]');
    await expect(active).toHaveCSS("background-color", "rgb(233, 240, 255)");
    await expect(active).toHaveCSS("font-size", "15px");
    await expect(active).toHaveCSS("font-weight", "400");
    await expect(page.locator(".workspace-topbar")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await page.getByRole("button", { name: "Search workspace pages" }).click();
    const search = page.getByRole("dialog", { name: "Quick navigation" });
    const input = search.getByRole("textbox", { name: "Search destinations" });
    await expect(input).toBeFocused();
    await input.fill("not-a-page");
    await expect(search.getByText("No matching pages. Try another search.")).toBeVisible();
    await input.fill("Applications");
    await page.keyboard.press("ArrowDown");
    await expect(search.getByRole("link", { name: "Applications" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(search).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Search workspace pages" })).toBeFocused();
    await sidebar.getByRole("link", { name: "Applications", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/applications/);
    await expect(active).toContainText("Applications");
    await expect(active.locator(".workspace-nav-indicator")).toBeVisible();
    await sidebar.getByRole("button", { name: "Collapse navigation" }).click();
    await expect(sidebar).toHaveCSS("width", "72px");
    await expect(sidebar.getByRole("button", { name: "Expand navigation" })).toHaveAttribute("aria-expanded", "false");
    await sidebar.getByRole("button", { name: "Expand navigation" }).click();
    await expect(sidebar).toHaveCSS("width", "256px");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: "Open workspace navigation" }).click();
    const drawer = page.getByRole("dialog", { name: "Workspace navigation" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Placements", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/placements/);
    await expect(drawer).not.toBeVisible();
    await page.getByRole("button", { name: "Open workspace navigation" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open workspace navigation" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
