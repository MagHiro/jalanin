// Branded transactional templates. Quotation emails carry SGD amount +
// student-facing terms + reply instructions (D03); internal notes are NEVER
// rendered into student mail (ADM-APP-11). No expiry is ever claimed (B01).
import { formatSgd } from "@/lib/workflow/transitions";

function layout(title: string, bodyHtml: string, bodyText: string): { html: string; text: string } {
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
<header style="border-bottom:3px solid #112252;padding-bottom:12px;margin-bottom:20px;">
<strong style="font-size:20px;color:#112252;">Jalanin Internships</strong></header>
<h2>${title}</h2>${bodyHtml}
<footer style="margin-top:28px;border-top:1px solid #ddd;padding-top:12px;font-size:12px;color:#666;">
<p>Jalanin Internship Platform · reply to this email if you have questions.</p></footer>
</body></html>`;
  return { html, text: `${title}\n\n${bodyText}\n\n— Jalanin Internships` };
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface QuotationEmailInput {
  studentName: string;
  internshipTitle: string;
  applicationRef: string;
  amountMinor: number;
  terms: string;
  replyTo: string;
}

export function quotationEmail(input: QuotationEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const amount = formatSgd(input.amountMinor);
  const subject = `Your Jalanin quotation — ${input.internshipTitle} (${input.applicationRef})`;
  const bodyHtml = `<p>Dear ${esc(input.studentName)},</p>
<p>Thank you for your application for <strong>${esc(input.internshipTitle)}</strong> (reference <strong>${esc(input.applicationRef)}</strong>).</p>
<p>Your custom quotation is:</p>
<p style="font-size:22px;font-weight:bold;">${esc(amount)}</p>
<h3>Quotation terms</h3><p>${esc(input.terms).replace(/\n/g, "<br>")}</p>
<p><strong>To accept or decline, simply reply to this email.</strong> Our team will confirm the next steps with you.</p>`;
  const bodyText = `Dear ${input.studentName},\n\nThank you for your application for ${input.internshipTitle} (reference ${input.applicationRef}).\n\nYour custom quotation is: ${amount}\n\nQuotation terms:\n${input.terms}\n\nTo accept or decline, simply reply to this email. Our team will confirm the next steps with you.`;
  const { html, text } = layout("Your internship quotation", bodyHtml, bodyText);
  return { subject, html, text };
}

export interface StatusEmailInput {
  studentName: string;
  internshipTitle: string;
  applicationRef: string;
  status: string;
  nextStep: string;
}

export function statusChangeEmail(input: StatusEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Update on your Jalanin application (${input.applicationRef}) — ${input.status}`;
  const bodyHtml = `<p>Dear ${esc(input.studentName)},</p>
<p>Your application for <strong>${esc(input.internshipTitle)}</strong> (reference <strong>${esc(input.applicationRef)}</strong>) is now: <strong>${esc(input.status)}</strong>.</p>
<p>${esc(input.nextStep)}</p>`;
  const bodyText = `Dear ${input.studentName},\n\nYour application for ${input.internshipTitle} (reference ${input.applicationRef}) is now: ${input.status}.\n\n${input.nextStep}`;
  const { html, text } = layout("Application update", bodyHtml, bodyText);
  return { subject, html, text };
}

export interface AdminAlertInput {
  applicantName: string;
  applicantEmail: string;
  internshipTitle: string;
  applicationRef: string;
  adminUrl: string;
  kind: "new_application" | "revision_re_review";
}

export function adminAlertEmail(input: AdminAlertInput): {
  subject: string;
  html: string;
  text: string;
} {
  const isNew = input.kind === "new_application";
  const subject = isNew
    ? `New application — ${input.internshipTitle} (${input.applicationRef})`
    : `Re-review required — ${input.internshipTitle} (${input.applicationRef})`;
  const bodyHtml = `<p>A student ${isNew ? "submitted a new application" : "updated a submitted application (re-review required)"}.</p>
<ul><li>Applicant: ${esc(input.applicantName)} (${esc(input.applicantEmail)})</li>
<li>Internship: ${esc(input.internshipTitle)}</li>
<li>Reference: ${esc(input.applicationRef)}</li></ul>
<p><a href="${esc(input.adminUrl)}">Open in admin dashboard</a></p>
<p>No CV is attached to this email; open the secure link to review documents.</p>`;
  const bodyText = `A student ${isNew ? "submitted a new application" : "updated a submitted application (re-review required)"}.\nApplicant: ${input.applicantName} (${input.applicantEmail})\nInternship: ${input.internshipTitle}\nReference: ${input.applicationRef}\nOpen: ${input.adminUrl}\nNo CV is attached; open the secure link to review documents.`;
  const { html, text } = layout(subject, bodyHtml, bodyText);
  return { subject, html, text };
}

export const STATUS_NEXT_STEPS: Record<string, string> = {
  New: "We have received your application and will begin our review shortly.",
  "In Review": "Our team is reviewing your application. We will contact you with a custom quotation.",
  Accepted: "Your placement has been accepted. Our team will contact you about preparation steps.",
  Rejected: "Thank you for your interest. Please contact us if you would like feedback or alternatives.",
  Completed: "Your internship journey is marked complete. Thank you for travelling with Jalanin.",
};
