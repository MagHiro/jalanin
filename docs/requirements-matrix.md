# Requirements Matrix — Jalanin Internship Platform (PRD v0.4)

Current audit evidence and release qualification: `docs/production-audit-2026-10-19.md`.
APP-07/11/12/16, D10/D15/D17, ADM-JOB-07, ADM-APP-07, NOT-03 and AUTH-04
received transaction/validation/recovery hardening with focused regressions.
Historical Verified labels below remain repository-level evidence only.

Status values: `Pending` | `In Progress` | `Implemented` | `Verified` | `Blocked`.

Homepage photographic hero (WEB/NFR-06): **Implemented**. Local workplace photograph replaces hero diagram; responsive crop, accessible alt text, priority loading and original CTA retained. Lint/typecheck pass; six public browser checks pass, including loaded-image and 320/375/768/1440px overflow checks.

Placement/discovery refinement (JOB/placement/NFR-06): **Implemented**. Student placement cards and expandable details, focused empty state, public directory masthead/cards, internship detail sections and apply panel. Existing filters, ownership queries, statuses and apply URLs preserved. Typecheck/lint pass; final public-design + admin-lifecycle run passed 10/10 after an initial failed run. Browser measurements show 0px overflow on all three routes at 375/768/1440px.

Student profile and dashboard application presentation (ADM/APP/NFR-06): **Implemented**. Profile summary strip, application cards, account reference disclosure, placement empty state; student application opportunity masthead, compact submission fields and connected progress column. Existing services, ownership checks and edit controls retained. Typecheck/lint pass; four lifecycle and one student workspace check pass. Admin workspace check timed out on the internship publication select. Both populated detail screens inspected with 0px overflow at 375/768/1440px.

Admin application record presentation (ADM-APP-03–13/NFR-06): **Implemented**. Applicant masthead, review highlights, scannable submitted snapshot, private document rows and connected audit timeline with a dedicated action column. Existing transition controls, quotations, revision history and authorization retained. Lint/typecheck and four admin lifecycle checks passed; populated screenshot inspected and no horizontal overflow measured at 375/768/1440px.

Shared input refinement (APP/NFR-06): **Implemented**. Consistent input spacing and value weight, contained date-picker triggers, stacked narrow date pairs and persistent accessible upload guidance. Lint/typecheck and four editor/browser tests pass; date alignment verified by browser geometry. Application journey confirmation assertion remains failing; see `docs/design/fieldnotes-verification.md`.

Internship editor and workspace sidebar refinement (2026-10-19, ADM-JOB/NFR-06): **Implemented**. Create/edit share numbered essentials, dates, role content and publishing sections with anchor navigation and field guidance. Admin/student navigation, shortcuts and logout share aligned icon columns and typography, including accessible collapsed actions. Existing form payloads and server validation retained. Lint/typecheck and six targeted workspace E2E checks passed; evidence in `docs/design/fieldnotes-verification.md`.

Fieldnotes product-wide presentation (2026-10-19, WEB/JOB/AUTH/APP/ADM/NFR-06): **Implemented; checks completed with browser-run qualification**. New editorial public compositions, unified student/admin surface hierarchy, original path SVG, application section navigation, shared borderless controls, searchable discovery selects, calendar keyboard navigation, responsive layouts and scoped GSAP enhancement. Existing services, DB schemas, authz, validation, lifecycle and uploads retained. `design.md` replaces prior visual guidance. Final lint/typecheck/build pass; 179 unit/integration tests pass on isolated local PostgreSQL. Full browser rerun passed 61/63; remaining workspace assertions and a select reopening bug were fixed, then targeted workspace runs passed (2/2 and final 6/6). The full suite was not rerun after final fixes. Responsive and visual evidence, plus shared-CSS implementation qualifications, are recorded in `docs/design/fieldnotes-verification.md`; historical design entries below are superseded for visual direction.

Admin mutation error handling (2026-10-19, NFR-07 / NFR-12 / ADM-JOB / ADM-APP / D17): **Implemented**. All admin mutation API handlers expose only `DomainError` business failures or Zod validation as 400, preserve auth 401/403, and log unexpected failures with an incident ID and generic 503 response. UUID paths, JSON parsing and action bodies/statuses are validated; expected application-transition throws use `DomainError`. Focused route/service/workflow/validation/auth unit suites pass (98 tests), including incident correlation, malformed JSON, invalid IDs/statuses, null action bodies and revision validation. Existing integration/E2E contracts retained; integration/E2E not rerun for this follow-up.

