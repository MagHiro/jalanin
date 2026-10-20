import { expect, test } from "@playwright/test";

test("auth pages share the photo split and approved typography", async ({ page }) => {
  for (const [route, heading] of [
    ["login", "Log in"],
    ["sign-up", "Create your account"],
    ["forgot-password", "Forgot your password?"],
    ["reset-password", "Set a new password"],
  ]) {
    await page.goto(`/auth/${route}`);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.locator(".auth-calm-story")).toBeVisible();
    await expect(page.locator("h1")).toHaveCSS("font-size", "37.5px");
    await expect(page.locator("h1")).toHaveCSS("font-weight", "400");
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Privacy", exact: true })).toBeVisible();
  }
});

test("mobile prioritizes the form without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["login", "sign-up", "forgot-password", "reset-password"]) {
    await page.goto(`/auth/${route}`);
    await expect(page.locator(".auth-calm-story")).toBeHidden();
    await expect(page.locator("h1")).toHaveCSS("font-size", "35px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("login retains password visibility, errors, and safe return links", async ({ page }) => {
  await page.goto("/auth/login?next=%2Fdashboard%2Fapplications");
  await expect(page.getByRole("link", { name: "Sign up", exact: true })).toHaveAttribute("href", "/auth/sign-up?next=%2Fdashboard%2Fapplications");
  await page.getByLabel("Email", { exact: true }).fill("student@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.route("**/api/auth/login", route => route.fulfill({ status: 401, json: { error: "Invalid email or password." } }));
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator(".auth-calm-form").getByRole("alert")).toHaveText("Invalid email or password.");
});

test("signup shows verification instructions", async ({ page }) => {
  await page.route("**/api/auth/signup", route => route.fulfill({ json: { ok: true, emailVerified: false } }));
  await page.goto("/auth/sign-up");
  await page.getByLabel("Email", { exact: true }).fill("student@example.com");
  await page.getByLabel("Password (min. 8 characters)", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await expect(page.getByRole("status")).toContainText("student@example.com");
});

test("recovery confirmation does not disclose account existence", async ({ page }) => {
  await page.route("**/api/auth/forgot-password", route => route.fulfill({ json: { ok: true } }));
  await page.goto("/auth/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill("student@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account exists");
  await expect(page.getByRole("link", { name: "Back to log in" })).toBeVisible();
});
