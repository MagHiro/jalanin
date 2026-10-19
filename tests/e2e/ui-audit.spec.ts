import { expect, test } from "@playwright/test";
import { Client } from "pg";

test("contact keeps delayed success visible after the submit event has returned", async ({ page }) => {
  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => { releaseResponse = resolve; });
  await page.route("**/api/contact", async (route) => {
    await responseReady;
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto("/");
  const form = page.getByRole("form", { name: "Contact Jalanin" });
  await form.getByLabel("Name *", { exact: true }).fill("Contact regression");
  await form.getByLabel("Email *", { exact: true }).fill("contact@example.com");
  await form.getByLabel("Message *", { exact: true }).fill("A delayed response should still succeed.");
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByRole("button", { name: "Sending…" })).toBeDisabled();
  releaseResponse();
  await expect(page.getByRole("status").filter({ hasText: "Message received." })).toBeVisible();
  // The saved browser trace identifies the unrelated alert as Next's
  // #__next-route-announcer__ inside its shadow root, not a contact error.
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
});

test("confirmation contains keyboard focus and cannot dismiss while busy", async ({ page }) => {
  // This spec must also run alone: global setup clears student profiles.
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgresql://jalanin:jalanin@localhost:54322/jalanin" });
  await client.connect();
  try {
    await client.query(
      "INSERT INTO profiles (user_id, display_name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING",
      ["00000000-0000-0000-0000-00000000ac01", "Dialog regression student"],
    );
  } finally {
    await client.end();
  }
  const session = await page.request.post("/api/dev/session", {
    data: { userId: "00000000-0000-0000-0000-00000000ad01" },
  });
  expect(session.ok()).toBeTruthy();
  const created = await page.request.post("/api/admin/placements", {
    data: {
      studentUserId: "00000000-0000-0000-0000-00000000ac01",
      organization: "Dialog regression",
      role: "Intern",
      countryCode: "SG",
    },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const { id } = await created.json() as { id: string };
  await page.goto(`/admin/placements/${id}/edit`);
  const trigger = page.getByRole("button", { name: "Move to Confirmed", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Move placement to Confirmed?" });
  const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
  const confirm = dialog.getByRole("button", { name: "Move to Confirmed", exact: true });
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();

  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => { releaseResponse = resolve; });
  await page.route(`**/api/admin/placements/${id}/transition`, async (route) => {
    await responseReady;
    await route.fulfill({ status: 400, json: { ok: false, error: "Regression test failure" } });
  });
  await trigger.click();
  await confirm.click();
  await expect(dialog).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Tab");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(dialog).toBeVisible();
  releaseResponse();
  await expect(cancel).toBeEnabled();
  await cancel.click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("main").getByRole("alert")).toContainText("Regression test failure");
});
