import { expect, test } from "@playwright/test";

test("combined about and contact keeps responsive typography, anchors and an overlapping form", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 767, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#about");
    const section = page.locator(".personal-contact");
    await expect(section).toHaveAttribute("id", "about");
    await expect(section.locator("h2")).toHaveCSS("font-size", width <= 767 ? "35px" : "37.5px");
    await expect(section.locator("h2")).toHaveCSS("font-weight", "400");
    await expect(section.locator(".personal-contact-intro p")).toHaveCSS("font-size", "17.5px");
    await expect(section.getByRole("img")).toHaveAttribute("alt", "Singapore’s waterfront and skyline at dusk");
    const photo = await section.locator("figure").boundingBox();
    const panel = await section.locator("#contact").boundingBox();
    expect(panel!.y).toBeLessThan(photo!.y + photo!.height);
    expect(panel!.x).toBeGreaterThan(photo!.x);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    const form = section.getByRole("form", { name: "Contact Jalanin" });
    await expect(section.locator("#contact")).toHaveCSS("border-top-width", "0px");
    await expect(section.locator("#contact")).toHaveCSS("border-radius", "24px");
    await expect(section.locator("#contact")).not.toHaveCSS("box-shadow", "none");
    for (const field of await form.locator("input, textarea").all()) {
      if (await field.getAttribute("type") === "hidden") continue;
      await expect(field).toHaveCSS("border-top-width", "0px");
      await expect(field).toHaveCSS("border-radius", "12px");
    }
    for (const label of ["Name", "Email", "Message"]) {
      await expect(form.getByLabel(label, { exact: false })).toHaveAttribute("required", "");
    }
    await expect(form.getByLabel("Subject", { exact: false })).not.toHaveAttribute("required", "");
    await expect(form.getByRole("button", { name: "Send message" })).toHaveCSS("font-size", "15px");
    await expect(section.getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/privacy");
    await expect(section.getByRole("link", { name: "Explore internships first" })).toHaveAttribute("href", "/opportunities");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test("combined contact form retains sending, error and success feedback", async ({ page }) => {
  await page.goto("/#contact");
  const form = page.getByRole("form", { name: "Contact Jalanin" });
  await form.getByLabel("Name", { exact: false }).fill("Test Student");
  await form.getByLabel("Email", { exact: false }).fill("student@example.com");
  await form.getByLabel("Message", { exact: false }).fill("I would like to learn about internships.");
  await page.route("**/api/contact", (route) => route.fulfill({ status: 400, json: { error: "Please try again." } }));
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByRole("alert")).toHaveText("Please try again.");
  await page.route("**/api/contact", (route) => route.fulfill({ json: { ok: true } }));
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#contact").getByRole("status")).toContainText("Message received.");
  await expect(page.locator("#contact").getByRole("link", { name: "privacy policy" })).toBeVisible();
});
