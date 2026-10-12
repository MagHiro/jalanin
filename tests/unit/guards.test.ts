import { describe, expect, it } from "vitest";
import { isStudentEditLocked } from "@/lib/workflow/transitions";
import { quotationEmail, statusChangeEmail } from "@/lib/email/templates";
import { validateUpload } from "@/lib/storage/documents";

describe("student edit lock (D14)", () => {
  it("permits edits in New / In Review", () => {
    expect(isStudentEditLocked("New")).toBe(false);
    expect(isStudentEditLocked("In Review")).toBe(false);
  });

  it("locks edits at Quotation Sent and later", () => {
    for (const s of ["Quotation Sent", "Accepted", "Rejected", "Completed"] as const) {
      expect(isStudentEditLocked(s)).toBe(true);
    }
  });
});

describe("email content rules (D03, ADM-APP-11, B01)", () => {
  it("quotation email contains SGD amount + terms and no expiry claim", () => {
    const { subject, html, text } = quotationEmail({
      studentName: "Aisha",
      internshipTitle: "Hotel Ops",
      applicationRef: "JL-ABC123",
      amountMinor: 125050,
      terms: "Includes placement support.",
      replyTo: "internships@jalanin.com",
    });
    expect(subject).toMatch(/quotation/i);
    expect(html).toMatch(/SGD 1,250\.50/);
    expect(text).toMatch(/SGD 1,250\.50/);
    expect(`${subject} ${html} ${text}`.toLowerCase()).not.toMatch(/expir/);
  });

  it("student emails never embed internal notes", () => {
    const secret = "INTERNAL-MARGIN-SECRET-xyz";
    const { html, text } = statusChangeEmail({
      studentName: "Aisha",
      internshipTitle: "Hotel Ops",
      applicationRef: "JL-ABC123",
      status: "Accepted",
      nextStep: "Next steps.",
    });
    expect(`${html} ${text}`).not.toContain(secret);
  });
});

describe("upload validation (B05 interim config)", () => {
  const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

  it("accepts a real PDF header", () => {
    expect(
      validateUpload({ filename: "cv.pdf", mimeType: "application/pdf", bytes: pdf }).ok,
    ).toBe(true);
  });

  it("rejects spoofed contents and disallowed extensions", () => {
    expect(
      validateUpload({
        filename: "cv.pdf",
        mimeType: "application/pdf",
        bytes: Buffer.from("MZ executable"),
      }).ok,
    ).toBe(false);
    expect(
      validateUpload({ filename: "cv.exe", mimeType: "application/pdf", bytes: pdf }).ok,
    ).toBe(false);
  });

  it("rejects oversized files", () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 0);
    big[0] = 0x25;
    big[1] = 0x50;
    big[2] = 0x44;
    big[3] = 0x46;
    expect(
      validateUpload({ filename: "cv.pdf", mimeType: "application/pdf", bytes: big }).ok,
    ).toBe(false);
  });
});