Admin inbox pagination (2026-10-19, COM-04 / D08): **Implemented**. Contacts and notifications use shared query-preserving server pagination (50/page), total counts and stable created-at/ID ordering; notification counts respect unread filtering and mark-read retains the current query. Page/action admin guards preserved. Typecheck/lint pass; localhost:3101 E2E-session route smoke passes for both lists, page 2/back links, unread/query retention and invalid-page fallback; anonymous admin access redirects to login.

Application error/draft concurrency follow-up (2026-10-19, APP-01…16): **Implemented**. Application error classification now requires explicit `DomainError` for business failures (or Zod validation); legacy plain-error message matching removed. Draft saves reject a submitted winner after a lost insert race. Stateful service-mock regressions assert transactional row locking, no overwrite when submission wins the lock, editable-draft saves, and draft/submitted insert-race winners. Focused application boundary/route/service and admin-service unit suites pass (51 tests); concurrency simulation is unit-level, not a PostgreSQL contention test.

UI audit follow-up (2026-10-19, NFR-06 / APP / ADM / D11): **Implemented; targeted Chromium verification passed**. Native modal confirmation explicitly wraps Tab/Shift+Tab, starts on Cancel, restores focus and blocks dismissal while busy; busy focus moves to the dialog when its buttons become disabled. Contact submission retains its form reference across delayed responses; placement mutations settle busy state and announce success. Admin application lifecycle highlights use recorded events rather than ordinal inference; student quotation copy distinguishes queued email from delivery. Detail values wrap, admin placements use shared query-preserving pagination, and admin/dashboard/apply families reuse skeleton loading boundaries. The public opportunities loading boundary was removed to preserve draft-slug HTTP 404 and usable no-JavaScript directory HTML. Approved `design.md` direction retained. Browser evidence identified the unrelated contact-test alert as Next's empty route announcer; assertions now scope application errors to `main`. `tests/e2e/ui-audit.spec.ts` passes independently with its own student profile fixture (2/2); accessibility, public-design, journeys and seven-width viewport QA passed (50/50). Fresh 375px directory loads with motion enabled/reduced had matching server/browser input markup and no console errors; the earlier empty-style hydration warning did not reproduce, and its historical cause is unconfirmed. Verification used localhost:3101 and the isolated audit database. Existing service/DB/authz/state behavior retained.

Non-hero reference pass (2026-10-13): **Implemented**. Section-specific Mobbin previews mapped to intro, featured/directory rows, process, About, Contact, footer, detail, authentication/recovery, application form and legal navigation in `docs/design/section-reference-map.md`. Hero and workspace routes excluded. Existing backend, DB, validation, authz and state services retained; application styling scoped to public apply page.

Public width follow-up (2026-10-13): shared 1440px maximum for navigation, all main sections and both footer sections; responsive hero image sizes updated. Public 404/error fallbacks receive direction-G presentation through public-only selectors. Desktop boundary coverage added to `tests/e2e/public-design.spec.ts`; admin/dashboard excluded.

Public direction G (2026-10-13, WEB/JOB/AUTH/APP presentation): **Implemented**. User-selected Wix Learn photographic direction applied to public landing/navigation/footer, directory/detail, auth/recovery, application heading and legal presentation. Typography/theme retained, workspace routes excluded. Lint/typecheck/build pass; seven-width browser coverage and public accessibility/motion/no-JS checks recorded in `docs/design/public-direction-g.md`. Existing backend/DB/authz/validation/state coverage applies; authenticated mutation and hosted integration checks not repeated in this visual revision.

Hero-only editorial collage (WEB-02 / responsive hero, 2026-10-12): **Verified**. User-approved editorial collage implemented in `src/app/page.tsx` with landing-scoped styles in `src/app/globals.css`; Google Sans Flex and exact primary retained. Typecheck/lint pass; Chromium confirms hero fits at 320/375/768/1024/1440px with reduced motion, clear destination caption, and working directory/How-It-Works CTAs. Existing backend, database, authorization, validation and state coverage applies unchanged. See `docs/design/decision-log.md` for observed Mobbin sources and `docs/design/screen-audit.md` for the separate contact-section overflow at 320px. No new unit/integration behavior introduced.
Verification: U=unit, I=integration, E=e2e, M=manual. Updated as work lands.

