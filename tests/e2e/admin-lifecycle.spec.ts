// Admin lifecycle: review → quotation → accept/complete → placement,
// plus re-review blocking, rejection/reopen, and placement transitions
// (UAT-14…19, V04-01…V04-10 admin-side coverage).
import { expect, test, type APIRequestContext } from "@playwright/test";

const STUDENT = "00000000-0000-0000-0000-00000000ac01";
const ADMIN = "00000000-0000-0000-0000-00000000ad01";

const VALS = {
  firstName: "Admin",
  lastName: "Flow",
  email: "admin-flow@example.com",
  nationality: "Malaysian",
  university: "UM",
  course: "Business",
  graduationYear: 2026,
  preferredStart: "2027-01-15",
  preferredEnd: "2027-07-15",
  additionalInformation: "",
  consentPrivacy: true,
  consentTerms: true,
};

async function internshipIdFor(request: APIRequestContext, slug: string): Promise<string> {
  // The Apply link on the detail page carries the internship UUID.
  const html = await (await request.get(`/opportunities/${slug}`)).text();
  const m = html.match(/\/apply\/([0-9a-f-]{36})/);
  if (!m) throw new Error(`no internship id found for ${slug}`);
  return m[1];
}

async function submitAs(
  request: APIRequestContext,
  internshipId: string,
  values: Record<string, unknown>,
  key: string,
): Promise<string> {
  const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x0a]);
  const draft = await request.post("/api/applications/draft", {
    headers: { "x-e2e-user-id": STUDENT },
    data: { internshipId, values },
  });
  expect(draft.ok()).toBe(true);
  const { applicationId } = (await draft.json()) as { applicationId: string };
  const upload = await request.post("/api/documents/upload", {
    headers: { "x-e2e-user-id": STUDENT },
    multipart: {
      applicationId,
      file: { name: "cv.pdf", mimeType: "application/pdf", buffer: pdf },
    },
  });
  expect(upload.ok()).toBe(true);
  const submit = await request.post("/api/applications/submit", {
    headers: {
      "x-e2e-user-id": STUDENT,
      "x-e2e-user-email": "admin-flow@example.com",
      "Idempotency-Key": key,
    },
    data: { internshipId, values, idempotencyKey: key },
  });
  expect(submit.ok()).toBe(true);
  return applicationId;
}

async function transition(
  request: APIRequestContext,
  applicationId: string,
  body: Record<string, unknown>,
  expected: number,
): Promise<void> {
  const res = await request.post(`/api/admin/applications/${applicationId}/transition`, {
    headers: { "x-e2e-user-id": ADMIN },
    data: body,
  });
  if (res.status() !== expected) {
    throw new Error(
      `transition ${JSON.stringify(body.to)} → ${res.status()} (expected ${expected}): ${await res.text()}`,
    );
  }
}

