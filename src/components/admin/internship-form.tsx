"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceSelect } from "@/components/ui/workspace-select";
import { DateInput } from "@/components/ui/date-input";

interface Initial {
  id?: string;
  title?: string;
  slug?: string;
  city?: string;
  countryCode?: string;
  categoryId?: string | null;
  startDate?: string;
  endDate?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  publicationStatus?: string;
  featured?: boolean;
  applicationDeadline?: string | null;
}

export function InternshipForm({
  initial,
  categories,
}: {
  initial?: Initial;
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: form.get("title"),
      slug: form.get("slug"),
      city: form.get("city"),
      countryCode: form.get("countryCode"),
      categoryId: (form.get("categoryId") as string) || null,
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      description: form.get("description"),
      responsibilities: form.get("responsibilities"),
      requirements: form.get("requirements"),
      publicationStatus: form.get("publicationStatus"),
      featured: form.get("featured") === "on",
      applicationDeadline: (form.get("applicationDeadline") as string) || null,
    };
    try {
      const res = await fetch(
        initial?.id ? `/api/admin/internships/${initial.id}` : "/api/admin/internships",
        {
          method: initial?.id ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed.");
      router.push("/admin/internships");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setBusy(false);
    }
  }

  const v = (k: keyof Initial): string => String(initial?.[k] ?? "");

  return (
    <form onSubmit={onSubmit} className="internship-editor" aria-label={initial?.id ? "Edit internship" : "New internship"}>
      <nav className="internship-editor-index" aria-label="Listing sections">
        <a href="#listing-basics"><span>01</span> Essentials</a>
        <a href="#listing-dates"><span>02</span> Dates</a>
        <a href="#listing-content"><span>03</span> Role details</a>
        <a href="#listing-publishing"><span>04</span> Publishing</a>
      </nav>
      <section aria-labelledby="listing-basics" className="form-section">
        <div className="internship-section-heading"><span>01</span><div><h2 id="listing-basics">Listing basics</h2><p>Give the opportunity a clear identity and location.</p></div></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="field-label"><span>Title *</span>
            <input name="title" required defaultValue={v("title")} className="field" placeholder="Hotel Operations Intern" /></label>
          <label className="field-label"><span>Slug * <span className="font-normal text-muted-foreground">(stable canonical URL)</span></span>
            <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={v("slug")} className="field" placeholder="hotel-operations-singapore" /></label>
          <label className="field-label"><span>City *</span>
            <input name="city" required defaultValue={v("city")} className="field" placeholder="Singapore" /></label>
          <label className="field-label"><span>Country code * <span className="font-normal text-muted-foreground">(e.g. SG)</span></span>
            <input name="countryCode" required minLength={2} maxLength={2} defaultValue={v("countryCode")} className="field" placeholder="SG" /></label>
          <label className="field-label"><span>Category</span>
            <WorkspaceSelect name="categoryId" ariaLabel="Category" defaultValue={initial?.categoryId ?? ""} options={[{ value: "", label: "No category" }, ...categories.map(c => ({ value: c.id, label: c.name }))]} /></label>
        </div>
      </section>
      <section aria-labelledby="listing-dates" className="form-section">
        <div className="internship-section-heading"><span>02</span><div><h2 id="listing-dates">Dates & timing</h2><p>Help students plan their internship and application.</p></div></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="field-label"><span>Start date *</span>
            <DateInput name="startDate" type="date" ariaLabel="Start date" defaultValue={v("startDate")} required /></label>
          <label className="field-label"><span>End date *</span>
            <DateInput name="endDate" type="date" ariaLabel="End date" defaultValue={v("endDate")} required /></label>
          <label className="field-label"><span>Application deadline <span className="font-normal text-muted-foreground">(optional, informational)</span></span>
            <DateInput name="applicationDeadline" type="datetime-local" ariaLabel="Application deadline" defaultValue={v("applicationDeadline")}  /></label>
        </div>
      </section>
      <section aria-labelledby="listing-content" className="form-section">
        <div className="internship-section-heading"><span>03</span><div><h2 id="listing-content">Role content</h2><p>Describe the experience, everyday work and who should apply.</p></div></div>
        <div className="mt-4 space-y-4">
          <label className="field-label"><span>Description *</span>
            <textarea name="description" required rows={5} defaultValue={v("description")} className="field" placeholder="Introduce the role, team and what students will learn." /></label>
          <label className="field-label"><span>Responsibilities *</span>
            <textarea name="responsibilities" required rows={5} defaultValue={v("responsibilities")} className="field" placeholder="Outline the main tasks and projects, one per line." /></label>
          <label className="field-label"><span>Requirements *</span>
            <textarea name="requirements" required rows={5} defaultValue={v("requirements")} className="field" placeholder="List the skills, experience and availability needed." /></label>
        </div>
      </section>
      <section aria-labelledby="listing-publishing" className="form-section">
        <div className="internship-section-heading"><span>04</span><div><h2 id="listing-publishing">Publishing</h2><p>Choose how this opportunity appears to students.</p></div></div>
        <div className="internship-publishing-fields">
          <label className="field-label"><span>Publication status *</span>
            <WorkspaceSelect name="publicationStatus" ariaLabel="Publication status" defaultValue={initial?.publicationStatus ?? "Draft"} options={["Draft", "Published", "Unpublished"].map(v => ({ value: v, label: v }))} />
            <small>Draft stays private. Published appears in the catalogue.</small>
          </label>
          <label className="internship-featured-option">
            <input type="checkbox" name="featured" defaultChecked={initial?.featured} />
            <span><strong>Featured on landing</strong><small>Highlight this opportunity on the homepage when published.</small></span>
          </label>
        </div>
      </section>
      {error && <p role="alert" className="alert alert-error">{error}</p>}
      <div className="workspace-editor-submit">
        <div><strong>{initial?.id ? "Update internship" : "Ready to save?"}</strong><span>Changes to the listing take effect after saving.</span></div>
        <div className="workspace-editor-submit-actions">
          <Link href="/admin/internships" className="btn btn-outline">Cancel</Link>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? "Saving…" : initial?.id ? "Save changes" : "Create internship"}
          </button>
        </div>
      </div>
    </form>
  );
}
