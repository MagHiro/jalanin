# Component Catalog — Jalanin (incident.io-informed, indigo identity)

Source of truth: root `design.md`. Reference evidence: `docs/design/incident-io-reference-audit.md`.
Primary brand: `oklch(0.27 0.09 265.54)` (`--jalanin-900`), ramp 50–950. Never copy incident.io brand assets.

## Tokens (`src/app/globals.css` → `tailwind.config.ts`)

| Token | Value / role |
|---|---|
| `--jalanin-50…950` | OKLCH indigo ramp; 900 is the exact mandatory base |
| `--background` | near-white indigo-tinted canvas |
| `--surface` / `--muted` | white cards / tinted subtle surfaces |
| `--foreground` / `--muted-foreground` | 950 ink / muted slate-indigo body text |
| `--border` / `--ring` | hairline borders / focus ring (600) |
| `--primary` (900) / hover (800) / foreground (white) | primary actions, active nav, selection |
| `--success / --warning / --error / --info` | semantic pairs, always with text labels |
| Radius | 10px controls, 16px cards, 24px sections, 999 pills |
| Shadows | one subtle elevation + one modal elevation; hairlines preferred |

## Primitives (`src/components/ui/`)

| Component | Usage | States covered |
|---|---|---|
| `PageHeader` | eyebrow + icon tile + title + description + actions; one reading order everywhere | normal, long-title wrap, mobile stacked actions |
| `StatusBadge` | dot + text via `statusBadgeClass`; application + placement vocabularies | all statuses, never color-only |
| `StatusTimeline` | committed events chronological; drafts show awaiting-submission | empty, many-event, long-reason wrap |
| `EmptyState` | dashed calm surface + copy + one next action | all lists, zero-data overviews |
| `ActiveFilterChips` | URL-driven removable chips + Clear all | 1..n chips, 320px wrap |
| `InternshipCard` | category pill + location + title + dates + View details | featured + directory, no prices |
| `MetricCard` | big tabular count + label link to filtered list (real DB counts only) | zero, large numbers, hover/focus |
| `Skeleton` | `Skeleton`, `TableSkeleton`, `CardSkeleton` for `loading.tsx` fallbacks | loading only, reduced-motion safe |
| `ConfirmDialog` | accessible confirm (Escape, focus restore, explicit buttons) replacing `window.confirm` | confirm/cancel, busy, long copy |
| `AdminNav` / `StudentNav` (client) | sidebar with icons, active state via pathname, unread badge, mobile drawer | expanded, collapsed (desktop icon rail where used), mobile drawer, keyboard |
| `Reveal` (`components/motion/reveal.tsx`) | GSAP entrance for hero/cards/step transitions only | reduced-motion off, unmount cleanup |

## Domain components

`ApplicationForm` (5 grouped sections, upload feedback, draft/submit, lock + re-review notes),
`AuthForm` (password visibility, loading, alert errors), `ContactForm` (Turnstile, sent state),
`TransitionControls` (reason + SGD quotation + state-aware buttons + confirm),
`ReopenControl`, `InternshipForm`, `PlacementForm`, `DocumentAccessList` (inline in detail pages).

## Rules

- Reuse tokens/components; no one-off styles. Status meanings stay distinguishable (never all-indigo).
- **Tailwind v3 constraint:** never use opacity modifiers (`/40`, `/95`) on
  `var()`-based theme colors, and never use `*-bg` token utilities — neither
  emits CSS. Use the plain-CSS semantic classes in `globals.css`
  (`.badge-rereview`, `.badge-published/draft/unpublished`,
  `.notification-unread`, `.revisions-panel`, `.quote-panel`,
  `.metric-card-alert`, `.overlay-dim`, `.mobile-cta-bar`, `.consent-panel`,
  `.rail-alert-card`, `.error-mark`) and verify with a compiled-CSS probe.
- Tables: flat header, row separators, server pagination; mobile → card transformation.
- Touch targets ≥44px where practical; visible `:focus-visible`; `prefers-reduced-motion` respected.