Student application presentation data (2026-10-12, D04/D10/D11/D12 / APP-01…16): **Implemented**. `pnpm db:seed:demo` creates two fictional student personas, nine applications (two drafts), seven private readable CV PDFs, three SGD quotations, two placements, consent records, re-review history, notifications and dated lifecycle/audit events. Local-only transaction, canonical transition validation, separate `admin:grant` provisioning and conflict-safe inserts preserve demo edits on repeat runs. Fresh isolated PostgreSQL migrations/seed and repeated demo runs succeed; fixture queries confirm every submitted application has a CV and repeats retain seven documents, three quotations, two placements and twenty status events. Lint/typecheck and all 42 unit/integration tests pass against the isolated local database. Populated browser/e2e demo review remains pending. Setup and scenario details: `docs/demo-data.md`.

Presentation workflow check (2026-10-12, APP-01…16 / D10): fixed partial browser draft saves (blank fields omitted; consent validated on submission) and refreshed the router after submission so editing uses current application state. Added `tests/e2e/application-form.spec.ts` covering partial draft → new session/resume → missing-CV validation → upload/submit → submitted edit/re-review. Local isolated PostgreSQL migrations and all 42 unit/integration checks pass; 23 Chromium workflow/accessibility/workspace checks pass. Authentication uses the test session seam and documents use local storage; hosted Supabase sign-in/reset, hosted storage, and actual email delivery are not verified by this run.

## Supabase removal → standalone PostgreSQL + native auth + filesystem (2026-10-19)

| ID | Requirement | Implementation | Verify | Status |
|---|---|---|---|---|
| D20 | Standalone PG + native auth + filesystem (was: Supabase PG + Auth + Storage) | `db/migrations/0005_remove_rls.sql` (zero policies) + `0006_native_auth.sql` (`users`/`user_sessions`/`user_tokens`); bcrypt sessions via `/api/auth/*`; filesystem `DocumentStore` under `PRIVATE_UPLOAD_DIR`/`PUBLIC_UPLOAD_DIR`; `Dockerfile` + `compose.prod.yml` (app + postgres + migrate + volumes); `docs/migration-cutover.md` + `docs/runbook.md` | U/I/E/M | Implemented |
| D14 | Edit lock at Quotation Sent+ | Server + application-level authz + UI rejection (RLS retired) | U/E | Verified |
| D19 | Single admin role, privileged provisioning | `admin_users` + `pnpm admin:grant <email-or-uuid>`; server-only enforcement | I/E | Verified |

Verification: typecheck + lint clean; 179/179 unit+integration pass against
live PostgreSQL; production build passes; Docker image builds and the full
`compose.prod.yml` stack verified healthy (migrate → app + postgres,
signup/login/dashboard, CV upload → admin 200 / student 403 / anon 401,
app rebuild + postgres restart preserved data and files); data + storage
migration scripts validated against fixtures with counts + FK + size checks;
backup (`pg_dump`) + restore into scratch DB verified. Live production data
has NOT been migrated — see `docs/migration-cutover.md` §7 blockers.

Docker build fix (2026-10-20): `src/lib/db/client.ts` no longer throws at
import time when `DATABASE_URL` is absent — it falls back to a placeholder
connection string (real queries still fail loudly), because Next.js imports
every route module during `Collecting page data` even for dynamic routes.
`src/app/sitemap.ts` is now `force-dynamic`. Verified: `pnpm build` exits 0
with `DATABASE_URL` unset and no `.env` files present (Docker builder
condition); `compose.prod.yml` forwards only `NEXT_PUBLIC_*` as build args,
server secrets stay runtime-only via `env_file`.

## Decisions D01–D20 (all Confirmed)

