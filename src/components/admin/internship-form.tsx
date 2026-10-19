"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5" aria-label={initial?.id ? "Edit internship" : "New internship"}>
      <section aria-labelledby="listing-basics" className="form-section">
        <h2 id="listing-basics" className="text-base font-semibold tracking-tight text-foreground">Listing basics</h2>
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
          <label className="field-label"><span>Publication status *</span>
            <WorkspaceSelect name="publicationStatus" ariaLabel="Publication status" defaultValue={initial?.publicationStatus ?? "Draft"} options={["Draft", "Published", "Unpublished"].map(v => ({ value: v, label: v }))} /></label>
          <label className="field-label"><span>Start date *</span>
            <DateInput name="startDate" type="date" ariaLabel="Start date" defaultValue={v("startDate")} required /></label>
          <label className="field-label"><span>End date *</span>
            <DateInput name="endDate" type="date" ariaLabel="End date" defaultValue={v("endDate")} required /></label>
          <label className="field-label"><span>Application deadline <span className="font-normal text-muted-foreground">(optional, informational)</span></span>
            <DateInput name="applicationDeadline" type="datetime-local" ariaLabel="Application deadline" defaultValue={v("applicationDeadline")}  /></label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" name="featured" defaultChecked={initial?.featured} className="size-4 accent-primary" /> Featured on landing
          </label>
        </div>
      </section>
      <section aria-labelledby="listing-content" className="form-section">
        <h2 id="listing-content" className="text-base font-semibold tracking-tight text-foreground">Role content</h2>
        <div className="mt-4 space-y-4">
          <label className="field-label"><span>Description *</span>
            <textarea name="description" required rows={4} defaultValue={v("description")} className="field" /></label>
          <label className="field-label"><span>Responsibilities *</span>
            <textarea name="responsibilities" required rows={4} defaultValue={v("responsibilities")} className="field" /></label>
          <label className="field-label"><span>Requirements *</span>
            <textarea name="requirements" required rows={4} defaultValue={v("requirements")} className="field" /></label>
        </div>
      </section>
      {error && <p role="alert" className="alert alert-error">{error}</p>}
      <button disabled={busy} className="btn btn-primary">
        {busy ? "Saving…" : "Save internship"}
      </button>
    </form>
  );
}
