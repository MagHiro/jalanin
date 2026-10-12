import nodemailer from "nodemailer";
import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "./provider";
import { emailFrom } from "./provider";

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
      auth:
        options.user && options.pass
          ? { user: options.user, pass: options.pass }
          : undefined,
    });
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: emailFrom(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo,
      });
      return { ok: true, providerMessageId: String(info.messageId ?? "") };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "SMTP send failed.",
      };
    }
  }
}