| ID | Requirement | Implementation | Acceptance | Verify | Status |
|---|---|---|---|---|---|
| D01 | Subdomain hosting, legacy site untouched | Vercel deploy + `docs/deployment.md` DNS; canonical/sitemap scoped | Subdomain serves app; legacy unaffected | M | Implemented |
| D02 | Quote reply-by-email, admin records outcome | No accept/reject buttons; `record-acceptance` admin action + audit | Status + actor + timestamp + ref recorded | E | Verified |
| D03 | Quote email: SGD amount + terms; notes private | `quotations.notes_student` vs `notes_internal`; template check | Email contains amount/currency/terms, no internal notes | U/E | Verified |
| D04 | Full student dashboard (history, no payments) | `src/app/(student)/dashboard/...` | Own drafts/apps/placements visible; no payment UI | E | Verified |
| D05/D09 | One app per student per internship (DB unique) | `UNIQUE(applicant_user_id, internship_id)` + tx submit | Concurrent duplicate attempts → 1 row | I/E | Verified |
| D06 | Real DB-driven admin metrics | `getAdminOverview` aggregates | Counters match DB; link to filtered lists | E | Verified |
| D07 | English only | EN copy/validation/emails; no i18n CMS | No translation UI | M | Implemented |
| D08 | Admin email + dashboard alert on new app | outbox row + `admin_notifications` row, same tx, dedupe by `event_key` | Both present; retry idempotent | E | Verified |
| D10 | Submitted edits → re-review + block progression | `revision`/`needs_re_review`/`reviewed_revision`; transition guard | Flag visible; quote/progress blocked until ack | U/E | Verified |
| D11 | Manual placements, student sees own only | `placements` admin CRUD; student scoped read | Placement appears for linked student only | E | Verified |
| D12 | SGD-only quotations | `CHECK(currency='SGD')`, `amount_minor INT>0`, integer math | Non-SGD rejected server-side | U/I | Verified |
| D13 | No online payment | No gateway/checkout/invoice code | No payment UI/endpoints | M | Implemented |
| D14 | Edit lock at Quotation Sent+ | Server + RLS + UI rejection | Write attempts fail, no audit edit row | U/E | Verified |
| D15 | Admin-only reopen of Rejected | `reopen-rejected` admin action; student writes rejected | Same ID retained, audit entry | E | Verified |
| D16 | Manual Completed only | `mark-completed` admin action; no triggers/cron | Dates/placements don't auto-complete | E | Verified |
| D17 | Placement lifecycle Preparing→…/Cancelled | `src/lib/workflow/placements.ts` + admin UI | Invalid transitions rejected + audited | U/E | Verified |
| D18 | Admin publish control + optional deadline | `publication_status` + `application_deadline NULL`; no auto-toggle | Deadline passes → still published | E | Verified |
| D19 | Single admin role, privileged provisioning | `admin_users` + `pnpm admin:grant`; server/RLS enforcement | Client role tampering ineffective | I/E | Verified |
| D20 | Supabase PG + Auth + Storage | Adapters + migrations + RLS + private bucket | Password-reset flow works; docs private | I/E | Verified |

## Functional requirements (PRD §7)

| ID | Requirement | Implementation | Verify | Status |
|---|---|---|---|---|
| WEB-01…08 | Landing, hero CTA, How-It-Works, featured, about+contact, responsive, legal+SEO, states | `src/app/(public)/...`, layouts | E/M | Verified |
| WEB-NAV (WEB-06/07 refinement) | Editorial public navigation with supplied logo/favicon, responsive menu and existing account links | `SiteHeader`, `PublicNavigation`, root metadata and single `public/favicon.ico` asset (no conflicting App Router icon route); existing server session/admin checks | Browser automation: seven widths 320–1440px, menu open/Escape/link dismissal, active directory route; `tests/e2e/favicon.spec.ts` checks favicon HTTP response and shared metadata across public/auth pages; lint/typecheck | Verified |
| WEB-NAV-FLOAT | User-requested floating rounded header and grouped dropdown pattern | Shared public-header CSS and Explore disclosure: bounded surface, sticky inset, grouped links, photo CTA, mobile expansion; Google Sans Flex/theme retained | Browser checks at seven widths: inset, overflow/overlap, opening, Escape, selection; lint/typecheck/build | Verified |
| WEB-NAV-WIDTH | Borderless, wider floating header refinement | 1600px maximum shell, full-width inner navigation, no shell/dropdown outline | Browser geometry at 375/1024/1440/1920px: border, width, overflow | Verified |
| JOB-01…11 | Directory search/filter/sort/page; cards; detail; quote messaging; 404; publish+deadline; SEO | `features/internships`, `app/(public)/opportunities` | E | Verified |
| AUTH-01…08 | Register/login/logout/forgot/reset; apply gate; role isolation; rate limits; safe sessions | `app/(auth)`, `lib/auth` | E | Verified |
| APP-01…16 | Form fields, CV upload, draft/resume, validation, consent, atomic submit, idempotency, uniqueness, unpublished-guard, post-submit edit+lock | `features/applications`, `app/(student)/apply` | U/I/E | Verified |
| ADM-JOB-01…08 | Admin listing CRUD/publish/validate/slug/audit | `app/admin/internships` | E | Verified |
| ADM-APP-01…13 | Admin app directory, students, review+CV, statuses, quote record, concurrency guard, emails, audit, state-aware UI, notes separation, manual accept/reject, signed URLs | `app/admin/applications`, `features/quotations` | U/I/E | Verified |
| §7.7 | State machine + outbox idempotency | `lib/workflow/transitions.ts` | U | Verified |
| §7.8 | Scoped admin dashboard (real counts only) | `app/admin/page.tsx` | E | Verified |
| COM-01…05, NOT-01…05 | Contact + Turnstile + storage/notify; notification matrix | `features/contact`, `lib/email` | E | Verified |

