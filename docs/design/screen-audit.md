# Screen Audit — route × state × viewport QA matrix

Legend: `✓` rendered + checked · `○` pending · `—` not applicable.
Viewports: 320 / 375 / 430 / 768 / 1024 / 1280 / 1440.
States per screen: normal · loading/skeleton · empty · filtered-zero · validation-error ·
server-error · success · forbidden · mobile-nav · keyboard/focus.

## Public

| Route | Normal | Loading | Empty | Zero-filter | Val-err | Server-err | Success | 404 | Mobile | Viewports | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` landing | ✓ E2E + shots | — | ✓ featured-empty | — | — | ○ | ✓ contact-sent | — | ✓ | ✓ 320–1440, zero overflow | copy contracts verbatim |
| `/opportunities` | ✓ E2E + shots | ✓ skeleton comp | ✓ | ✓ | — | ○ | — | — | ✓ | ✓ 320–1440, zero overflow | URL-driven filters + chips |
| `/opportunities/[slug]` | ✓ E2E | — | — | — | — | ○ | — | ✓ draft-404 | ✓ CTA bar | ○ | sticky Apply panel |
| `/privacy`, `/terms` | ✓ shots | — | — | — | — | — | — | — | ✓ | ✓ 320–1440 | DRAFT banners (B07) |
| `/not-found` (global) | ✓ boundary | — | — | — | — | — | — | ✓ | ✓ | ○ | no private leaks |

## Auth (`/auth/*`)

| Route | Normal | Loading | Val-err | Invalid-cred | Success | Token-bad | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|
| `login` | ✓ shots | ○ busy | ○ | ○ alert | ○ →next | — | ○ | headings/labels E2E-verified; Show/Hide, `?next=` preserved |
| `sign-up` | ○ | ○ busy | ○ | ○ | ○ | — | ○ | brand panel ≥lg, consent links |
| `forgot-password` | ○ | ○ | ○ | — | ○ check-email | — | ○ | no account-enumeration wording |
| `reset-password` | ○ | ○ | ○ | — | ○ | ○ expired | ○ | min-8, visibility toggle |

## Student (auth required; cross-user → 404)

| Route | Normal | Loading | Empty | Locked | Re-review | Forbidden | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|
| `/dashboard` | ○ | ○ | ○ | — | ○ flag | ○ anon→login | ○ | drafts + submitted + placements |
| `/dashboard/applications` | ○ | ○ | ○ | — | ○ | ○ | ○ | draft/submitted split |
| `/dashboard/applications/[id]` | ○ | ○ | — | ○ Quotation-Sent+ | ○ | ○ 404 other-user | ○ | timeline + quotation explainer |
| `/dashboard/placements` | ○ | ○ | ○ | — | — | ○ | ○ | admin-managed records only |
| `/apply/[internshipId]` | ○ | ○ | — | ○ locked banner | ○ info banner | ○ anon→login | ○ | draft/save/submit/retry/conflict |

## Admin (`requireAdmin`; non-admin → redirect/forbidden)

| Route | Normal | Loading | Empty | Filters/page | Actions | Audit | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|
| `/admin` overview | ○ | ○ | ○ zero-counts | — | ○ deep links | ○ activity | ○ | real counts only |
| `/admin/internships` | ○ | ○ | ○ | ○ | ○ new | — | ○ cards | publish/unpublish |
| `/admin/internships/new` | ○ | — | — | — | ○ create | ○ | ○ | validation |
| `/admin/internships/[id]/edit` | ○ | ○ | — | — | ○ save/publish | ○ | ○ | slug warning |
| `/admin/applications` | ○ | ○ | ○ | ○ + re-review | ○ | — | ○ cards | search/status/rereview/page |
| `/admin/applications/[id]` | ○ | ○ | — | — | ○ transitions/quote/reopen | ○ revisions+events | ○ | CV signed download |
| `/admin/students` | ○ | ○ | ○ | ○ search/page | — | — | ○ | basic profiles only |
| `/admin/students/[id]` | ○ | ○ | ○ | — | — | — | ○ | related apps/placements |
| `/admin/placements` | ○ | ○ | ○ | ○ | ○ new | — | ○ | lifecycle CRUD |
| `/admin/placements/new` | ○ | — | — | — | ○ create | — | ○ | starts Preparing |
| `/admin/placements/[id]/edit` | ○ | ○ | — | — | ○ transition | ○ | ○ | cancel/terminal rules |
| `/admin/contacts` | ○ | ○ | ○ | — | ○ mailto | — | ○ | stored inquiries |
| `/admin/notifications` | ○ | ○ | ○ | ○ unread-only | ○ mark-read | — | ○ | durable read state |

## QA runs (12 Oct 2026 — incident.io implementation run)

| Check | Result |
|---|---|
| `pnpm typecheck` | ✓ clean |
| `pnpm lint` | ✓ clean |
| `pnpm test` (vitest) | ✓ 37/37 |
| `pnpm build` | ✓ green, 37/37 static, shared JS 87.3 kB |
| `pnpm test:e2e` (rendered Chromium) | ✓ 20/20 journeys + 28/28 viewport sweep |
| Viewports 320/375/430/768/1024/1280/1440 | ✓ zero horizontal overflow, screenshots in `/tmp/opencode/qa-shots/` |
| Console errors | ✓ zero (one pre-existing Turnstile hydration warning fixed via `next/script`, DL-13) |
| Copy-contract strings | ✓ intact (`Internships across…`, `How It Works`, `Featured`, `About Jalanin`, `Contact us`, `Apply now`, filter placeholder/button) |
| Authz guards (SSR) | ✓ anon → `?next=` bounces; draft slug noindex 404 boundary; robots/sitemap public-only |
