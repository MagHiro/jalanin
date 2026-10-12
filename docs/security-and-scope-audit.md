# Security, Scope and Edge-Case Audit — Jalanin

**Date:** 2026-10-12  
**Source:** PRD v0.4 and original Jalanin proposal; current repository `main`.  
**Review method:** GitHub source inspection, SQL migrations, existing unit/integration/E2E suites, GitHub Actions workflow results. This is **not** an external penetration test.

## Scope boundary

The original proposal distinguishes **Scope of Work** (pages 1–2), **Additional Scope** (page 3), and **Suggested Additional Scopes** (page 4).

- Both **Scope of Work** and **Additional Scope** are required for MVP.
- **Suggested Additional Scopes** are excluded **except** later explicitly approved student dashboard and admin-managed placements.
- Online payment gateway, company portal, scoring/recommendations, appointment booking, waitlists, refunds/discounts, advanced reporting, multilingual CMS, identity verification workflows and external webhooks are **not** included.
- Manual payment tracking remains pending and is not implemented.

## Feature audit

| Area | Code and checks | Assessment |
|---|---|---|
| Landing, featured internships, contact, legal pages | Public pages, contact handler, Turnstile | Implemented; final content/legal approval pending |
| Published internship directory/detail | Indexed PostgreSQL queries, URL filters, dates, SEO | Implemented |
| Student registration/login/password recovery | Supabase Auth browser/SSR clients, protected routes | Implemented; **real hosted Supabase auth integration not independently exercised by CI** |
| One application per student/internship | DB unique constraint, draft/submit services | Implemented; concurrency and revision handling hardened |
| Save draft / revise submission | Draft-only endpoint, submitted revision endpoint, re-review flag, edit lock | Implemented; submitted UI flow corrected in audit |
| CV upload, private authorized download | Private store abstraction, admin access, file type/size checks | Implemented for CV; virus scanning and broader supporting-file policy pending |
| Admin internships, students, applications | Admin-gated routes, searchable sortable paginated lists | Implemented; pagination/sorting added during audit |
| Status transitions and audit | Validated state machine, append-only events, email outbox | Implemented; transactional outbox/audit and status-email idempotence hardened |
| SGD quotation, admin-recorded acceptance | SGD cents with DB CHECK, quotation email, admin status transitions | Implemented; expiry/tax/quotation terms policy pending |
| Student dashboard / admin-managed placements | Owned dashboard views, admin placement status transitions | Explicitly approved additions; implemented |
| Notifications | Durable admin alerts and transactional email queue | Implemented; production SMTP/sender domain unverified |
| Basic monitoring and analytics | PostgreSQL analytics events, logging, error feedback | Implemented; analytics consent and retention policy pending |
| SEO, sitemap, responsive designs | Next.js metadata, public sitemap, responsive components | Implemented; browser-based live production QA pending |
| Docker local / hosted Supabase PostgreSQL | Docker PG 16, Supabase migrations, SSR/Auth/Storage | Configured; **separate auth/storage integration needs real environment validation** |

## Security remediation performed

1. Removed direct student RLS write policies that allowed modifying workflow fields via Supabase REST.
2. Locked down the SECURITY DEFINER admin-check function's search path.
3. Prevented production use of test-session authentication and local document storage.
4. Rejected cross-origin API mutations and protocol-relative login callback redirects.
5. Failed closed when production is configured with testing Turnstile secrets.
6. Added stronger CV validation, upload authorization checks, transaction-safe CV replacement and re-review.
7. Made audit/outbox writes part of the business database transaction.
8. Serialized concurrent submissions and status/revision writes using PostgreSQL row locks.
9. Added PostgreSQL-backed rate limits (hashed keys, no raw IP) and durable PII-minimized analytics.
10. Improved .gitignore, removed tracked Windows Zone.Identifier metadata, bound local Docker ports to loopback.
11. Completed admin record sorting and pagination.
12. Added integration coverage of policy and storage constraints.

## Rare cases / known residual risks

- **Release blocker:** Privacy/terms text, consent legal basis, data retention, data deletion and backup/restore policies need approval. Draft legal text is not production-ready.
- **Release blocker:** Production Supabase Auth, password-reset redirects, service-role Storage bucket, email sending, DNS and backups need actual staging UAT.
- **Scope decision:** Quotation expiry and manual payment tracking are still unresolved; these are not silently implemented.
- **Security review:** Private CV files are validated by type and size, but antivirus/antimalware scanning, DOCX deep parsing and file lifecycle orphan cleanup have not been implemented. Access policies must be checked in the hosted Supabase project.
- **Operational:** PostgreSQL privileged connection bypasses RLS, so server authorization remains security-critical; review every new route. Use the least privileged DB role feasible for production.
- **Operational:** Rate-limit keys are hashed and shared in PostgreSQL. Edge/WAF protection is still recommended against excessive traffic that saturates the app before throttling.
- **Operations:** Managed production deployment, restore rehearsal, real SMTP/Turnstile validation, production performance and security penetration testing have not been executed here.
- **Tests:** CI's Playwright suite uses a gated development session fixture instead of live Supabase Auth; it does not prove hosted Auth correctness.

## Pre-production acceptance

Require final approved legal content; production environment and service secrets; Supabase bucket/policies; real registration + verification + recovery tests; real email dispatch; role isolation and document access tests with two real accounts; production backup restoration exercise; Turnstile and WAF validation; end-to-end staging UAT; review of pending quote/deadline rules; and written scope approval.

**Do not mark production security or legal compliance as guaranteed based solely on repository source inspection.**
