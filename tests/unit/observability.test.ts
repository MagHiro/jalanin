import { afterEach, describe, expect, it, vi } from "vitest";
import { logServerError } from "@/lib/observability/logger";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("production error logs", () => {
  it("correlates a failure without exposing exception messages or user content", () => {
    vi.stubEnv("NODE_ENV", "production");
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const incidentId = logServerError("contact.submit.failed", new Error("user@example.com secret token"), {
      status: 503,
    });
    expect(incidentId).toMatch(/^[0-9a-f-]{36}$/i);
    const log = JSON.parse(String(spy.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(log.event).toBe("contact.submit.failed");
    expect(log.incidentId).toBe(incidentId);
    expect(log.errorType).toBe("Error");
    expect(log.status).toBe(503);
    expect(JSON.stringify(log)).not.toContain("user@example.com");
    expect(JSON.stringify(log)).not.toContain("secret token");
  });
});
