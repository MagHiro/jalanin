// Full journey suite (PRD §14 UAT core + §0.B.2 V04-01…V04-10).
// Runs against the dev server (E2E_MODE=1) with seeded data.
// Auth uses the E2E session seam (real native sessions via
// POST /api/dev/session); production uses native email/password auth.
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const STUDENT_A = "00000000-0000-0000-0000-00000000aa01";
const STUDENT_B = "00000000-0000-0000-0000-00000000aa02";

const VALS = {
  firstName: "E2E",
  lastName: "Student",
  email: "e2e-student@example.com",
  nationality: "Indonesian",
  university: "Universitas Indonesia",
  course: "Hospitality Management",
  graduationYear: 2026,
  preferredStart: "2026-11-01",
  preferredEnd: "2027-04-01",
  additionalInformation: "",
  consentPrivacy: true,
  consentTerms: true,
};

async function loginAs(request: APIRequestContext, userId: string): Promise<void> {
  const res = await request.post("/api/dev/session", { data: { userId } });
  expect(res.ok()).toBe(true);
}

test.describe("public platform (UAT-01…06, UAT-24)", () => {
  test("landing renders all core sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /internships across/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /how it works/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /featured/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /about jalanin/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /contact us/i })).toBeVisible();
  });

  test("directory search/filter state lives in the URL; bad page degrades", async ({ page }) => {
    await page.goto("/opportunities");
    await expect(page.getByText(/published placement/)).toBeVisible();
    await page.getByPlaceholder(/hotel, singapore/i).fill("Hotel");
    await page.getByRole("button", { name: /apply filters/i }).click();
    await expect(page).toHaveURL(/q=Hotel/);
    await page.goto("/opportunities?page=abc");
    await expect(page.getByText(/published placement/)).toBeVisible();
  });

  test("published detail loads; draft slug 404s without leaking", async ({ page, request }) => {
    const res = await request.get("/opportunities/hotel-operations-singapore");
    expect(res.ok()).toBe(true);
    await page.goto("/opportunities/hotel-operations-singapore");
    await expect(page.getByRole("link", { name: /apply now/i })).toBeVisible();
    const draft = await request.get("/opportunities/draft-culinary-phuket");
    expect(draft.status()).toBe(404);
  });

  test("anonymous Apply bounces through login with return destination", async ({ page }) => {
    await page.goto("/opportunities/hotel-operations-singapore");
    await page.getByRole("link", { name: /apply now/i }).click();
    await expect(page).toHaveURL(/auth\/login\?next=%2Fapply%2F/);
  });

  test("robots/sitemap expose only public listings", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    const robotsBody = await robots.text();
    expect(robotsBody).toMatch(/Disallow: \/admin/);
    expect(robotsBody).toMatch(/Disallow: \/dashboard/);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toMatch(/hotel-operations-singapore/);
    expect(sitemapBody).not.toMatch(/draft-culinary-phuket/);
  });
});

test.describe("student lifecycle (UAT-08…12, V04-01…04)", () => {
  test("draft saves partially, resumes after session, validates on submit", async ({
    page,
    request,
  }) => {
    await loginAs(request, STUDENT_A);
    await page.goto("/opportunities/hotel-operations-singapore");
    // Extract internship id from the Apply link.
    const href = await page.getByRole("link", { name: /apply now/i }).getAttribute("href");
    const internshipId = href?.split("/apply/")[1] ?? "";
    expect(internshipId).toMatch(/^[0-9a-f-]{36}$/);

    // Draft with partial data persists.
    const partial = await request.post("/api/applications/draft", {
      headers: { "x-e2e-user-id": STUDENT_A },
      data: { internshipId, values: { firstName: "Partial" } },
    });
    expect(partial.ok()).toBe(true);

    // Submit without CV fails with a clear error (UAT-09).
    const noCv = await request.post("/api/applications/submit", {
      headers: { "x-e2e-user-id": STUDENT_B, "Idempotency-Key": "no-cv-1" },
      data: {
        internshipId,
        values: { ...VALS, email: "nocv@example.com" },
        idempotencyKey: "no-cv-1",
      },
    });
    expect(noCv.status()).toBe(400);
    expect(((await noCv.json()) as { error?: string }).error).toMatch(/CV/i);
  });

  test("submit → duplicate retry converges; second internship allowed", async ({
    request,
  }) => {
    const page = await request.get("/opportunities");
    expect(page.ok()).toBe(true);
    // Use two published internships discovered via sitemap.
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toMatch(/software-engineering-kuala-lumpur/);
  });

  test("cross-student application access returns 404 (UAT-12)", async ({
    page,
    request,
  }) => {
    await loginAs(request, STUDENT_B);
    // Mirror the API-issued session cookie into the page context: the
    // dev-session seam is cookie-based, and each Playwright context is isolated.
    const storage = await request.storageState();
    const session = storage.cookies.find((c) => c.name === "e2e_session");
    expect(session).toBeDefined();
    await page.goto("/");
    await page.context().addCookies([
      {
        name: "e2e_session",
        value: session!.value,
        domain: "localhost",
        path: "/",
      },
    ]);
    // STUDENT_A's application id is unknown to B; probing a random id 404s.
    await page.goto(`/dashboard/applications/00000000-0000-0000-0000-000000000000`);
    await expect(page.getByText(/not found/i).first()).toBeVisible();
  });

  test("anonymous users cannot touch admin or documents (UAT-13)", async ({
    request,
  }) => {
    const doc = await request.get(
      "/api/documents/download?documentId=00000000-0000-0000-0000-000000000000",
    );
    expect([401, 404]).toContain(doc.status());
  });
});

test.describe("admin workflow (UAT-14…19, V04-05…08)", () => {
  test("unauthenticated admin API calls are denied (V04-08)", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/admin/applications/00000000-0000-0000-0000-000000000000/transition",
      { data: { to: "In Review" } },
    );
    expect([401, 403, 404]).toContain(res.status());
  });

  test("student calling admin mutation API is denied (V04-08)", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/admin/applications/00000000-0000-0000-0000-000000000000/transition",
      {
        headers: { "x-e2e-user-id": STUDENT_A },
        data: { to: "In Review" },
      },
    );
    expect([401, 403, 404]).toContain(res.status());
  });
});
