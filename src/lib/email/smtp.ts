import nodemailer from "nodemailer";
import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "./provider";
import { emailFrom } from "./provider";
import { logServerError } from "@/lib/observability/logger";

export interface SmtpOptions {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  secure: boolean;
}

/** SMTP implementation (Mailpit in local dev; production SMTP host). */
export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";
  private transporter: nodemailer.Transporter;

  constructor(private options: SmtpOptions) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      connectionTimeout: 3_000,
      greetingTimeout: 3_000,
      socketTimeout: 5_000,
      auth:
        options.user && options.pass
          ? { user: options.user, pass: options.pass }
          : undefined,
    });
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const info = await Promise.race([this.transporter.sendMail({
        from: emailFrom(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo,
      }), new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          // Best effort only: timeout cannot retract mail already accepted.
          reject(new Error("SMTP deadline exceeded."));
          this.transporter.close();
        }, 8_000);
      })]);
      return { ok: true, providerMessageId: String(info.messageId ?? "") };
    } catch {
      const incidentId = logServerError("email.smtp.failed", new Error("SMTP failed or timed out; delivery outcome may be unknown."));
      return {
        ok: false,
        error: `SMTP failed or outcome unknown (incident ${incidentId}).`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