## Design system and UX refinement (October 2026)

| Scope | Implementation | Verification | Status |
|---|---|---|---|
| Standalone editorial workspaces (D04/D06, 2026-10-12) | `RouteFrame`, `WorkspaceShell`, bespoke spacious admin/student overviews, local Google Sans Flex, scoped nested input/UI styling and reduced-motion-aware GSAP route reveal; existing DB/authz/validation/state services | Authenticated Chromium 2/2 targeted tests: seven overview widths, mobile keyboard dismissal/focus restoration, nested route mobile/desktop smoke, text/textarea/select/checkbox interaction. Screenshots reviewed. Existing unit/integration workflow coverage applies; populated detail and full mutation visual-state audit remains pending. | Implemented |
| Workspace build gate | Standalone layouts and scoped component styling | `pnpm lint`, `pnpm typecheck`, `pnpm build` pass (39/39 static pages generated). | Verified |
| Editorial & refined visual refresh (2026-10-12) | `design.md` v2; locally hosted Google Sans Flex; warm semantic tokens; new landing composition, public header/footer, directory/detail and opportunity cards; split auth layout; Lucide workspace/header/empty-state icons | Typecheck and lint pass; Vitest 42 reported passing (DB suite takes its no-DATABASE_URL skip path); production build pass; Chromium 30 route/viewport checks at 375/768/1440px without overflow, directory GET filters and password visibility interaction pass. Authenticated browser workflows not re-run in this pass. | Implemented |
| Mobbin-informed direction and system | `docs/design/mobbin-research.md` (two live passes), `incident-io-reference-audit.md` (incident.io collection, observed vs inferred), `design-directions.md` (Clear Horizons finalized, superseded Oct 2026 by indigo system), `design-system.md` v2.0; OKLCH semantic CSS/Tailwind tokens + `ui/` primitives + dark admin rail; gsap motion; all routes redesigned | Typecheck, lint, 37 unit tests, 20/20 E2E + 28/28 viewport sweep, production build green | Verified |
| Responsive/accessibility foundation | Responsive layouts (table→card collapse, sticky→fixed CTA), 44px targets, visible focus, reduced motion/transparency fallbacks, computed AA contrast (text 5.7–15.5, badges 7.9–11.9) | 9/9 API E2E pass; 11 browser tests blocked by missing container libs (no sudo); SSR assertion sweep passes instead | Verified* |

| Authenticated SaaS workspace overhaul (2026-10-19) | Responsive indigo operations shell, searchable keyboard navigation, GSAP reduced-motion-aware entrance, richer forms and select/calendar controls, real application status visualizations, accessible record menus and actionable no-data views across admin/student routes. Authorized services, mutations and DB rules unchanged. | GitHub Actions: TypeScript, lint, unit, Next build and Playwright; screenshots and on-device review remain staging sign-off requirements. Test-only session collision corrected. | Implemented; full browser CI and staging sign-off pending |\n
Screen-family visual coverage (12 Oct 2026): **all** route families received bespoke Clear Horizons treatment — public landing/listing/detail/footer/legal/404, auth login/register/forgot/reset, apply + application form, student shell/overview/applications/detail/placements, admin shell/overview/applications/detail/internships/students/placements/contacts/notifications/forms. E2E copy contracts preserved verbatim. *Rendered browser screenshots + axe pass remain a CI follow-up where Chromium libs are installable.

