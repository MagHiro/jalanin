# Production audit — 19 October 2026

## Baseline and scope

Started from clean `main` at `54625c2`, after confirming PR #2 merged.
PRD v0.4 D01–D20 and B01–B10 remain authoritative. No production deployment
or provider configuration was performed. Recommendation remains **NO-GO**
pending issue #3 and product approvals.

Source review covered all API handlers, authentication/session/callback paths,
privileged services, schema/migrations/RLS, storage, email, rate limiting,
analytics, SEO and every public/auth/student/admin route family. Browser
coverage exercises representative journeys and responsive shells; this is not
hosted integration certification or exhaustive screen-reader testing.

## Confirmed defects remediated

| Severity | Defect | Resolution / regression evidence |
|---|---|---|
| High | Draft save could overwrite a concurrently submitted application without revision/re-review | Row lock before draft eligibility check, draft-only update, reject submitted insert-race winner; application-service unit regressions |
| Medium | Stale admin view could acknowledge an unseen newer revision | Required expected revision checked under lock; admin-service and lifecycle coverage |
| Medium | Concurrent placement actions could resurrect cancelled records; reopen could duplicate events | Locked transactions with atomic audits; competing mutation unit regressions |
| Medium | Placement could link another student's application; audit failure could leave unaudited writes | Validate owner/non-draft linkage and immutable student; transactional placement/listing writes and rollback tests |
| Medium | Email stale claims, late completion and worker interruption could corrupt delivery state | Due predicate, generation/lease fencing, bounded sends/runtime and exhausted-lease recovery; outbox/SMTP tests |
| Medium | Control characters bypassed login return-path validation | Shared strict local-path validator, used by login and callback; redirect tests |
| Low | Unpublished listing title visible through apply URL without owning an application | Ownership check precedes unpublished presentation; apply-page tests |
| Low | Unvalidated IDs and raw exception messages exposed DB internals | Validated application/admin boundaries, explicit safe domain errors, generic incident-linked infrastructure failures; route tests |
| Medium | Contact success could turn into error after async event reset | Capture form reference before await; delayed-success browser regression |
| Medium | Modal focus escaped; busy dismissal inconsistent | Native modal, explicit Tab containment, Cancel-first focus, description and return-focus; keyboard/browser regression |
| Medium | Placement save could remain busy; records beyond first page inaccessible | Settled save feedback and query-preserving pagination for placements/contacts/notifications |
| Medium | Lifecycle implied unvisited statuses; copy implied email delivery | Actual committed-event highlights, truthful queued-delivery guidance and status-specific recovery copy |

## UI/UX review and Mobbin evidence

Retained the current `design.md` direction G, local font, brand and workspace
identity. Improved shared dialogs, timelines, pagination, detail wrapping,
save feedback and authenticated loading boundaries. Public directory loading
boundary was removed after browser evidence showed streaming 200 responses
for missing listings and unusable no-JavaScript navigation; HTTP 404 and
progressive enhancement are required contracts.

No `@Mobbin` connector was exposed. Public Mobbin pages were fetched; only
public titles/descriptions were available, not authenticated screen galleries:

- [incident.io list](https://mobbin.com/screens/f9757c15-2aaf-4031-9a47-8344c0f81fed): compact operations hierarchy, search/filter and pagination recovery.
- [Wix section](https://mobbin.com/sites/sections/6eae0753-3cdb-4ca3-b070-0a207d352552): retained approved public composition; title-only evidence, no new pixel-level claims.
- [Preply recovery](https://mobbin.com/flows/b429f909-3705-4330-9d4f-c9cc408948b7): explicit pending/error/completion feedback.

Repository-recorded grouped-form and detail references remain in
`docs/design/section-reference-map.md`. Full authenticated Mobbin research,
all-state screenshots and complete assistive-technology review are unverified.

## Performance and diagnostics

Local production build: landing **105 kB**, apply **99.8 kB**, opportunities
**96.6 kB** First Load JS; previous recorded CI baseline 106 / 99.9 / 96.6 kB.
Shared JS remains 87.3 kB. Different build environments and rounding mean small
differences are not proven speed gains. No new runtime dependency. Field CWV,
route latency under load and mobile memory remain unmeasured.

Application/admin unexpected failures now return `incidentId`; search structured
server logs for that exact ID. Events identify draft/submit/admin operations;
email events distinguish template/provider/delivery/dispatch failures. Logs
omit raw provider errors and payloads. Expected domain/validation failures are
400 responses, not infrastructure incidents. Build-time Next dynamic-render
signals are rethrown instead of logged as auth failures.

Email leases expire after two minutes; sends are bounded and dispatch work is
budgeted to 45 seconds with a 60-second route configuration. Verify hosting
plan duration and scheduler cadence. See `email-outbox-recovery.md`. SMTP is
at-least-once: acceptance followed by interruption may duplicate delivery;
event keys deduplicate enqueue, not remote acceptance.

## Verification record

- `pnpm typecheck` and `pnpm lint`: pass.
- `pnpm db:migrate` and `pnpm db:seed:test`: pass with both database URL
  variables explicitly set to newly created local `jalanin_audit_20261019`.
  An initial seed attempt was correctly refused because the second URL
  variable still resolved to a different host; no remote seed was executed.
- `pnpm test`: **169 passed**, including nine live local database checks.
  Concurrency/service and SMTP tests use controlled doubles; live parallel
  provider/DB failure injection remains a staging task.
- `pnpm build`: pass; no auth dynamic-render probe incident noise.
- `pnpm test:e2e --workers=2 --reporter=json`: **59 passed**, zero skipped,
  zero flaky, 73.5 seconds against dedicated local app port 3101, local storage,
  test sessions and isolated DB. Both database URL variables, `E2E_MODE=1`,
  `EMAIL_PROVIDER=log`, `STORAGE_BACKEND=local`, and
  `E2E_BASE_URL=http://localhost:3101` were explicit.
- Earlier browser failures exposed a public loading-boundary regression
  (fixed), default storage configuration mismatch (rerun with local backend),
  modal keyboard containment (fixed), and screenshot caret-style mutation
  racing hydration (preserve caret and exercise auth hydration before capture).
  Assertions were retained; no tests were skipped.

## External release gates / reproducible verification

Issue #3 remains open. Required owners and checks:

1. **Business/legal:** approve B01–B10, final privacy/terms/controller,
   consent versions, retention/deletion, quote terms, launch content and
   expanded-scope commercial approval. Current legal drafts prohibit release.
2. **Supabase owner:** apply all four migrations on staging, verify private
   documents bucket and service-only policies; sign up/confirm/login/reset on
   configured domains; student A cannot read B's application/document; upload
   replacement and simulate storage failure, checking metadata rollback.
3. **Email/operations owner:** configure verified SMTP sender/reply-to/admin
   recipients, enqueue submit/status/quote, invoke authenticated cron, verify
   actual provider acceptance, retry/backoff and exhausted failures; attach
   scheduled invocation evidence and inspect incident references.
4. **Platform owner:** verify pooled DB/secrets isolation, duration limits,
   DNS/TLS/canonical host, alert routing and backup restoration to a separate
   project with measured RPO/RTO. Never seed or truncate hosted databases.
5. **UAT owner:** real student/admin staging journeys, mobile/keyboard/error
   recovery and realistic latency/CWV. Test-session/local-storage CI is not
   hosted Supabase evidence. Analytics stays disabled pending consent approval.

Remaining polish: structured field-level server error associations across all
forms, existing-CV attachment presentation, and exhaustive all-state visual QA
are not certified by this pass.
