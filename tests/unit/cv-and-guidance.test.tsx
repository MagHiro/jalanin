import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/motion/reveal", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/ui/date-input", () => ({
  DateInput: () => null,
}));

import { ApplicationForm } from "@/components/applications/application-form";
import { ApplicationStatusGuidance } from "@/components/applications/status-guidance";

const internshipId = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("existing CV visibility (S2 — metadata only, never storage paths)", () => {
  it("shows the stored CV filename and upload date with a Replace label", () => {
    const html = renderToStaticMarkup(
      <ApplicationForm
        internshipId={internshipId}
        existing={{ id: "app", isDraft: true, lifecycleStatus: "New" }}
        existingCv={{ originalFilename: "amina-cv.pdf", byteSize: 204800, createdAt: "2026-10-02T00:00:00.000Z" }}
      />,
    );
    expect(html).toContain("amina-cv.pdf");
    expect(html).toContain("Replace CV");
    expect(html).toContain("02");
    expect(html).toContain("Oct");
    expect(html).not.toContain("storagePath");
    expect(html).not.toContain("storage_path");
  });

  it("keeps the original CV when no replacement is chosen", () => {
    const html = renderToStaticMarkup(
      <ApplicationForm
        internshipId={internshipId}
        existing={{ id: "app", isDraft: false, lifecycleStatus: "New", revision: 2 }}
        existingCv={{ originalFilename: "cv.docx", byteSize: 51200, createdAt: "2026-09-01T00:00:00.000Z" }}
      />,
    );
    expect(html).toContain("Leave empty to keep your current CV");
    expect(html).toContain("requires admin re-review");
  });

  it("asks for a CV on a fresh application without implying one exists", () => {
    const html = renderToStaticMarkup(
      <ApplicationForm internshipId={internshipId} existing={null} existingCv={null} />,
    );
    expect(html).toContain("CV (PDF or DOCX, max 5 MB)");
    expect(html).not.toContain("Current CV");
    expect(html).not.toContain("Replace CV");
  });
});

describe("status guidance rendering (S1 — keyboard/screen-reader accessible)", () => {
  it("renders status, next step and action under labelled headings", () => {
    const html = renderToStaticMarkup(
      <ApplicationStatusGuidance status="In Review" isDraft={false} needsReReview={false} />,
    );
    expect(html).toContain("What this means");
    expect(html).toContain("In Review");
    expect(html).toContain("No action required");
  });

  it("explains queued quotation delivery and email reply on mobile and desktop widths", () => {
    const html = renderToStaticMarkup(
      <ApplicationStatusGuidance status="Quotation Sent" isDraft={false} needsReReview={false} />,
    );
    expect(html.toLowerCase()).toContain("queued");
    expect(html.toLowerCase()).toContain("reply");
  });

  it("never presents admin re-review as a student action", () => {
    const html = renderToStaticMarkup(
      <ApplicationStatusGuidance status="In Review" isDraft={false} needsReReview={true} />,
    );
    expect(html).toContain("awaiting re-review");
    expect(html).toContain("No action required");
  });
});
