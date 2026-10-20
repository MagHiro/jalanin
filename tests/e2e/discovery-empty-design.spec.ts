import { expect, test } from "@playwright/test";

for (const [route, title, action] of [
  ["internships", "No matching internships", "Clear filters"],
  ["applications", "No applications in this view", "Clear filters"],
  ["students", "No matching students", "Clear search"],
] as const) {
  test(`admin ${route} has a focused no-match state`, async ({ page }) => {
    const session = await page.request.post("/api/dev/session", {
      data: { userId: process.env.QA_ADMIN_ID ?? "00000000-0000-0000-0000-00000000ad01" },
    });
    expect(session.ok()).toBeTruthy();
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(`/admin/${route}?q=zz-no-matching-record-zz`);
      const empty = page.locator(".discovery-empty");
      await expect(empty.getByRole("heading", { name: title })).toBeVisible();
      await expect(empty.getByRole("link", { name: action })).toHaveAttribute("href", `/admin/${route}`);
      await expect(empty.locator("h2")).toHaveCSS("font-weight", "400");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
  });
}

test("opportunities no-match state is compact and can reset filters", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/opportunities?q=zz-no-matching-internship-zz");
    const empty = page.locator(".discovery-empty");
    await expect(empty.getByRole("heading", { name: "No matching internships" })).toBeVisible();
    await expect(empty.locator("svg").first()).toHaveAttribute("aria-hidden", "true");
    await expect(empty.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/opportunities");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  await page.getByRole("link", { name: "Clear filters", exact: true }).click();
  await expect(page).toHaveURL(/\/opportunities$/);
});

test("student draft empty state offers internship discovery", async ({ page }) => {
  const session = await page.request.post("/api/dev/session", {
    data: { userId: "00000000-0000-0000-0000-000000000091" },
  });
  expect(session.ok()).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dashboard/applications?view=drafts");
  const empty = page.locator(".discovery-empty");
  // Seeded drafts may exist; never mutate application records for a visual test.
  if (await empty.count()) {
    await expect(empty.getByRole("heading", { name: "No saved drafts" })).toBeVisible();
    await expect(empty.getByRole("link", { name: "Browse internships" })).toHaveAttribute("href", "/opportunities");
    await expect(empty.locator("h2")).toHaveCSS("font-weight", "400");
  } else {
    await expect(page.locator(".crm-record-name").first()).toBeVisible();
  }
});
