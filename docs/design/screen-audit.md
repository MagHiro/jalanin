# Screen Audit — route × state × viewport QA matrix

## Hero-only editorial collage verification (2026-10-12)

- Chromium: hero fits at 320/375/768/1024/1440px with reduced motion; guidance note does not intersect the destination caption. Screenshots captured under `/tmp/opencode/jalanin-hero-{width}.png`; 320px and 1024px images visually inspected (1440px initial image inspected and caption overlap corrected).
- Computed heading font resolves to the locally loaded Google Sans Flex. Original heading and both CTA destinations retained. Browser navigation verified to `/opportunities` and `#how-it-works`.
- `pnpm typecheck` and `pnpm lint` pass. This is a presentation-only change; existing backend/DB/authz/validation/state behavior is reused.
- Full-page 320px overflow observed outside the hero: contact section grid/form minimum width reaches 370px. Hero has no internal overflow; page-wide overflow absent at 375/768/1024/1440px. The earlier blanket zero-overflow entry below does not describe this current 320px result.

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
# Editorial refresh — 2026-10-12

Current source of truth: `design.md` v2 (user selected Editorial & refined).

- Bespoke re-layout: landing, public header/footer, directory, opportunity cards, detail presentation, login and signup.
- Shared refresh: Google Sans Flex, warm surface tokens, pills, workspace headers, navigation SVG icons, empty-state SVG icons. Other routes inherit these primitives; their individual workflows were not exhaustively re-audited.
- Chromium production-browser smoke: `/`, `/opportunities`, `/opportunities/software-engineering-kuala-lumpur`, login, signup, forgot/reset password, privacy, terms, and 404 at **375/768/1440px**. All 30 checks passed without document overflow.
- GET directory filter submission and password visibility toggle passed. Font loading confirmed in computed styles; mobile landing screenshot visually inspected with reduced motion enabled.
- Review screenshots: `/tmp/opencode/jalanin-final-{375,768,1440}.png` (session-local artifacts).
- Typecheck, lint, production build pass. Vitest reports 42 passing; database suite follows its skip path when `DATABASE_URL` is unset. Full authenticated E2E and full interaction/accessibility audits remain unverified for this refresh.
# Public header QA — 12 Oct 2026

Borderless/wider refinement: browser geometry passed at 375, 1024, 1440 and 1920px; shell has a 0px border, retains outer gutters, reaches 1600px maximum and introduces no horizontal overflow.

Floating/dropdown follow-up verified at 320, 375, 430, 768, 1024, 1280 and 1440px. Browser checks passed for floating inset, no overflow or brand/navigation overlap, desktop Explore/mobile disclosure opening, Escape and link dismissal. Screenshots: `/tmp/opencode/floating-final-{width}.png`; 1024px expanded panel visually reviewed. Latest wide supplied logo uses intrinsic image metadata. Lint, typecheck and production build passed.

Production verification: `pnpm build` passed, including compilation, type/lint validation and generation of all 39 static pages.

Public-header-only redesign using supplied logo/favicon and existing local Google Sans Flex. Browser automation passed at 320, 375, 430, 768, 1024, 1280 and 1440px: no horizontal overflow; mobile disclosure opens, Escape closes, selecting About closes; directory link has `aria-current=page`. Desktop 1280px and mobile 375px screenshots reviewed (`/tmp/opencode/header-1280.png`, `/tmp/opencode/header-375.png`, temporary local evidence). Typecheck and lint passed. Authenticated role visibility retains server-resolved booleans; authenticated sessions were not re-exercised in this targeted QA.
# Standalone workspace QA — 2026-10-12

- Final static checks: `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass; production build generated 39/39 static pages.
- New authenticated `tests/e2e/workspaces.spec.ts`: **2/2 pass** against isolated local E2E server and existing local PostgreSQL, without truncating user data. Admin identity selected from existing active local admin; student uses test-only session.
- Both overview routes: 320/375/430/768/1024/1280/1440px, exactly one main landmark, no public header, no document overflow, reduced-motion rendering, mobile dialog open/Escape/focus restoration. Non-reduced navigation and active application link also verified; no page errors.
- Nested route smoke at 375/1440px: student applications/placements; admin internships/new, students, placements/new, contacts and notifications. No public chrome or document overflow. Admin student toolbar additionally checked at 320px.
- Admin form text entry, textarea entry, select changes and checkbox operation pass. Screenshots `/tmp/opencode/workspace-{admin,student}-{width}.png` and `workspace-admin-form.png`; desktop admin overview, desktop form, and mobile student overview visually reviewed.
- The local data slice is empty for applications/placements/audit. Populated details, quotation/CV states, destructive confirmation and complete mutation workflows are not newly browser-audited in this presentation pass; they inherit scoped components and existing backend coverage. Exhaustive state certification is pending.
# 2026-10-13 public direction G update

Follow-up: non-hero sections now mapped individually to inspected Mobbin previews in `section-reference-map.md`; directory uses role rows, process uses four steps, About is centered, contact uses underlined inputs, authentication puts the form first, legal uses document navigation, and public application field sections use a label column. Hero retained.

Public landing, directory/detail, auth/recovery, application intro and legal surfaces refreshed; `/admin` and `/dashboard` excluded. Seven-width public route browser sweep, keyboard flow, reduced-motion/no-JS and route interruption coverage: see [direction G evidence](public-direction-g.md). Authenticated application form states retain prior coverage and were not visually re-audited in this pass.
