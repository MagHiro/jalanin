import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn(), createTransport: vi.fn(), log: vi.fn(() => "incident") }));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }));
vi.mock("@/lib/observability/logger", () => ({ logServerError: mocks.log }));
import { SmtpEmailProvider } from "@/lib/email/smtp";

const input = { to: "private@example.com", subject: "subject", text: "text", html: "html" };
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail, close: mocks.close });
});
afterEach(() => vi.useRealTimers());

it("configures SMTP phase timeouts and bounds a hung send with best-effort close", async () => {
  mocks.sendMail.mockImplementation(() => new Promise(() => {}));
  const provider = new SmtpEmailProvider({ host: "localhost", port: 1025, secure: false });
  expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({ connectionTimeout: 3000, greetingTimeout: 3000, socketTimeout: 5000 }));
  const send = provider.send(input);
  await vi.advanceTimersByTimeAsync(8000);
  expect(await send).toEqual({ ok: false, error: "SMTP failed or outcome unknown (incident incident)." });
  expect(mocks.close).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it("never logs or returns raw SMTP error properties", async () => {
  mocks.sendMail.mockRejectedValue(Object.assign(new Error("private@example.com password"), { code: "private@example.com", name: "secret" }));
  const provider = new SmtpEmailProvider({ host: "localhost", port: 1025, secure: false });
  const result = await provider.send(input);
  expect(result.ok).toBe(false);
  expect(JSON.stringify(result)).not.toContain("private@example.com");
  const logged = mocks.log.mock.calls[0] as unknown as [string, Error];
  expect(logged[1].message).not.toContain("private@example.com");
  expect(logged[1].name).toBe("Error");
  expect(vi.getTimerCount()).toBe(0);
});

it("returns successful delivery and clears its deadline timer", async () => {
  mocks.sendMail.mockResolvedValue({ messageId: "message-id" });
  const provider = new SmtpEmailProvider({ host: "localhost", port: 1025, secure: false });
  expect(await provider.send(input)).toEqual({ ok: true, providerMessageId: "message-id" });
  expect(vi.getTimerCount()).toBe(0);
});
