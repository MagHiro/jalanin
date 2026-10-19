import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { DomainError } from "@/lib/errors/domain-error";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(), saveInternship: vi.fn(), savePlacement: vi.fn(),
  transitionPlacement: vi.fn(), transitionApplication: vi.fn(),
  acknowledgeRevision: vi.fn(), reopenRejected: vi.fn(),
}));
vi.mock("@/lib/auth/require", () => ({
  requireAdmin: mocks.requireAdmin,
  AuthError: class AuthError extends Error {
    constructor(public status: 401 | 403, message: string) { super(message); }
  },
}));
vi.mock("@/features/admin/service", () => mocks);

import { AuthError } from "@/lib/auth/require";
import { POST as createInternship } from "@/app/api/admin/internships/route";
import { PUT as updateInternship } from "@/app/api/admin/internships/[id]/route";
import { POST as createPlacement } from "@/app/api/admin/placements/route";
import { PUT as updatePlacement } from "@/app/api/admin/placements/[id]/route";
import { POST as placementTransition } from "@/app/api/admin/placements/[id]/transition/route";
import { POST as applicationAction } from "@/app/api/admin/applications/[id]/[action]/route";

const id = "00000000-0000-4000-8000-000000000001";
const context = { params: { id } };
const request = (body: unknown, action = "transition") => new Request(`https://jalanin.example/api/admin/applications/${id}/${action}`, {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});
const routes = [
  ["internship create", createInternship, mocks.saveInternship, {}],
  ["internship update", updateInternship, mocks.saveInternship, {}],
  ["placement create", createPlacement, mocks.savePlacement, {}],
  ["placement update", updatePlacement, mocks.savePlacement, {}],
  ["placement transition", placementTransition, mocks.transitionPlacement, { to: "Active" }],
  ["application action", applicationAction, mocks.transitionApplication, { to: "In Review" }],
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id });
});

describe.each(routes)("%s error boundary", (_name, handler, service, body) => {
  it.each([401, 403] as const)("preserves auth %s before body validation", async (status) => {
    mocks.requireAdmin.mockRejectedValue(new AuthError(status, "Unauthorized"));
    expect((await handler(request(null), context)).status).toBe(status);
    expect(service).not.toHaveBeenCalled();
  });

  it("logs unexpected service failures with a matching incident and generic 503", async () => {
    const secret = "SQL failure: private@example.com";
    service.mockRejectedValue(new Error(secret));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await handler(request(body), context);
      const result = await response.json();
      expect(response.status).toBe(503);
      expect(result.incidentId).toEqual(expect.any(String));
      expect(JSON.stringify(result)).not.toContain(secret);
      expect(log).toHaveBeenCalledOnce();
      expect(JSON.parse(log.mock.calls[0][0]).incidentId).toBe(result.incidentId);
    } finally { log.mockRestore(); }
  });

  it.each([
    new DomainError("Workflow transition is not permitted."),
    z.object({ title: z.string() }).safeParse(null).error,
  ])("keeps business/validation failures at 400", async (error) => {
    service.mockRejectedValue(error);
    expect((await handler(request(body), context)).status).toBe(400);
  });

  it("rejects malformed JSON at 400", async () => {
    const invalid = new Request("https://jalanin.example/transition", { method: "POST", body: "{" });
    expect((await handler(invalid, context)).status).toBe(400);
    expect(service).not.toHaveBeenCalled();
  });
});

describe.each([
  ["internship update", updateInternship], ["placement update", updatePlacement],
  ["placement transition", placementTransition], ["application action", applicationAction],
] as const)("%s path validation", (_name, handler) => {
  it("rejects invalid UUIDs before mutation", async () => {
    expect((await handler(request({ to: "Active" }), { params: { id: "invalid" } })).status).toBe(400);
    expect(mocks.saveInternship).not.toHaveBeenCalled();
    expect(mocks.savePlacement).not.toHaveBeenCalled();
    expect(mocks.transitionPlacement).not.toHaveBeenCalled();
    expect(mocks.transitionApplication).not.toHaveBeenCalled();
  });
});

it.each([null, [], { to: "Unknown" }, { to: 1 }])("rejects invalid action bodies %j", async (body) => {
  expect((await applicationAction(request(body), context)).status).toBe(400);
  expect((await placementTransition(request(body), context)).status).toBe(400);
  expect(mocks.transitionApplication).not.toHaveBeenCalled();
  expect(mocks.transitionPlacement).not.toHaveBeenCalled();
});

it("validates acknowledge revisions and passes the narrowed revision", async () => {
  for (const body of [null, {}, { expectedRevision: 0 }, { expectedRevision: "1" }]) {
    expect((await applicationAction(request(body, "acknowledge"), context)).status).toBe(400);
  }
  expect(mocks.acknowledgeRevision).not.toHaveBeenCalled();
  expect((await applicationAction(request({ expectedRevision: 2 }, "acknowledge"), context)).status).toBe(200);
  expect(mocks.acknowledgeRevision).toHaveBeenCalledWith({ adminId: id, applicationId: id, expectedRevision: 2 });
});
