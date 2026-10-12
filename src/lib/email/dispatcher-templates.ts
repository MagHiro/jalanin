import { emailReplyTo } from "./provider";
import {
  adminAlertEmail,
  esc,
  quotationEmail,
  statusChangeEmail,
} from "./templates";

/**
 * Rebuild a sendable email from an outbox payload. Payloads stay minimal
 * (no CV bytes, no secrets) — everything needed to render is captured at
 * enqueue time so retries don't re-read mutable rows.
 */
export function buildEmail(
  templateKey: string,
  payload: Record<string, unknown>,
): { subject: string; html: string; text: string; replyTo?: string } | null {
  const str = (k: string): string => String(payload[k] ?? "");
  switch (templateKey) {
    case "quotation-sent":
      return {
        ...quotationEmail({
          studentName: str("studentName"),
          internshipTitle: str("internshipTitle"),
          applicationRef: str("applicationRef"),
          amountMinor: Number(payload.amountMinor ?? 0),
          terms: str("terms"),
          replyTo: emailReplyTo(),
        }),
        replyTo: emailReplyTo(),
      };
    case "status-change":
      return {
        ...statusChangeEmail({
          studentName: str("studentName"),
          internshipTitle: str("internshipTitle"),
          applicationRef: str("applicationRef"),
          status: str("status"),
          nextStep: str("nextStep"),
        }),
        replyTo: emailReplyTo(),
      };
    case "admin-new-application":
    case "admin-revision":
      return {
        ...adminAlertEmail({
          applicantName: str("applicantName"),
          applicantEmail: str("applicantEmail"),
          internshipTitle: str("internshipTitle"),
          applicationRef: str("applicationRef"),
          adminUrl: str("adminUrl"),
          kind:
            templateKey === "admin-new-application"
              ? "new_application"
              : "revision_re_review",
        }),
      };
    case "contact-notify": {
      // Visitor-supplied content: escape for HTML, keep plain text raw.
      const name = esc(str("name"));
      const email = esc(str("email"));
      const subjectField = esc(str("subject"));
      const messageHtml = esc(str("message")).replace(/\n/g, "<br>");
      const subject = `Contact inquiry — ${str("subject") || str("name")}`.replace(/[\r\n]+/g, " ");
      const body = `Name: ${str("name")}\nEmail: ${str("email")}\n\n${str("message")}`;
      return {
        subject,
        text: body,
        html: `<p>Name: ${name}<br>Email: ${email}${subjectField ? `<br>Subject: ${subjectField}` : ""}</p><p>${messageHtml}</p>`,
      };
    }
    default:
      return null;
  }
}
