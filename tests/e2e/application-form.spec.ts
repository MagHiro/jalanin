import { expect, test } from "@playwright/test";

test("student saves and resumes a draft, uploads a CV, submits, and revises through the UI", async ({ page }) => {
  await page.request.post("/api/dev/session", {
    data: { userId: "00000000-0000-0000-0000-00000000af01" },
  });
  await page.goto("/opportunities/hotel-operations-singapore");
  await page.getByRole("link", { name: /apply now/i }).click();
  await expect(page).toHaveURL(/\/apply\/[0-9a-f-]+/);
  const applyUrl = page.url();
  await page.getByLabel("First name *", { exact: true }).fill("Presentation");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/applications\?draft=1/);

  // A new session still sees the persisted draft.
  await page.context().clearCookies();
  await page.request.post("/api/dev/session", {
    data: { userId: "00000000-0000-0000-0000-00000000af01" },
  });
  await page.goto(applyUrl);
  await expect(page.getByLabel("First name *", { exact: true })).toHaveValue("Presentation");
  for (const [name, value] of Object.entries({
    lastName: "Student",
    email: "presentation@example.com",
    nationality: "Indonesian",
    university: "Universitas Indonesia",
    course: "Hospitality Management",
    graduationYear: "2026",
    preferredStart: "2027-01-15",
    preferredEnd: "2027-07-15",
  })) {
    await page.locator(`[name="${name}"]`).fill(value);
  }
  await page.locator('[name="consentPrivacy"]').check();
  await page.locator('[name="consentTerms"]').check();
  await page.getByRole("button", { name: "Submit application", exact: true }).click();
  await expect(page.getByRole("form", { name: "Internship application" }).getByRole("alert")).toContainText(/CV/i);
  await page.locator('[name="cv"]').setInputFiles({
    name: "presentation-cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nPresentation CV\n%%EOF"),
  });
  await page.getByRole("button", { name: "Submit application", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/applications\/[0-9a-f-]+\?submitted=1/);
  await expect(page.getByRole("status")).toContainText("Application submitted.");
  await expect(page.getByText("Presentation Student", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Edit application", exact: true }).click();
  await page.getByLabel("Last name *", { exact: true }).fill("Updated");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/applications\/[0-9a-f-]+\?submitted=1/);
  await expect(page.getByText("Presentation Updated", { exact: true })).toBeVisible();
  await expect(page.getByText("Updated — awaiting admin re-review", { exact: true })).toBeVisible();
});
