import { redirect } from "next/navigation";
import { isE2EMode } from "@/lib/auth/require";

// Temporary local-dev entry page. Gated — 404s unless E2E_MODE=1.
// Delete before production.
const PRESETS = [
  {
    id: "00000000-0000-0000-0000-00000000ad01",
    label: "Admin",
    detail: "Full operations: overview, review queue, listings, students, placements, inbox.",
  },
  {
    id: "00000000-0000-0000-0000-00000000ac01",
    label: "Amina Rahman",
    detail: "Hospitality student: saved draft, reviews, quotation, accepted and completed applications; two placements.",
  },
  {
    id: "00000000-0000-0000-0000-00000000aa01",
    label: "Rizky Pratama",
    detail: "Computer science student: new application, portfolio feedback and a saved draft to resume.",
  },
];

export default function DevLoginPage() {
  if (!isE2EMode()) redirect("/");
  return (
    <div className="mx-auto max-w-xl space-y-4 py-10">
      <p className="eyebrow">Local dev only</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Enter as…
      </h1>
      <ul className="space-y-3">
        {PRESETS.map((p) => (
          <li key={p.id} className="surface-card p-5">
            <p className="font-semibold text-foreground">{p.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{p.detail}</p>
            <a href={`/dev/enter?as=${p.id}`} className="btn btn-primary btn-sm mt-3">
              Enter as {p.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const dynamic = "force-dynamic";
