import { expect, test } from "@playwright/test";

test("admin student and application details use the calm record design", async ({ page }) => {
  const session = await page.request.post("/api/dev/session", {
    data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
  });
  expect(session.ok()).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin/students/00000000-0000-0000-0000-000000000091");
  await expect(page.locator(".student-profile-calm")).toBeVisible();
  await expect(page.locator(".workspace-student-record-avatar")).toHaveCSS("border-radius", "50%");
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 960 });
    await expect(page.locator("main h1")).toHaveCSS("font-weight", "400");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  const application = page.locator('a[href^="/admin/applications/"]').first();
  if (await application.count()) {
    await application.click();
    await expect(page.locator(".application-review-calm")).toBeVisible();
    await expect(page.locator(".application-review-header")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.getByRole("heading", { name: "Workflow actions" })).toBeVisible();
    await expect(page.getByText("Private · Admin only", { exact: true })).toBeVisible();
    await expect(page.locator(".application-context-dates time")).toHaveCount(2);
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 960 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
  }
});

test("internship editor uses neutral form surfaces", async ({ page }) => {
  const session = await page.request.post("/api/dev/session", {
    data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
  });
  expect(session.ok()).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/admin/internships/new");
    await expect(page.locator(".internship-editor-calm")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Title *", exact: true })).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.locator(".form-section")).toHaveCount(4);
    await expect(page.getByRole("button", { name: "Create internship" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
