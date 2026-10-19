import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { and, eq } from "drizzle-orm";
import { applications, internships } from "@/lib/db/schema";

const mocks = vi.hoisted(() => ({ requireStudent: vi.fn(), select: vi.fn(), where: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/auth/require", () => ({ requireStudent: mocks.requireStudent, AuthError: class extends Error {} }));
vi.mock("@/lib/db/client", () => ({ db: { select: mocks.select } }));
vi.mock("@/components/applications/application-form", () => ({ ApplicationForm: () => null }));
import ApplyPage from "@/app/apply/[internshipId]/page";

const internshipId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000002";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireStudent.mockResolvedValue({ id: userId });
  const query = { from: vi.fn().mockReturnThis(), where: mocks.where, limit: mocks.limit };
  mocks.select.mockReturnValue(query);
  mocks.where.mockReturnValue(query);
});

it("rejects malformed listing identifiers without a DB query", async () => {
  await expect(ApplyPage({ params: { internshipId: "invalid" } })).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.select).not.toHaveBeenCalled();
});

it("limits the application lookup to the owner and filters unpublished listings for non-owners", async () => {
  mocks.limit.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  const html = renderToStaticMarkup(await ApplyPage({ params: { internshipId } }));
  expect(mocks.where.mock.calls[0][0]).toEqual(and(
    eq(applications.applicantUserId, userId), eq(applications.internshipId, internshipId),
  ));
  expect(mocks.where.mock.calls[1][0]).toEqual(and(
    eq(internships.id, internshipId), eq(internships.publicationStatus, "Published"),
  ));
  expect(html).toContain("Internship not found");
});

it("shows an unpublished title and preserved-draft guidance to an existing owner", async () => {
  mocks.limit.mockResolvedValueOnce([{ id: internshipId, isDraft: true }])
    .mockResolvedValueOnce([{ id: internshipId, title: "Private listing title", publicationStatus: "Unpublished" }]);
  const html = renderToStaticMarkup(await ApplyPage({ params: { internshipId } }));
  expect(html).toContain("Private listing title");
  expect(html).toContain("not currently accepting applications");
});

it("does not expose DB exceptions in the page or incident logs", async () => {
  mocks.limit.mockRejectedValue(new Error("SQL private@example.com"));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const html = renderToStaticMarkup(await ApplyPage({ params: { internshipId } }));
    expect(html).toContain("Could not load this application");
    expect(html).not.toContain("private@example.com");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private@example.com");
    expect(log).toHaveBeenCalledOnce();
  } finally {
    log.mockRestore();
  }
});
