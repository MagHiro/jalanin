import { expect, test } from "@playwright/test";

test("destination directory preserves typography and responsive discovery", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 767, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/opportunities");
    const directory = page.locator(".destination-directory");
    await expect(directory.getByRole("heading", { level: 1 })).toHaveCSS("font-size", width <= 767 ? "35px" : "37.5px");
    await expect(directory.getByRole("heading", { level: 1 })).toHaveCSS("font-weight", "400");
    await expect(directory.getByRole("navigation", { name: "Filter by destination" })).toBeVisible();
    await expect(directory.locator(".destination-route")).toHaveAttribute("aria-hidden", "true");
    await expect(directory.getByRole("form", { name: "Search and filter internships" })).toHaveAttribute("method", "get");
    const all = directory.getByRole("link", { name: "All destinations" });
    await all.focus();
    await expect(all).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test("destination links preserve search and sorting, and search supports empty results", async ({ page }) => {
  await page.goto("/opportunities?q=Intern&sort=title");
  const country = page.locator('.destination-sidebar a[href*="country="]').first();
  await expect(country).toBeVisible();
  const href = await country.getAttribute("href");
  const params = new URL(href!, "http://localhost").searchParams;
  expect(params.get("q")).toBe("Intern");
  expect(params.get("sort")).toBe("title");
  await country.click();
  await expect(page.locator('.destination-sidebar a[aria-current="page"]')).toHaveAttribute("href", /country=/);
  await page.getByRole("textbox", { name: "Search role or location" }).fill("zz-no-placement-matches-zz");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No internships match your filters.")).toBeVisible();
  await page.getByRole("link", { name: "Clear all filters", exact: true }).click();
  await expect(page.locator('.destination-sidebar a[aria-current="page"]')).toHaveText("All destinations");
});

test("GSAP leaves the directory visible after its entrance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/opportunities");
  await expect(page.locator(".destination-intro")).toHaveCSS("opacity", "1");
  await expect(page.locator(".destination-photo")).toHaveCSS("opacity", "1");
});
