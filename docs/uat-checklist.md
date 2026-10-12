# UAT Checklist — Jalanin Internship Platform (PRD v0.4 §14 + §0.B.2)

Release blockers: cross-user/unauthorized-document access, wrong statuses,
lost submissions, untracked notifications, missing consent, broken
auth/reset, backup ownership gaps, or any unaddressed P0 defect.

## Visitor & discovery

- [ ] UAT-01 Legacy site live; new subdomain entry works independently.
- [ ] UAT-02 Landing (mobile + desktop): hero, How It Works, featured, about,
      contact; no horizontal overflow; keyboard path complete.
- [ ] UAT-03 Search + country/category filters combine correctly; counts exact.
- [ ] UAT-04 Sort/paginate/back-button/malformed query behave gracefully.
- [ ] UAT-05 Published detail accessible; unpublished slug returns safe 404.
- [ ] UAT-24 Sitemap/robots expose published listings only.

## Student journeys

- [ ] UAT-06 Anonymous Apply → login → return to the chosen internship.
- [ ] UAT-07 Register/login/forgot/reset/logout; expired recovery fails safely.
- [ ] UAT-08 Save partial draft, log out, log in, resume with saved values.
- [ ] UAT-09 Submit with missing field/CV → specific validation, no record.
- [ ] UAT-10 Valid CV + submit → exactly one `New` application; confirmation shown.
- [ ] UAT-11 Double-click/retry → single record (idempotent).
- [ ] UAT-12 User A cannot read/update user B's drafts (backend + DB).
- [ ] UAT-13 Anonymous/student cannot reach admin pages or CV URLs.
- [ ] UAT-22 Consent omitted → submission blocked.
- [ ] V04-01 Edit in `New`/`In Review` → revision + re-review flag; status kept.
- [ ] V04-02 Edit/CV attempt after `Quotation Sent` → UI locked + server rejects.
- [ ] V04-03 Rejected student re-apply → same record shown, no duplicate, no self-reopen.
- [ ] V04-10 Dashboard shows no payment state anywhere.

## Admin & notifications

- [ ] UAT-14 Create/edit/publish/unpublish; audit entries; public cache matches.
- [ ] UAT-15 `New → In Review`: one event, one student email, visible history.
- [ ] UAT-16 `→ Quotation Sent` with missing/invalid quote → server rejects.
- [ ] UAT-17 Valid quote saves with status; email event tracked (amount + SGD + terms).
- [ ] UAT-18 Accepted → Completed manual path; only approved transitions allowed.
- [ ] UAT-19 Concurrent admin edits → no silent overwrite (version check).
- [ ] UAT-20 Email provider down → status consistent; retry visible; no storm.
- [ ] UAT-23 Student/application search + pagination bounded to permitted columns.
- [ ] V04-04 Admin reopens rejected → same ID, reason + actor audited.
- [ ] V04-05 End dates / placement completion never auto-complete applications.
- [ ] V04-06 Placement create/advance/cancel lifecycle; linked student sees it.
- [ ] V04-07 Deadline passes → publication unchanged.
- [ ] V04-08 Unauthenticated/student admin mutation attempts denied.
- [ ] V04-09 Quote email claims no expiry.
- [ ] UAT-21 Contact valid/invalid/missing-Turnstile handled correctly.

## Ops & release

- [ ] UAT-25 Database restore + handover rehearsal against approved objectives.
- [ ] UAT-26 Accessibility + performance smoke (agreed NFR targets).
- [ ] B01/B02/B07/B08 sign-offs recorded in `docs/open-decisions.md` before launch.
- [ ] Admin accounts provisioned via `pnpm admin:grant`; least-privilege tested.
- [ ] Sender domain verified; admin alert inbox receiving; contact channel live.