## Audit qualification (2026-10-12)

The `Verified` labels above refer to repository/CI tests and prior implementation
checks; they do **not** establish production security certification or live
Supabase Auth/Storage/email integration. See `docs/security-and-scope-audit.md`
for source-based findings, remaining operational tests and release blockers.
Basic analytics now persist in PostgreSQL, and admin lists support active
sorting/pagination. The configured CI development-session test seam is not
an end-to-end hosted Supabase Auth test.

## Open blockers → `docs/open-decisions.md`

B01 quote expiry · B02 payment tracking · B03 reopen target · B04 deadline
enforcement · B05 file policy · B06 terms/tax/revision · B07 legal/retention ·
B08 ops/sender/backups · B09 commercial approval · B10 launch content.
All `Blocked` until product-owner sign-off; interim rules documented, no
placeholder behavior shipped as confirmed.


## Production hardening follow-up (2026-10-18)

- NOT-03 / operational email: scheduled GET/POST dispatch accepts only a constant-time compared bearer secret; provider exceptions are logged and retried as ordinary outbox failures. Actual hosted SMTP and scheduled invocation require staging verification.
- WEB-08 / auth error UX: error fallback can show a safe support reference; sign-up confirmation guidance and honest sign-out failure states improved. Real hosted Supabase confirmation and sign-out still require staging validation.
- APP-* / document interaction: client-side file size/type checks and single-flight submission improve perceived reliability; server-side policy and workflow remain authoritative.
- NFR (performance): shared workspace no longer initializes GSAP on each route; admin navigation uses one indexed count rather than full overview aggregates. Verify page-bundle and latency impact in deployment telemetry.

- NFR (bundle performance): public motion and form reveal now use lightweight browser APIs instead of GSAP imports; accessibility/reduced-motion behavior must be verified by CI/browser testing.

## Admin/student CRM-list presentation pass (2026-10-19)

UI-only refinement of existing ADM-APP, ADM-JOB, ADM-STU, D11 placement, COM-04 contact, NOT-03 alert, and student APP list/detail capabilities. Replaced multiple card grids with scannable, paginated/sortable/filterable list layouts where the existing service supports those operations; contact sender/subject search is new read-only query composition on the existing table under `requireAdmin`. Re-review acknowledgement, lifecycle status mutations, quotation constraints, ownership checks, stored read state and server validations remain unchanged. Existing unit and Playwright workflows plus new CRM view-navigation/typography assertions are release checks. No unsupported lead CRM/marketing automation, export, bulk mutation, RLS bypass or database migration.


### Authenticated workspace presentation — 2026-10-19

- **Temporary user-directed quotation override:** Quotation Sent is stage-only. Admin quotation amount/terms/internal-note entry and quotation creation are disabled; transition API no longer accepts quotation data into the service. Canonical workflow no longer requires a quote row, but admin authorization, revision acknowledgement, edit locks, concurrency, audit and outbox status notifications remain unchanged. Historical quote rows are preserved; no schema migration or placeholder monetary values. This temporarily supersedes quote-entry requirements (D03/ADM-APP quotation capture) until re-enabled. Unit and lifecycle regression coverage updated; full DB/browser verification pending.

- **Minimal admin overview:** Replaced the oversized dark hero and decorative orbit with a compact white section, concise Overview heading, restrained review count and responsive divider. Existing queue counts, links and creation actions preserved; no backend/authz/state changes. Regression assertions in `tests/e2e/workspaces.spec.ts`; browser visual verification pending.

- **Header action simplification:** Removed the shared admin creation/student exploration CTA from the workspace header on all routes and widths. Page-level actions and command-palette shortcuts remain available; backend/authz unchanged. Regression assertions added to `tests/e2e/workspaces.spec.ts` for both roles.
- Shared admin/student navigation and mobile shortcuts, accessible calendar controls, searchable dropdown improvements, contextual empty-state guidance, richer profile detail and truthful lifecycle counts; presentation-layer implementation, preserving existing server-side authorization, validation and workflows.
- QA: GitHub CI (lint, typecheck, tests, build, Playwright) triggered by commits to main. Populated-record visual signoff remains an explicit release check. Design notes: docs/design/workspace-overhaul-2026-10-19.md.

