// Replaceable transactional-email abstraction (PRD §13).
// Implementations: SMTP via nodemailer (Mailpit locally; any SMTP or
// Resend-compatible host in production). New providers implement
// EmailProvider and are selected by EMAIL_PROVIDER — callers are unaffected.
export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Jalanin Internships <internships@jalanin.com>";
}

export function emailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO ?? "internships@jalanin.com";
}

export function adminAlertRecipients(): string[] {
  const raw = process.env.ADMIN_ALERT_EMAIL ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function getEmailProvider(): EmailProvider {
  const kind = (process.env.EMAIL_PROVIDER ?? "smtp").toLowerCase();
  if (kind === "log") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EMAIL_PROVIDER=log is prohibited in production.");
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LogEmailProvider } = require("./log") as typeof import("./log");
    return new LogEmailProvider();
  }
  if (kind === "smtp") {
    if (process.env.NODE_ENV === "production" &&
        (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.EMAIL_FROM)) {
      throw new Error("Production SMTP requires SMTP_HOST, SMTP_PORT, and EMAIL_FROM.");
    }
    // Lazy import keeps nodemailer server-only.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SmtpEmailProvider } = require("./smtp") as typeof import("./smtp");
    return new SmtpEmailProvider({
      host: process.env.SMTP_HOST ?? "localhost",
      port: Number(process.env.SMTP_PORT ?? 1025),
      user: process.env.SMTP_USER || undefined,
      pass: process.env.SMTP_PASS || undefined,
      secure: (process.env.SMTP_SECURE ?? "false") === "true",
    });
  }
  throw new Error(`Unknown EMAIL_PROVIDER "${kind}".`);
}
