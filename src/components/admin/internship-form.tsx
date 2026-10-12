"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const field = "mt-1 w-full rounded border px-3 py-2";

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
    <form onSubmit={onSubmit} className="max-w-3xl space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm"><span className="font-medium">Title *</span>
          <input name="title" required defaultValue={v("title")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">Slug * (stable canonical URL)</span>
          <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={v("slug")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">City *</span>
          <input name="city" required defaultValue={v("city")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">Country code * (e.g. SG)</span>
          <input name="countryCode" required minLength={2} maxLength={2} defaultValue={v("countryCode")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">Category</span>
          <select name="categoryId" defaultValue={initial?.categoryId ?? ""} className={field}>
            <option value="">— none —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        <label className="text-sm"><span className="font-medium">Publication status *</span>
          <select name="publicationStatus" defaultValue={initial?.publicationStatus ?? "Draft"} className={field}>
            <option>Draft</option><option>Published</option><option>Unpublished</option>
          </select></label>
        <label className="text-sm"><span className="font-medium">Start date *</span>
          <input name="startDate" type="date" required defaultValue={v("startDate")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">End date *</span>
          <input name="endDate" type="date" required defaultValue={v("endDate")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">Application deadline (optional, informational)</span>
          <input name="applicationDeadline" type="datetime-local" defaultValue={v("applicationDeadline")} className={field} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={initial?.featured} /> Featured on landing</label>
      </div>
      <label className="block text-sm"><span className="font-medium">Description *</span>
        <textarea name="description" required rows={4} defaultValue={v("description")} className={field} /></label>
      <label className="block text-sm"><span className="font-medium">Responsibilities *</span>
        <textarea name="responsibilities" required rows={4} defaultValue={v("responsibilities")} className={field} /></label>
      <label className="block text-sm"><span className="font-medium">Requirements *</span>
        <textarea name="requirements" required rows={4} defaultValue={v("requirements")} className={field} /></label>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
        {busy ? "Saving…" : "Save internship"}
      </button>
    </form>
  );
}