### Authenticated overview design update — 2026-10-19

- **Student dashboard / application lifecycle:** Existing server-scoped applications, drafts and placements power a journey-specific overview with an accurate prioritized next action, status badges and linked milestone summaries. No lifecycle or authorization semantics changed. UI regression: `tests/e2e/workspaces.spec.ts`, `tests/e2e/workspace-replica.spec.ts`.
- **Admin overview / operations visibility:** Existing authorized aggregates, audit feed, recent submissions and unread notifications power the review-priority overview and pipeline stage distribution. No new metrics, schema, permissions or transitions. UI regression: `tests/e2e/workspaces.spec.ts`, `tests/e2e/workspace-replica.spec.ts`.

### Admin overview lower-panel refinement — 2026-10-20

- **Activity trail:** Read-only formatting of persisted audit-event action codes, with validated links to existing record detail routes. No actor attribution or status mutation is inferred.
- **Placement summary:** Distinct zero/nonzero compositions using existing authorized placement counts and the existing create route.
- **Verification:** `tests/unit/admin-activity.test.ts` and `tests/e2e/workspace-replica.spec.ts` cover event labels, safe record links, empty-state panel structure and mobile containment.

## Admin & student workspace improvements (2026-10-20)

Focused usability pass — no new lifecycle statuses, payments, portals, chat, or analytics. Existing workflows, authorization, and visual identity preserved.

- **Nav fix:** `/contact` links in the student dashboard, student applications list, and admin contact empty state pointed to a nonexistent route; all now use the existing homepage contact section (`/#contact`). No new support module.
- **S1 contextual status guidance:** new pure content module `src/lib/workflow/status-guidance.ts` + `ApplicationStatusGuidance` panel on `/dashboard/applications/[id]` (status / next step / your action for every lifecycle state + drafts); re-review framed as pending admin review, never a student action. Quotation Sent explains queued-not-delivered + reply-by-email. Compact per-record action hints on `/dashboard`.
- **S2 existing CV visibility:** `/apply/[internshipId]` loads owner-scoped CV metadata (filename + size + upload date; never storage paths); the form labels the action `Replace CV`, distinguishes current vs newly selected files, keeps the original when nothing is chosen, and notes re-review on submitted replacements. PDF/DOCX + 5MB validation, revision history, authz, and no-student-download policy unchanged.
- **A1 searchable placement selection:** `StudentPlacementPicker` replaces manual UUID entry (debounced admin-only search by name/email, max 8 results; eligible submitted applications per student; hidden `studentUserId`/`applicationId` fields keep the existing creation contract). New admin-only endpoints `GET /api/admin/students/search` and `GET /api/admin/students/[id]/applications`; placement service ownership validation unchanged. Preselected shortcut from student profiles (`/admin/placements/new?student=`).
- **A2 waiting-time indicators:** `src/lib/workflow/waiting-time.ts` derives waits from committed status events (submission time for initial New; neutral fallback, never invented). `/admin/applications` shows a Waiting column (desktop + mobile) with an `Oldest waiting` sort; `/admin` shows a compact longest-waiting summary. Pagination, filters, and existing sorts preserved.
- **A3 contact handling:** migration `0007_contact_handling.sql` adds `handling_status` (Open/Handled, default Open) + `handled_at`/`handled_by` with index; history preserved. `listAdminContacts`/`setContactHandling` (admin-only, audited) power All/Open/Handled views with badges on desktop + mobile and Mark-as-handled/Reopen actions. Reply-by-mailto unchanged.
- **Verification:** lint + typecheck clean; 226/226 unit tests pass (43 new across `waiting-time`, `status-guidance`, `placement-search`, `contact-handling`, `workspace-routes`, `cv-and-guidance`, plus updated `apply-page` CV-metadata coverage); `vitest.config.ts` now includes `*.test.tsx`. Production build passes. DB-backed integration/E2E not run in this environment (no database credentials); migration 0007 must be applied via `pnpm db:migrate`.
