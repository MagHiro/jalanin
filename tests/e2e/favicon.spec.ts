import { expect, test } from "@playwright/test";

test("shared favicon is served successfully across public and auth pages", async ({ page, request }) => {
  const response = await request.get("/favicon.ico");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/image\/(?:x-icon|vnd\.microsoft\.icon)/);
  expect((await response.body()).subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));

  for (const route of ["/", "/opportunities", "/auth/sign-in", "/terms"]) {
    await page.goto(route);
    const icons = page.locator('head link[rel="icon"], head link[rel="shortcut icon"]');
    expect(await icons.count()).toBeGreaterThan(0);
    for (const icon of await icons.all()) {
      await expect(icon).toHaveAttribute("href", "/favicon.ico");
    }
  }
});
