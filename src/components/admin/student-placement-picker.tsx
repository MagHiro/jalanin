"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";

export interface StudentCandidate {
  userId: string;
  displayName: string | null;
  email: string | null;
}

export interface EligibleApplication {
  id: string;
  internshipTitle: string;
  lifecycleStatus: string;
  submittedAt: string | null;
}

/**
 * Searchable student selector for placement creation (A1). Queries the
 * admin-only search endpoint as the admin types (debounced, min 2 chars),
 * then loads the selected student's eligible (submitted) applications.
 * The chosen UUIDs are stored in hidden inputs under the existing
 * placement-creation field contract (studentUserId / applicationId).
 */
export function StudentPlacementPicker({
  preselectedStudentId,
  preselectedStudentLabel,
}: {
  preselectedStudentId?: string;
  preselectedStudentLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentCandidate[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">("idle");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<StudentCandidate | null>(
    preselectedStudentId
      ? { userId: preselectedStudentId, displayName: preselectedStudentLabel ?? null, email: null }
      : null,
  );
  const [applications, setApplications] = useState<EligibleApplication[]>([]);
  const [appsState, setAppsState] = useState<"idle" | "loading" | "error">("idle");
  const [applicationId, setApplicationId] = useState<string>("");
  const listId = useId();
  const abort = useRef<AbortController | null>(null);
  const appsAbort = useRef<AbortController | null>(null);

  // Debounced admin-only search; aborts stale requests.
  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      setSearchState("idle");
      setOpen(false);
      return;
    }
    setSearchState("loading");
    setOpen(true);
    const timer = setTimeout(async () => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      try {
        const res = await fetch(`/api/admin/students/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; results?: StudentCandidate[] };
        if (!res.ok || !data.ok) throw new Error("Search failed.");
        setResults(data.results ?? []);
        setSearchState("idle");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setSearchState("error");
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.current?.abort();
    };
  }, [query, selected]);

  // Load eligible applications when a student is chosen (incl. preselected).
  useEffect(() => {
    if (!selected) {
      setApplications([]);
      setApplicationId("");
      setAppsState("idle");
      return;
    }
    setAppsState("loading");
    setApplications([]);
    setApplicationId("");
    appsAbort.current?.abort();
    const controller = new AbortController();
    appsAbort.current = controller;
    (async () => {
      try {
        const res = await fetch(`/api/admin/students/${selected.userId}/applications`, { signal: controller.signal });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; results?: EligibleApplication[] };
        if (!res.ok || !data.ok) throw new Error("Load failed.");
        setApplications(data.results ?? []);
        setAppsState("idle");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setApplications([]);
        setAppsState("error");
      }
    })();
    return () => controller.abort();
  }, [selected]);

  function choose(candidate: StudentCandidate) {
    setSelected(candidate);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="space-y-4 md:col-span-2">
      <input type="hidden" name="studentUserId" value={selected?.userId ?? ""} required />
      <input type="hidden" name="applicationId" value={applicationId} />
      <div>
        <label className="field-label" htmlFor={`${listId}-search`}>
          <span>Student *</span>
        </label>
        {selected ? (
          <p role="status" className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-foreground">
            <span className="min-w-0 flex-1"><b>{selected.displayName?.trim() || "Unnamed student"}</b>{selected.email && <span className="text-muted-foreground"> · {selected.email}</span>}</span>
            <button type="button" onClick={clear} className="btn btn-outline btn-sm">Change</button>
          </p>
        ) : (
          <>
            <div className="crm-search mt-2">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search students by name or email</span>
              <input
                id={`${listId}-search`}
                type="search"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                autoComplete="off"
                placeholder="Search student name or email (min 2 characters)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (results.length > 0 || searchState === "error") setOpen(true); }}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
              />
            </div>
            {open && (
              <div className="mt-1 rounded-lg border border-border bg-surface shadow-lg" role="listbox" id={listId} aria-label="Matching students">
                {searchState === "loading" && <p role="status" className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>}
                {searchState === "error" && <p role="alert" className="px-3 py-2 text-sm text-muted-foreground">Search failed. Try again.</p>}
                {searchState === "idle" && results.length === 0 && query.trim().length >= 2 && (
                  <p role="status" className="px-3 py-2 text-sm text-muted-foreground">No students match “{query.trim()}”.</p>
                )}
                {results.length > 0 && (
                  <ul className="max-h-56 overflow-auto py-1">
                    {results.map((c) => (
                      <li key={c.userId}>
                        <button
                          type="button"
                          role="option"
                          aria-selected="false"
                          onClick={() => choose(c)}
                          className="flex w-full min-h-11 flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                        >
                          <span className="font-medium text-foreground">{c.displayName?.trim() || "Unnamed student"}</span>
                          {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {selected && (
        <div>
          <label className="field-label" htmlFor={`${listId}-application`}>
            <span>Linked application <span className="font-normal text-muted-foreground">(optional)</span></span>
          </label>
          {appsState === "loading" && <p role="status" className="mt-2 text-sm text-muted-foreground">Loading eligible applications…</p>}
          {appsState === "error" && <p role="alert" className="mt-2 text-sm text-muted-foreground">Could not load applications. You can still create the placement without a link.</p>}
          {appsState === "idle" && applications.length === 0 && (
            <p role="status" className="mt-2 text-sm text-muted-foreground">No submitted applications for this student — the placement will be unlinked.</p>
          )}
          {appsState === "idle" && applications.length > 0 && (
            <select
              id={`${listId}-application`}
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="field mt-2"
            >
              <option value="">No linked application</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.internshipTitle} · {a.lifecycleStatus}{a.submittedAt ? ` · ${new Date(a.submittedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      {!selected && query.trim().length > 0 && query.trim().length < 2 && (
        <p className="text-xs text-muted-foreground">Type at least 2 characters to search.</p>
      )}
    </div>
  );
}
