import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/lib/errors/domain-error";

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(), saveDraft: vi.fn(), submitApplication: vi.fn(),
  editSubmittedApplication: vi.fn(), select: vi.fn(), limit: vi.fn(),
}));
vi.mock("@/lib/auth/require", () => ({
  requireStudent: mocks.requireStudent,
  AuthError: class AuthError extends Error {},
}));
vi.mock("@/features/applications/service", () => mocks);
vi.mock("@/lib/db/client", () => ({ db: { select: mocks.select } }));

import { POST as draft } from "@/app/api/applications/draft/route";
import { POST as submit } from "@/app/api/applications/submit/route";

const internshipId = "00000000-0000-4000-8000-000000000001";
const request = (body: unknown, headers = {}) => new Request("https://jalanin.example/api/applications", {
  method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireStudent.mockResolvedValue({ id: internshipId, emailConfirmed: true });
  const query = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: mocks.limit };
  mocks.select.mockReturnValue(query);
  mocks.limit.mockResolvedValue([]);
});

describe.each([["draft", draft], ["submit", submit]] as const)("%s boundary", (_name, post) => {
  it.each([null, [], { internshipId: "malformed", values: {} }, { internshipId, values: [] }])(
    "rejects %j before querying or calling services", async (body) => {
      expect((await post(request(body))).status).toBe(400);
      expect(mocks.select).not.toHaveBeenCalled();
      expect(mocks.saveDraft).not.toHaveBeenCalled();
      expect(mocks.submitApplication).not.toHaveBeenCalled();
    },
  );

  it("returns generic 500 and a safe incident log for DB exceptions", async () => {
    const secret = "Failed SQL: private@example.com token=secret";
    const error = new Error(secret);
    mocks.saveDraft.mockRejectedValue(error);
    mocks.limit.mockRejectedValue(error);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await post(request({ internshipId, values: {} }));
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.incidentId).toEqual(expect.any(String));
      expect(JSON.stringify(body)).not.toContain(secret);
      expect(log).toHaveBeenCalledOnce();
      const record = JSON.parse(log.mock.calls[0][0]);
      expect(record.incidentId).toBe(body.incidentId);
      expect(record).not.toHaveProperty("message");
      expect(JSON.stringify(log.mock.calls)).not.toContain(secret);
    } finally {
      log.mockRestore();
    }
  });

  it("keeps expected domain validation as a readable 400", async () => {
    const message = "A CV upload is required before submitting.";
    mocks.saveDraft.mockRejectedValue(new DomainError(message));
    mocks.submitApplication.mockRejectedValue(new DomainError(message));
    const response = await post(request({ internshipId, values: {} }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(message);
  });
});

it("rejects invalid header retry keys before the submit lookup", async () => {
  const response = await submit(request({ internshipId, values: {} }, { "Idempotency-Key": "x".repeat(161) }));
  expect(response.status).toBe(400);
  expect(mocks.select).not.toHaveBeenCalled();
});
