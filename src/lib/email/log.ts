import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "./provider";

/**
 * File-based provider for local development and tests: appends rendered
 * emails to .storage-local/mailbox/*.json instead of sending. Satisfies the
 * PRD requirement to test email locally without contacting real recipients.
 * Never selectable accidentally in production: getEmailProvider only uses it
 * when EMAIL_PROVIDER=log is set explicitly.
 */
export class LogEmailProvider implements EmailProvider {
  readonly name = "log";

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const dir = path.resolve(process.cwd(), ".storage-local", "mailbox");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
    await fs.writeFile(
      file,
      JSON.stringify(
        {
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
          replyTo: input.replyTo,
          loggedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    return { ok: true, providerMessageId: `log:${path.basename(file)}` };
  }
}
