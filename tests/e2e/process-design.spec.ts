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
    await expect(section.locator('.process-graphic[aria-hidden="true"]')).toHaveCount(4);
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

test("horizontal process centers selected steps and stops at the endpoints", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const section = page.getByRole("region", { name: "One step at a time." });
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator(".learn-process-panel")).toHaveAttribute("data-carousel", "true");
    await expect(section.locator('.process-graphic[aria-hidden="true"]')).toHaveCount(1);
    const previous = section.getByRole("button", { name: "Previous step" });
    const next = section.getByRole("button", { name: "Next step" });
    await expect(previous).toBeDisabled();
    for (const title of ["Consider", "Apply", "Move forward"]) {
      await next.click();
      await expect(section.getByRole("button", { name: title, exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(section.locator("#process-description")).toContainText(title);
    }
    await expect(next).toBeDisabled();
    await expect.poll(async () => {
      const active = await section.locator('[data-active="true"]').boundingBox();
      const viewport = await section.locator(".process-viewport").boundingBox();
      return Math.abs(active!.x + active!.width / 2 - viewport!.x - viewport!.width / 2);
    }).toBeLessThan(2);
    await previous.click();
    await expect(section.getByRole("button", { name: "Apply", exact: true })).toHaveAttribute("aria-pressed", "true");
    await previous.focus();
    await page.keyboard.press("Enter");
    await expect(section.getByRole("button", { name: "Consider", exact: true })).toHaveAttribute("aria-pressed", "true");
    await section.getByRole("button", { name: "Discover", exact: true }).click();
    await expect(previous).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(section.locator(".learn-process-panel")).toHaveAttribute("data-carousel", "false");
    await expect(section.locator(".process-static-description")).toHaveCount(4);
    await expect(section.locator(".process-static-description").last()).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});
