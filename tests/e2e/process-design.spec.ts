import { expect, test } from "@playwright/test";

test("framed process preserves its sequence, typography and responsive timeline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 767, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const section = page.getByRole("region", { name: "One step at a time." });
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("heading", { level: 2 })).toHaveCSS("font-size", width <= 767 ? "35px" : "37.5px");
    await expect(section.getByRole("heading", { level: 2 })).toHaveCSS("font-weight", "400");
    await expect(section.locator(".learn-process-intro")).toHaveCSS("font-size", "17.5px");
    await expect(section.getByRole("listitem")).toHaveCount(4);
    await expect(section.getByRole("heading", { level: 3 })).toHaveText(["Discover", "Consider", "Apply", "Move forward"]);
    await expect(section.locator(".learn-process-panel")).toHaveCSS("border-radius", "0px");
    const boxes = await Promise.all((await section.getByRole("listitem").all()).map((step) => step.boundingBox()));
    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i]!.x).toBeGreaterThanOrEqual(0);
      expect(boxes[i]!.x + boxes[i]!.width).toBeLessThanOrEqual(width);
      if (i > 0) {
        if (width <= 767) expect(boxes[i]!.y).toBeGreaterThan(boxes[i - 1]!.y);
        else expect(boxes[i]!.y).toBe(boxes[0]!.y);
      }
    }
    const action = section.getByRole("link", { name: "Find your opportunity" });
    await expect(action).toHaveAttribute("href", "/opportunities");
    await expect(action).toHaveCSS("font-size", "15px");
    await action.focus();
    await expect(action).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
