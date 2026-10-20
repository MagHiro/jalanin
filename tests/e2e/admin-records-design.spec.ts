import { expect, test } from "@playwright/test";

const pages = [
  ["applications", "Applications"],
  ["internships", "Internships"],
  ["students", "Students"],
  ["placements", "Placements"],
  ["contacts", "Contact inbox"],
  ["notifications", "Notifications"],
] as const;

for (const [route, title] of pages) {
  test(`${title} follows the student applications design`, async ({ page }) => {
    const session = await page.request.post("/api/dev/session", {
      data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
    });
    expect(session.ok()).toBeTruthy();
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(`/admin/${route}`);
      const records = page.locator(".admin-records-page");
      await expect(records).toBeVisible();
      const heading = records.getByRole("heading", { level: 1, name: title, exact: true });
      await expect(heading).toHaveCSS("font-weight", "400");
      await expect(heading).toHaveCSS("font-size", width === 1440 ? "37.5px" : "35px");
      await expect(records.locator(".page-heading")).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(records.locator(".crm-records")).toHaveCSS("border-radius", "12px");
      const view = records.locator('.crm-view[aria-current="page"]');
      if (route !== "students") {
        await expect(view).toHaveCount(1);
        await expect(view).toHaveCSS("background-color", "rgb(238, 241, 248)");
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    const alternate = page.locator('.admin-records-page .crm-view:not([aria-current="page"])').first();
    if (await alternate.count()) {
      const href = await alternate.getAttribute("href");
      await alternate.click();
      await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
      await expect(page.locator('.crm-view[aria-current="page"]')).toHaveCount(1);
    }
  });
}
