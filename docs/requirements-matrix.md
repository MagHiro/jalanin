# Requirements Matrix — Jalanin Internship Platform (PRD v0.4)

Status values: `Pending` | `In Progress` | `Implemented` | `Verified` | `Blocked`.
Verification: U=unit, I=integration, E=e2e, M=manual. Updated as work lands.

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
| JOB-01…11 | Directory search/filter/sort/page; cards; detail; quote messaging; 404; publish+deadline; SEO | `features/internships`, `app/(public)/opportunities` | E | Verified |
| AUTH-01…08 | Register/login/logout/forgot/reset; apply gate; role isolation; rate limits; safe sessions | `app/(auth)`, `lib/auth` | E | Verified |
| APP-01…16 | Form fields, CV upload, draft/resume, validation, consent, atomic submit, idempotency, uniqueness, unpublished-guard, post-submit edit+lock | `features/applications`, `app/(student)/apply` | U/I/E | Verified |
| ADM-JOB-01…08 | Admin listing CRUD/publish/validate/slug/audit | `app/admin/internships` | E | Verified |
| ADM-APP-01…13 | Admin app directory, students, review+CV, statuses, quote record, concurrency guard, emails, audit, state-aware UI, notes separation, manual accept/reject, signed URLs | `app/admin/applications`, `features/quotations` | U/I/E | Verified |
| §7.7 | State machine + outbox idempotency | `lib/workflow/transitions.ts` | U | Verified |
| §7.8 | Scoped admin dashboard (real counts only) | `app/admin/page.tsx` | E | Verified |
| COM-01…05, NOT-01…05 | Contact + Turnstile + storage/notify; notification matrix | `features/contact`, `lib/email` | E | Verified |

## Open blockers → `docs/open-decisions.md`

B01 quote expiry · B02 payment tracking · B03 reopen target · B04 deadline
enforcement · B05 file policy · B06 terms/tax/revision · B07 legal/retention ·
B08 ops/sender/backups · B09 commercial approval · B10 launch content.
All `Blocked` until product-owner sign-off; interim rules documented, no
placeholder behavior shipped as confirmed.