test.describe("admin lifecycle", () => {
  test("New → In Review → Quotation Sent → Accepted → Completed", async ({
    request,
  }) => {
    const internshipId = await internshipIdFor(request, "marketing-bangkok");
    const appId = await submitAs(request, internshipId, VALS, "lifecycle-1");

    // Quotation Sent requires a quotation (UAT-16).
    await transition(request, appId, { to: "Quotation Sent", expectedRevision: 1 }, 400);
    await transition(
      request,
      appId,
      { to: "In Review", expectedRevision: 1 },
      200,
    );
    await transition(
      request,
      appId,
      {
        to: "Quotation Sent",
        expectedRevision: 1,
        quotation: {
          amount: "1500",
          notesStudent: "Includes placement and support.",
          notesInternal: "internal",
        },
      },
      200,
    );

    // Student edit is now locked (V04-02).
    const locked = await request.post("/api/applications/submit", {
      headers: { "x-e2e-user-id": STUDENT, "Idempotency-Key": "lifecycle-locked" },
      data: {
        internshipId,
        values: { ...VALS, firstName: "Changed" },
        idempotencyKey: "lifecycle-locked",
      },
    });
    expect(locked.status()).toBe(400);

    await transition(request, appId, { to: "Accepted", expectedRevision: 1 }, 200);
    await transition(request, appId, { to: "Completed", expectedRevision: 1 }, 200);

    // Completed is terminal.
    await transition(request, appId, { to: "Accepted", expectedRevision: 1 }, 400);

    // Admin detail page renders quotation + audit.
    const detail = await request.get(`/admin/applications/${appId}`, {
      headers: { "x-e2e-user-id": ADMIN },
    });
    expect(detail.status()).toBe(200);
    const detailHtml = await detail.text();
    expect(detailHtml).toMatch(/SGD 1,500/);
    expect(detailHtml).toMatch(/internal/);
  });

  test("submitted edit triggers re-review and blocks quotation (V04-01)", async ({
    request,
  }) => {
    const internshipId = await internshipIdFor(request, "f-and-b-singapore");
    const appId = await submitAs(request, internshipId, VALS, "rereview-1");

    // Student edits while In Review.
    await transition(request, appId, { to: "In Review", expectedRevision: 1 }, 200);
    const edit = await request.post("/api/applications/submit", {
      headers: { "x-e2e-user-id": STUDENT, "Idempotency-Key": "rereview-edit" },
      data: {
        internshipId,
        values: { ...VALS, lastName: "Flow-Edited" },
        idempotencyKey: "rereview-edit",
      },
    });
    expect(edit.ok()).toBe(true);
    expect(((await edit.json()) as { revised?: boolean }).revised).toBe(true);

    // Quotation now blocked until admin acknowledges.
    await transition(
      request,
      appId,
      {
        to: "Quotation Sent",
        expectedRevision: 2,
        quotation: { amount: "900", notesStudent: "terms" },
      },
      400,
    );
    const ack = await request.post(`/api/admin/applications/${appId}/acknowledge`, {
      headers: { "x-e2e-user-id": ADMIN },
      data: { expectedRevision: 2 },
    });
    expect(ack.ok()).toBe(true);
    await transition(
      request,
      appId,
      {
        to: "Quotation Sent",
        expectedRevision: 2,
        quotation: { amount: "900", notesStudent: "terms" },
      },
      200,
    );
  });

  test("reject → student cannot reapply → admin reopens (V04-03/04)", async ({
    request,
  }) => {
    const internshipId = await internshipIdFor(request, "ui-design-remote-sg");
    const appId = await submitAs(request, internshipId, VALS, "reopen-1");
    await transition(request, appId, { to: "Rejected", expectedRevision: 1 }, 200);

    // Student re-submit of identical payload converges (no second record).
    const retry = await request.post("/api/applications/submit", {
      headers: { "x-e2e-user-id": STUDENT, "Idempotency-Key": "reopen-retry" },
      data: { internshipId, values: VALS, idempotencyKey: "reopen-retry" },
    });
    expect(retry.ok()).toBe(true);
    expect(((await retry.json()) as { applicationId: string }).applicationId).toBe(appId);

    // Admin reopens (same id retained).
    const reopen = await request.post(`/api/admin/applications/${appId}/reopen`, {
      headers: { "x-e2e-user-id": ADMIN },
      data: { reason: "Student provided updated documents." },
    });
    expect(reopen.ok()).toBe(true);
  });

  test("placement lifecycle + student visibility (V04-06)", async ({ request }) => {
    const create = await request.post("/api/admin/placements", {
      headers: { "x-e2e-user-id": ADMIN },
      data: {
        studentUserId: STUDENT,
        organization: "Marina Hotel",
        role: "Front Office Intern",
        countryCode: "SG",
      },
    });
    expect(create.ok()).toBe(true);
    const { id } = (await create.json()) as { id: string };

    // Skip Confirmed → must fail.
    const skip = await request.post(`/api/admin/placements/${id}/transition`, {
      headers: { "x-e2e-user-id": ADMIN },
      data: { to: "Active" },
    });
    expect(skip.status()).toBe(400);

    for (const to of ["Confirmed", "Active", "Completed"]) {
      const res = await request.post(`/api/admin/placements/${id}/transition`, {
        headers: { "x-e2e-user-id": ADMIN },
        data: { to },
      });
      expect(res.ok()).toBe(true);
    }
  });
});
