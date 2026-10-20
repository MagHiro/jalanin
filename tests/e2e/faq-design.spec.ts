import { expect, test } from "@playwright/test";

test("FAQ preserves the Craft layout and keyboard interaction at all widths", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 767, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const section = page.getByRole("region", { name: "Frequently asked questions" });
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("heading", { level: 2 })).toHaveCSS("font-size", width <= 767 ? "35px" : "37.5px");
    await expect(section.getByRole("heading", { level: 2 })).toHaveCSS("font-weight", "400");
    await expect(section.locator("details")).toHaveCount(14);
    await expect(section.locator('.faq-graphic[aria-hidden="true"]')).toBeVisible();
    const list = await section.locator(".faq-list").boundingBox();
    expect(list!.width).toBeLessThanOrEqual(1120);
    if (width === 1440) expect(list!.width).toBeGreaterThan(800);
    await expect(section.locator("details[open]")).toHaveCount(0);
    const first = section.locator("summary").first();
    await first.focus();
    await expect(first).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(section.locator("details").first()).toHaveAttribute("open", "");
    await expect(section.locator(".faq-answer").first()).toContainText("Singaporean university students who meet their institution's internship requirements");
    await page.keyboard.press("Space");
    await expect(section.locator("details[open]")).toHaveCount(0);
    await expect(section.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "#contact");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test("FAQ GSAP expansion survives rapid toggles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const section = page.locator("#faq");
  const first = section.locator("summary").first();
  await first.click();
  await first.click();
  await first.click();
  await expect(section.locator("details").first()).toHaveAttribute("open", "");
  await expect.poll(() => section.locator(".faq-answer").first().evaluate(node => (node as HTMLElement).style.height)).toBe("");
  await first.click();
  await expect(section.locator("details[open]")).toHaveCount(0);
});
