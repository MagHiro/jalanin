# Open Decisions — Jalanin Internship Platform

Source: PRD v0.4 §§0.B, 0.5, 15. Status: **pending product-owner approval**.
Nothing below is implemented as approved product behavior. Code that touches
these areas must follow the "Interim rule" column and must not present
placeholder behavior as a confirmed requirement.

| ID | Question (PRD ref) | Interim implementation rule | Recommendation | Status |
|---|---|---|---|---|
| B01 | Quotation expiry/validity (Q08) | No expiry field enforced; quote emails **must not** claim an expiration date or auto-expire. Schema reserves `expires_at NULL` (unused) for a future approved policy. | Optional admin-defined expiry with explicit email wording. Must be decided before quotations go live. | Pending |
| B02 | Manual payment-status tracking (Q04) | **No payment tables, statuses, invoices, or payment UI.** Dashboard shows no payment state. | If approved: admin-recorded status only, gateway stays excluded. Must be decided before freezing dashboard scope. | Pending |
| B03 | Rejected → reopen target status (Q07) | Admin reopen returns the record to `In Review` (explicit, audited), clears `needs_re_review` only after review of latest revision. Documented as interim default in `docs/architecture.md`. | Reopen to `In Review` with notification + re-review reset. | Pending detail |
| B04 | Deadline semantics (Q10) | Deadline is **informational only**: displayed on listings, never blocks start/submit server-side. No auto-unpublish. | Server-enforced cut-off with timezone rule, or confirm informational. | Pending detail |
| B05 | Editable fields / CV replacement / file limits (Q11, Q26) | Interim: before `Quotation Sent`, editable = personal, education, availability, notes + CV replacement (PDF/DOCX, ≤5 MB). Recorded here as **unapproved operational config** (`src/lib/config/documents.ts`). | Confirm formats, size cap, supporting-file policy. | Pending detail |
| B06 | Quotation terms/tax/revision policy (Q08) | Terms are free-text (student-visible) + internal notes (admin-only). No tax computation. Quote revision after dispatch = new quotation revision row, never silent overwrite. | Legal-approved terms template + revision/cancellation policy. | Pending detail |
| B07 | Privacy/terms/consent wording, retention, deletion (Q17) | Placeholder legal copy marked DRAFT; consent records store policy version + timestamp. **Cannot release personal-data workflows without approved copy.** | Owner/legal provides final copy, controller, retention matrix. | Release blocker |
| B08 | Ops: domain/DNS, sender identity, recipients, backups (Q01, Q14, Q18, Q25) | Env-driven (`CONTACT_INBOX`, `ADMIN_ALERT_EMAIL`, email SMTP). Documented in `.env.example` + `docs/deployment.md`. | Jalanin owns domain, sender domain, Supabase/Vercel accounts. | Operational blocker |
| B09 | Commercial scope approval (Q23, Q24) | Dashboard, placements, submitted-editing built as requested; flagged as **pending written change approval** vs SGD 600 baseline. | Written approval + revised schedule/support term. | Commercial blocker |
| B10 | Launch content/UX (Q09, Q20, Q21, Q28) | Seed countries/categories are dev-only samples. Start-date filter + newest-published default sort implemented as [R] default. Featured = admin `featured` flag. | Confirm launch vocabularies, date format, featured policy, real content. | Pending confirmation |

## Related undecided items tracked in code

- `AUTH-05` email verification mandatory-before-submit → implemented as **recommended, not enforced** (config flag `REQUIRE_VERIFIED_EMAIL=false` default).
- Admin alert on submitted-edit (0.A.1) → implemented as both persistent notification + queued email (deduplicated); policy approval still pending per PRD.
- Student dashboard quote-amount visibility → **not shown** (email is authoritative); student-visible notes only.
- Student download of own submitted CV → **denied by default** (PRD §8.1 [D]); admin-only download.
