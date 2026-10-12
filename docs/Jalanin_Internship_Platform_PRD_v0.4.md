---
title: "JALANIN | Internship Platform - Product Requirements Document"
subtitle: "Implementation baseline and decision register"
version: "0.4 - Workflow Decisions Confirmed"
date: "9 October 2026"
status: "Twenty product decisions confirmed; quotation expiry and payment-status handling unresolved"
---

**Product Requirements Document (PRD) - v0.4**  
**Status:** Revised draft — twenty decisions confirmed; quotation expiry and payment-status handling pending  
**Prepared:** 9 October 2026  
**Primary source:** *Updated Jalanin Proposal*, 12 pages; supplemented by explicit product-owner decisions in this conversation  
**Confirmed stack:** Next.js + TypeScript + pnpm; Supabase PostgreSQL + Auth + Storage; Vercel

> **Reading this document.** **[B] Baseline** = explicitly included in the supplied proposal. **[R] Recommended** = implementation detail or product default proposed to make delivery unambiguous; not yet client-approved. **[D] Decision required** = material ambiguity that needs an answer before implementation/sign-off. **[F] Future** = proposal's suggested additional scope or clearly excluded capability. Sections tagged [R] or [D] do **not** automatically extend the agreed SGD 600 MVP scope.


# 0. Confirmed decisions and revised scope (9 October 2026)

**[C] Confirmed by product owner:** The following twenty decisions are controlling requirements: D01-D13 were confirmed previously; D14-D20 were confirmed on 9 October 2026. Older draft recommendations do not supersede these decisions. **[B]** continues to mean original proposal, **[R]** engineering recommendation, **[D]** unresolved decision, and **[F]** excluded future capability. New requirements beyond the original SGD 600 agreement require written commercial approval; confirmation of product intent does not by itself approve a new price or schedule.

| Decision | Confirmed behavior | Implementation / acceptance |
|---|---|---|
| D01 Website | Separate subdomain, provisionally `internships.jalanin.com` | Vercel domain mapping, DNS, TLS, redirects and canonical/sitemap scoped to subdomain; legacy website remains live |
| D02 Quote response | Student accepts or declines by replying to email; admin updates status | No in-app accept/reject buttons; admin records decision, source, actor, timestamp and optional email reference in audit trail |
| D03 Quote communication | Quote email contains amount in SGD and student-facing terms | Separate internal notes from student-facing terms; log template/version and send outcome, avoid duplicate sends |
| D04 Student experience | Full authenticated dashboard with application and placement history | Show own drafts/submitted applications, internship, submission date, status timeline and placement history; no payment processing implied |
| D05 Application uniqueness and edits | One application per student per internship; post-submit edits allowed **only before Quotation Sent** | Enforce DB uniqueness; submitted edits trigger re-review; student editing locks at Quotation Sent and remains locked until explicitly permitted by a later approved policy |
| D06 Admin operations | Real operational counts and application management | DB-derived counters with clear definitions and links to filtered application lists; no placeholder/predictive figures |
| D07 Language | English only at launch | English UI, validation and emails; no translation CMS/hreflang rollout required |
| D08 New application alert | Both admin email and dashboard indicator | Transactional email + persisted unread/new indicator, with deduplication and clear/read state |

## 0.A Five additional confirmed decisions (8 October 2026)

| ID | Confirmed decision | Mandatory product rule and test |
|---|---|---|
| D09 Application limit | One application **per student per internship** | Database `UNIQUE(student_id, internship_id)` covers drafts and submitted records; different internships are permitted; second attempt for same internship resumes existing record, never creates duplicate |
| D10 Submitted edits | Student may edit submitted applications, **requiring admin re-review** | Successful edit increments `revision`, records field-level audit, flags `needs_re_review=true`, and queues a persistent admin review indicator; admin must explicitly acknowledge/review new revision before progressing or confirming a quote |
| D11 Placement history | **Admin manually creates and updates placement records** | Placement belongs to one student and optionally one application; only authorized admin can create/edit status, dates, employer, role, country and notes; student sees only own placement history; no automatic creation on acceptance |
| D12 Quotation currency | **SGD only** | Store currency as `SGD` and amount as fixed-precision decimal / integer cents; reject any other currency server-side; quote email prints `SGD` and agreed terms |
| D13 Payments | **No online payment in MVP** | No checkout, gateway, payment webhooks, automated invoices or refunds. Manual payment-status tracking is a separate **pending** decision (B02); no payment UI/data is approved yet |

### 0.A.1 Required re-review workflow

1. A student updates their own submitted application and submits a valid revision. Keep original `submitted_at`, update `updated_at` and `revision`, preserve previous values in audit history, and mark `needs_re_review=true` with `reviewed_revision` unchanged.
2. The admin list and application detail visibly show **Updated — re-review required** while status is `New` or `In Review`; a persisted dashboard indicator is created. Recommended: send admin email as well, pending notification policy approval.
3. While re-review is pending, block admin transitions to `Quotation Sent`, `Accepted`, or `Completed` and block sending or re-sending a quote for the unreviewed revision. Submitted student editing is already locked at `Quotation Sent`, so an issued quotation cannot be altered through applicant edits; quote revision or withdrawal remains an admin-only policy decision.
4. An authorized admin reviews the new revision, explicitly acknowledges it, records `reviewed_revision = revision`, `reviewed_at` and `reviewed_by`, and clears `needs_re_review` transactionally. Admin may then take permitted status actions.
5. Race safety: any edit arriving during review invalidates the prior acknowledgement; status actions must check the reviewed revision within the same database transaction. Student must never edit quotation amount, status, admin notes, placement records, or another user's application.

**UAT:** two different internships can each receive one application from the same student; duplicate submissions for the same internship cannot create a second record, even under concurrent requests. After a submitted edit, the admin sees an outstanding re-review flag, progression is blocked until review, and old/new values remain auditable. An admin-created placement appears in that student's history only. Quotes in other currencies are rejected; no payment interface is present.

## 0.1 Revised student dashboard specification — P0 requested, commercial approval pending

- **Routes:** `/dashboard`, `/dashboard/applications`, `/dashboard/applications/[id]`, `/dashboard/placements` (or equivalent), with authentication required throughout.
- **Application cards/history:** internship title, location, submitted/last-updated dates, current status, link to own application and change history. Drafts have a Resume action; submitted applications have an Edit action only in `New`/`In Review`, and become read-only at `Quotation Sent`.
- **Placement history:** records associated with the student, displaying placement organization/title, location, relevant dates, and placement status where data exists. Empty state must not imply a confirmed placement. Admin-managed placement records are the authoritative source; placement status vocabulary remains to be approved.
- **Quotation:** email is the authoritative delivery channel for amount/currency/terms; dashboard may display `Quotation Sent` status, but must not expose confidential internal notes. Whether to show monetary details in dashboard remains a separate decision.
- **Access:** all queries scoped by authenticated student ID with RLS and server authorization; direct access to another student's URL returns not found/forbidden.
- **Acceptance:** a student sees only their own historical records; drafts resume after logout/login; post-submit changes appear in admin review; dashboard reflects committed status updates without requiring email to be opened.

## 0.2 Post-submission editing specification — P0 requested, rules pending

- Enforce `UNIQUE(student_id, internship_id)` for the application record (draft and submitted), including drafts and submitted records; reapplication after withdrawal/rejection remains an open lifecycle decision.
- Permit editing by the application owner after submission; validate changes server-side, retain original `submitted_at`, update `updated_at`, and record actor, changed fields, previous/new values (excluding secrets), and revision number.
- Do not permit students to change status, quotation, admin notes, application ownership or internship ID. Never overwrite previously sent quotation terms as a side effect of profile edits.
- If a CV can be replaced, preserve secure audit metadata and revoke obsolete signed URLs. Admin sees a mandatory `Re-review required` indicator and can inspect revision history.
- **[C]** Every successful submitted edit requires admin re-review and blocks subsequent quote/progression actions until acknowledged. **[C]** Student edit lock begins at `Quotation Sent`; rejected records are read-only unless an admin reopens into an eligible status. **[D]** Confirm editable fields/CV replacement, admin alert policy for edits, and any admin-only quotation revision procedure.

## 0.3 Revised quotation and notification specification

1. Admin enters amount in SGD, student-facing terms and internal notes in separate fields; validate amount/currency/terms before transitioning to `Quotation Sent`.
2. System queues a single student email containing internship/application reference, amount, currency, terms, reply-to address and clear instructions to accept/decline by replying.
3. Student replies externally. Admin verifies the response and manually records `Accepted` or `Rejected`, along with optional response date/reference and audit metadata. No student-facing acceptance endpoint is required.
4. New submission atomically creates an admin notification record and queues an admin email; dashboard unread count derives from persisted notification state. A failed email does not lose the dashboard alert; retries must be idempotent.
5. Status changes continue to trigger student email. Quote email delivery status is distinguishable from merely queued, and failures are visible to admins.

## 0.4 Revised operational admin dashboard — P0

Required counters: **New applications**, **In Review**, **Quotation Sent / awaiting email response**, **Accepted**, **Rejected**, **Completed**, **Published internships**, and **Unread new-application notifications**. Each counter is calculated from stored records with consistent filters and links to the corresponding management view. The applications table supports server-side search, filters, sorting, pagination, status transitions, quotation editing and an indicator for student changes since last admin review. No synthetic revenue, forecast, performance score or prediction widgets.

## 0.B Seven newly confirmed decisions (9 October 2026)

| ID | Product-owner decision | Mandatory rule and acceptance evidence |
|---|---|---|
| D14 Editing lock | **Lock student edits once the application enters `Quotation Sent`** | All student editing endpoints, forms, document replacement, and draft-save actions for submitted records reject edits at `Quotation Sent`, `Accepted`, `Rejected`, and `Completed`, regardless of URL/client manipulation. This does not prevent authorized admin updates or separately audited admin reopening. |
| D15 Rejection recovery | **Only an authorized admin may reopen a rejected application** | A rejected student's application remains a single historical record; student cannot create a replacement application for the same internship or change its status. Reopen requires explicit admin action and audit entry. The exact reopened-to state is pending a minor workflow decision; no automatic reopen. |
| D16 Completion | **Admin manually marks an application `Completed`** | Completion is never triggered automatically by an internship end date or placement status. Completion requires authorized admin action and generates the standard status-change audit and student email. |
| D17 Placement stages | **`Preparing` → `Confirmed` → `Active` → `Completed` / `Cancelled`** | Admin creates and updates placements manually, with their own status lifecycle and timestamps; student dashboard displays only their placements. Forward progression and terminal `Cancelled`/`Completed` paths are the MVP default; exceptions/reopening need audit and an approved rule. |
| D18 Internship availability | **Admin controls publication; optional application deadline** | Admins publish/unpublish listings. A deadline field may be blank; publishing is not automatically toggled when the deadline passes. Whether the deadline blocks *new* application submissions is still a separate clarification. |
| D19 Admin roles | **One admin role with full operational permissions** | No staff/super-admin role hierarchy in the MVP UI; admins have protected access to all included admin features. Role grants/revocations occur through privileged provisioning, never student self-enrollment. |
| D20 Managed backend | **Supabase PostgreSQL + Supabase Auth + Supabase Storage** | Next.js/TypeScript/pnpm frontend on Vercel; Supabase migrations, RLS, secure storage and password-reset flows are baseline architecture. No independent PostgreSQL/Auth/Storage alternatives are in the current build scope. |

**Explicitly unresolved, not defaulted:** `D21` quotation validity/expiry (no approval for an expiry period or automatic expiry); `D22` manual payment-status visibility/tracking (online payment gateway is excluded, but manual status tracking has not been accepted or rejected). Until these decisions are resolved, *do not build quotation auto-expiry, payment screens, payment tables, or payment-status claims into launch acceptance*. Keep commercial scope change approval separate from product confirmation.

### 0.B.1 Editing, rejection and placement invariants

1. The unique constraint on `(applicant_user_id, internship_id)` remains in effect across drafts, submitted, rejected and completed records. Reopening modifies the existing record, not its unique key or application identity.
2. Student editing is possible only while the submitted status is `New` or `In Review` and the record is not otherwise admin-locked; every update increments revision, sets `needs_re_review=true`, and requires explicit admin acknowledgement before quote send or allowed progression. The exact allowed field set, including CV replacement, must still be finalized.
3. Entering `Quotation Sent` requires a fully reviewed latest revision and a valid SGD quotation. Once entered, the student cannot edit even if a quotation has no student reply yet. Attempted direct API writes must be rejected server-side and by data-layer policies.
4. A rejected application is read-only for students. Only an authenticated admin can reopen it; the admin must record reason, actor, and timestamp. Any new student-edit permission following reopen depends on the reopened status and policy, never on creating another application.
5. `Completed` is changed by an admin action, not by background dates or placement transitions. Placement `Completed` does not necessarily imply application `Completed` without admin action.
6. An admin-managed placement starts as `Preparing` unless an authorized admin chooses an approved alternative; standard progression is `Preparing` → `Confirmed` → `Active` → `Completed`, while `Cancelled` is a terminal exit from an active nonterminal state. Reopening or reversing a terminal placement requires an approved admin override policy.
7. Internship publication (`Draft`, `Published`, `Unpublished` or equivalent) is separate from application deadline and placement dates. Do not silently unpublish listings on deadline passage. The ability to submit after deadline requires explicit owner sign-off.

### 0.B.2 New acceptance tests

| ID | Scenario | Expected result |
|---|---|---|
| V04-01 | Student edits own submitted application in `New` or `In Review` | Revision captured, admin re-review required, status does not silently reset |
| V04-02 | Student attempts update/CV replacement after `Quotation Sent` | UI locked and server rejects write; no updated timestamp or audit edit created |
| V04-03 | Rejected student tries to apply again to the same internship | Existing rejected record shown; no second record created; cannot self-reopen |
| V04-04 | Admin reopens rejected record | Same application ID retained; reason and actor audited; normal restrictions re-evaluated |
| V04-05 | Internship end date or placement completion occurs | Application remains unchanged until admin manually marks `Completed` |
| V04-06 | Admin creates and advances/cancels placement | Valid status lifecycle and auditable updates; only linked student sees history |
| V04-07 | Deadline passes on published internship | Listing publication does not auto-change; new-submission enforcement follows the separate approved deadline decision |
| V04-08 | Unauthenticated user or student calls admin mutation API | Denied; only provisioned admin permitted |
| V04-09 | Quote email is sent with no expiry configuration | Does not claim an expiration date or silently auto-expire |
| V04-10 | Open student dashboard with no payment decision | No payment status or invented invoice/transaction shown |

## 0.5 Remaining decisions and blockers (after 20 confirmations)

| ID | Status | Decision / blocker | Effect |
|---|---|---|---|
| B01 | **Pending product decision** | Quote expiration: no expiry, optional admin-defined expiry, or standardized term; treatment of expired quotes, email wording | Quote model, email templates, student communication; **must decide before quotations go live** |
| B02 | **Pending product decision** | Manual payment-status tracking: excluded entirely vs admin-recorded status visible to student; gateway stays excluded in either case | Dashboard, schema, UI, acceptance; **must decide before freezing dashboard scope** |
| B03 | **Pending workflow detail** | Admin reopening rejected application: target status (`New` or `In Review`), notification and re-review reset behavior | Status transitions and tests |
| B04 | **Pending workflow detail** | Deadline: informational only or server-enforced cut-off for starting/submitting applications; timezone and existing drafts | Application eligibility and listing copy |
| B05 | **Pending form/storage detail** | Editable fields before quotation lock, CV replacement eligibility, permitted formats, max file size and supporting files | Form validation and private-storage rules |
| B06 | **Pending quotation/compliance detail** | SG dollar terms, tax/fees, quotation revision and cancellation policy (after dispatch, no student edits) | Legally reliable quotes and audits |
| B07 | **Release/legal blocker** | Privacy/terms/consent wording, retention, deletion process, controller and market-specific requirements | Cannot release personal-data workflows without approval |
| B08 | **Operational blocker** | Production domain/DNS owner, sender and reply-to, email service, notification recipients, contact intake channel, backups/RPO/RTO | Integration, UAT and production readiness |
| B09 | **Commercial blocker** | Written approval for full dashboard, manual placements, submitted editing and any scope expansion beyond SGD 600; revised schedule, support term, UAT approver | Cannot claim original quote/schedule includes added requirements |
| B10 | **Content/UX confirmation** | Launch countries/categories, placement required fields and allowable status exceptions, public date formatting | Content seeding and final validation |


# 1. Product summary

## 1.1 Purpose

**[B]** Jalanin needs an internship discovery and application experience separate from its existing live static website. Visitors can review internships without an account. Students authenticate before submitting an application. Authorized Jalanin administrators review applications, create custom quotations, move applications through a defined status workflow, and notify students by email whenever a status changes. Public internship listings do **not** show salaries or fixed programme fees. (Proposal pp. 1-3, 6.)

This document converts that proposal into testable functional requirements, page definitions, suggested data structures, permissions, application state transitions, measurable non-functional targets, a prioritized backlog, and a list of unresolved business decisions.

## 1.2 Problem and value proposition

- **Visitor problem:** internship information is difficult to find and assess consistently across locations and categories.
- **Student problem:** submitting details, CV, availability, and supporting context should be predictable and recoverable if interrupted.
- **Jalanin operations problem:** application review, individual quotations, and communication need a small, controlled workflow rather than a full CRM.
- **Product proposition:** a fast, mobile-friendly, searchable internship directory connected to a secure application and quotation management system.

## 1.3 Goals and boundaries

| Goal | MVP interpretation | Approval status |
|---|---|---|
| Keep existing Jalanin website live | Launch a separate secondary internship experience; do not replace existing site | [B] |
| Increase discoverability | Searchable, filterable, indexable published listings and detail pages | [B] |
| Capture complete applications | Authenticated form, private CV, functional draft save, validation | [B] |
| Support manual quotation workflow | Admin records custom quote and status; status-change emails sent | [B] |
| Minimize infrastructure overhead | One Next.js deploy, managed Postgres/Auth/Storage, no background microservices | [R] |
| Keep scope controlled | No CRM, online checkout, employer accounts, advanced scoring or reporting in confirmed MVP | [B] |

## 1.4 Important commercial/context note

**[B]** The source proposal records an MVP price of **SGD 600** (SGD 150 secondary page, SGD 400 platform workflows, SGD 50 deployment), SGD 300 due at start and SGD 300 at production handover; proposed optional additions priced separately. It states a **1 September 2026** kickoff, approximately one month of MVP development excluding UAT, 1-2 weeks of UAT, and an overall design estimate of 2-3 months (proposal p. 5 and p. 12). **[D]** These are source commitments, not a newly confirmed project schedule as of 8 October 2026; actual progress, budget, UAT owners and milestones require reconciliation. The proposal also requires written approval for out-of-scope work and leaves post-launch included support duration unspecified.

# 2. Scope and priorities

## 2.1 Included MVP capabilities

**P0 = launch-blocking baseline requirement. P1 = important MVP polish where explicitly scoped. P2 = proposed enhancement requiring approval.** All baseline items below must be delivered unless a signed change decision says otherwise.

| ID | Capability | Priority | Evidence |
|---|---|---|---|
| SC-01 | Secondary internship landing page, desktop/mobile, hero, How It Works, featured roles, About, contact | P0 | Proposal p. 1, p. 7 |
| SC-02 | Public directory with search, country and category filters, sorting and pagination | P0 | pp. 1, 3, 8 |
| SC-03 | Public detail pages with job content, dates, requirements, login-gated Apply | P0 | pp. 1, 6, 9 |
| SC-04 | Email/password auth, forgot/reset password | P0 | pp. 1, 3, 6 |
| SC-05 | Required application fields, CV upload, save/resume draft, submit as New | P0 | pp. 1, 3, 10 |
| SC-06 | Protected admin listing CRUD and publish/unpublish | P0 | pp. 1, 3 |
| SC-07 | Admin applications, student record search/filter, status and quotations | P0 | pp. 1-3 |
| SC-08 | Status-change email to student; new-application alert to Jalanin | P0 | pp. 1-3 |
| SC-09 | Contact intake, Turnstile, confirmation and privacy-policy link | P0 | pp. 1-3 |
| SC-10 | Privacy/terms/data-processing consent, restricted file access, audit trail | P0 | pp. 2-3 |
| SC-11 | Public SEO, analytics, validation, monitoring, backup/recovery handover | P0 | pp. 2-3, 5-6 |
| SC-12 | Dashboard layout aligned with supplied visual reference | P1 | p. 11; see dashboard caveat |

**Dashboard caveat:** The admin wireframe on page 11 visually contains an operations score, predicted trends, placement activity, and recommended actions. Those are **illustrative**, not confirmed data science or advanced-reporting functionality. The MVP admin dashboard should use only real, computable operational counts unless separately approved. (See §7.8.)

## 2.2 Explicitly excluded / future scope

**[F]** Staff assignment, automated sales pipeline, checkout/payment collection, payment-status management, CSV import/export, advanced reporting, full CRM, and employer portal are excluded from the confirmed MVP. The student dashboard and admin-managed placement history are **promoted to the requested revised MVP** (commercial approval outstanding). Remaining future enhancements include: optional payment-status display, employer/company portal, multi-language CMS, consultation scheduling, screening/scoring, recommendations, follow-up task manager, waitlists, cancellation/refunds, discounts/scholarships, rich reporting, payment gateways (Stripe/Xendit/Midtrans or equivalent), identity verification, and external APIs/webhooks. Any one of these requires a separately accepted change request. (Proposal pp. 2-4.)

## 2.3 Full student dashboard — included in requested revised scope

**[C]** The full authenticated student dashboard replaces the earlier proposed draft-only shortcut. Include draft retrieval, submitted application and status history, and admin-managed placement history. Student-facing quotation amount/terms remain delivered by email. **[D]** Manual payment-status tracking remains undecided; payment processing is excluded. Approval of this added scope against the original SGD 600 quote is still required in writing.

# 3. Users, roles and access model

| Actor | Responsibilities | Authorized actions | Explicit restrictions |
|---|---|---|---|
| Visitor (anonymous) | Discover opportunities | Browse published listings/details; search/filter; submit contact | Cannot create application, access drafts, view private data, or enter admin |
| Student (authenticated) | Apply for internships | Create/update own draft; upload/replace own CV before submit; submit own application; reset own password | Cannot view another user's data; cannot change workflow status or quotation; may edit their own submitted application only while `New` or `In Review`, triggering re-review; all student edits locked at `Quotation Sent` and later |
| Jalanin administrator | Run placement intake | Manage listings; browse/search students/applications; review CVs; set status; create quotations; view contact submissions and audit history | Cannot bypass audit, access secret credentials through UI, or grant roles by changing frontend data |
| Platform owner / account administrator | Maintain operational accounts | Configure service credentials, backups and admin enrollment outside ordinary student UI | [D] Whether a separate super-admin role is required is undecided |

**[C]** Implement a single authorized-admin role for MVP. Grant it via a privileged server-side provisioning process, not public signup. Even if a user modifies client-side state, server authorization and database RLS must enforce privileges.

# 4. Measures of success

Metrics must be based on real events, not fabricated dashboard values. No numerical business targets were supplied in the proposal; values marked [R] are candidate engineering targets for sign-off.

| Metric | Definition | MVP expectation |
|---|---|---|
| Listing visibility | Published listings load publicly and can be discovered by search | [B] Functional acceptance |
| Application conversion | Submitted applications / unique internship detail visitors in selected period | [B] Track; target [D] |
| Draft-to-submit rate | Unique submitted applications / saved drafts created | [R] Track if privacy policy allows; target [D] |
| Notification delivery | Status-change email events with provider acceptance / eligible status changes | [R] ≥99% provider acceptance, measured; inbox delivery cannot be guaranteed |
| Public performance | Core Web Vitals p75 mobile field data | [R] LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 |
| Data security | Confirmed cross-user file or application disclosure | [R] Zero known critical issues at go-live |
| UAT sign-off | Agreed P0 journeys and security cases pass | [B] Required before production deployment |

# 5. Information architecture and route design

The existing website must stay online. **[C]** The internship application will use a dedicated Jalanin subdomain (provisionally `internships.jalanin.com`); the exact DNS and domain administrator remain operational confirmations. The following are proposed **relative paths inside the new Next.js application**, not a claim that the legacy host can route them unchanged.

| Screen / route (proposed) | Access | Purpose |
|---|---|---|
| `/` | Public | Internship landing page on separate experience |
| `/opportunities` | Public | Directory with query-string filters, sort and pagination |
| `/opportunities/[slug]` | Public | Published internship details; canonical URL |
| `/about` or landing section | Public | Optional About section; default section on landing |
| `/contact` or landing section | Public | Contact form; default section on landing |
| `/privacy`, `/terms` | Public | Client-supplied legal content, version tracked |
| `/auth/sign-up`, `/auth/login` | Public | Student authentication |
| `/auth/forgot-password`, `/auth/reset-password` | Public / recovery token | Account recovery |
| `/apply/[internshipId]` | Authenticated student | New or resumed application to selected internship |
| `/dashboard`, `/dashboard/applications`, `/dashboard/applications/[id]`, `/dashboard/placements` | Authenticated student | Full dashboard, saved drafts, applications, quotation status, manually managed placements |
| `/admin` | Admin | Real operational overview |
| `/admin/internships`, `/admin/internships/new`, `/admin/internships/[id]/edit` | Admin | Listing management |
| `/admin/applications`, `/admin/applications/[id]` | Admin | Application review/quotation/history |
| `/admin/students`, `/admin/students/[id]` | Admin | Basic student search and read-only profile/application records |
| `/admin/contacts` | Admin | [R] If contact submissions are stored rather than only emailed |

**[R]** All filters (search, country, category, dates if approved, sort, page) are represented in URLs so results are linkable and browser navigation works. Use user-friendly not-found, expired-link and access-denied states. No private routes should be crawlable.

# 6. End-to-end journeys

## 6.1 Visitor discovers an opportunity

1. Visitor enters the new internship landing page from existing site navigation or a direct URL.
2. Visitor browses the four-step explanation and featured listings, or opens the directory.
3. Visitor searches by role or location, filters country/category, sorts and changes pages.
4. Visitor opens a published detail page showing title, location, date range, description, responsibilities, requirements and category.
5. Visitor clicks **Apply Now**; if not authenticated, the system saves the intended return destination and prompts for login/signup.
6. On successful authentication, the student returns to the selected internship application form, not a generic home page.

## 6.2 Student drafts and submits application

1. Authenticated student opens the form for a published internship.
2. Form contains first name, last name, email, nationality, university, course, graduation year, preferred dates, CV and additional information.
3. **Save Draft** stores entered data against user + internship (excluding unsafe local-only persistence). A later session can resume it. **[D]** Confirm whether autosave is additionally desired.
4. Submission validates all required fields, acceptable document type/size, consent, current listing status, and ownership; server writes the submitted application once with status `New`.
5. Student receives confirmation; Jalanin receives a new-application alert by chosen channel; duplicate clicks must not cause duplicate records.
6. Submitted content becomes immutable to the student by default; admins can review the snapshot even if the listing is later unpublished.

## 6.3 Administrator review and quotation

1. Admin opens the protected application list, filters/sorts/paginates, and selects an application.
2. Admin sees the submitted snapshot, internship context, private CV (only via authorized secure access), audit trail, and current status.
3. Admin changes `New` to `In Review`, documenting a reason where needed.
4. To mark `Quotation Sent`, admin must record a **positive amount**, currency and quote notes. Transaction commits status and quote together.
5. Every successful application status change creates audit history and an email event to the student. A failed email does not silently undo a committed status; retry or visible delivery failure is required.
6. Admin then records `Accepted` or `Rejected`; only `Accepted` can transition to `Completed` under the recommended default policy. **[D]** Who authorizes these decisions and whether a student can accept a quote is unresolved.

## 6.4 Contact inquiry

1. Visitor completes client-approved contact fields and acknowledges relevant privacy information.
2. Server validates fields and the Cloudflare Turnstile verification token, then records the inquiry and/or sends to Jalanin according to the final channel decision.
3. Success is shown on-screen without exposing other contacts. Invalid, expired, or reused Turnstile tokens must fail safely.

# 7. Functional requirements and acceptance criteria

Requirements are implementation-facing. Unless marked otherwise, items with [B] follow the proposal; detailed behavior within them may be [R] and needs review.

## 7.1 Landing page, legal links and responsive design

| ID | Requirement | Acceptance criteria |
|---|---|---|
| WEB-01 [B] | Separate internship landing page without replacing old site | New URL works; old site remains live; old-site navigation integration tested if in agreed deployment scope |
| WEB-02 [B] | Hero with one main call to action | Primary button opens directory; supporting text accurately describes custom quotation |
| WEB-03 [B] | Four-step How It Works | Content conveys browse → review → apply → quote; no public fixed price/salary claim |
| WEB-04 [B] | Featured internships | Only published, eligible items appear; empty state shown if none featured |
| WEB-05 [B] | About Jalanin + contact form | Content is approved by Jalanin; contact action available on mobile |
| WEB-06 [B] | Responsive desktop/mobile layout | No horizontal scrolling at agreed viewport widths; major controls operable with keyboard/touch |
| WEB-07 [B] | Privacy and terms links + SEO metadata | Correct page titles and descriptions, links and consent text present |
| WEB-08 [R] | Empty, loading and error states | Missing data, submission errors and inaccessible pages provide actionable feedback |

**Visual guidance:** Proposal p. 7 has a restrained light layout, headline "Internships across Southeast Asia", a four-tile process, and internship cards with dates and category pills. Its sample roles/locations/dates are visual placeholders, **not** database seed commitments.

## 7.2 Internship discovery and details

| ID | Requirement | Acceptance criteria |
|---|---|---|
| JOB-01 [B] | Public list of published roles | Unpublished/draft records never appear in public APIs, sitemap or cached listing HTML |
| JOB-02 [B] | Search by role and location | Query matches title and location fields; trim whitespace; no SQL injection |
| JOB-03 [B] | Country and category filters | Independent and combinable; All clears each filter; selected values survive pagination |
| JOB-04 [B] | Sorting and pagination | Stable sort including tiebreaker, valid page bounds, exact or clearly labeled approximate result count |
| JOB-05 [R][D] | Start-date filter illustrated in wireframe | If accepted, filtering works by internship start date; confirm semantics (from/on/after) |
| JOB-06 [B] | Internship cards | Title, city/country, category, visible internship date range, link to details; no salary or fixed price |
| JOB-07 [B] | Detail fields | Title, location, dates, description, responsibilities, requirements, category and Apply control |
| JOB-08 [B] | Custom-quote messaging | Explains Jalanin will review application and prepare a quotation; no invented estimate |
| JOB-09 [R] | Unpublished/missing links | Return 404 or approved closed-state; no private record data leaks |
| JOB-10 [C][D] | Publication and optional deadline | Admin alone publishes/unpublishes. Application deadline optional; no automatic unpublishing. Whether passed deadline prevents new submissions is undecided |
| JOB-11 [B] | Public SEO | SSR/SSG or ISR, metadata, sitemap, canonical URLs and structured page titles; private/admin routes noindex |

**Visual guidance:** Proposal p. 8 shows a search row, country/category/start-date controls, compact cards and a result count. Page 9 separates content from a right-side "Application" panel displaying internship dates, custom-quote copy and Apply Now.

## 7.3 Authentication and sessions

| ID | Requirement | Acceptance criteria |
|---|---|---|
| AUTH-01 [B] | Email/password registration | Verified server-side create flow; errors do not disclose sensitive internals |
| AUTH-02 [B] | Login and logout | Student can sign in/out; protected pages require valid session |
| AUTH-03 [B] | Forgot password and reset password | Time-limited recovery link returns user to correct app; old/invalid token handled |
| AUTH-04 [B] | Application authentication gate | Apply prompt redirects anonymous user to login and back to selected internship |
| AUTH-05 [R][D] | Email verification | Recommended before final submission; decision needed on whether email verification is mandatory |
| AUTH-06 [R] | Role isolation | Admins provisioned out-of-band; authorization enforced server-side and through RLS |
| AUTH-07 [R] | Abuse protections | Rate limits for auth attempts where supported; Turnstile for public forms where practical |
| AUTH-08 [R] | Safe sessions | Secure HttpOnly cookies where applicable; no tokens in URLs beyond intended one-time recovery flow |

**[D]** The source commits to **Supabase Auth**. A standalone PostgreSQL choice would need a replacement identity stack and corresponding scope estimate; it is not a like-for-like substitution.

## 7.4 Application form and drafts

| ID | Requirement | Acceptance criteria |
|---|---|---|
| APP-01 [B] | Apply only to selected published internship | Application always references the chosen internship ID and current authenticated user |
| APP-02 [B] | Personal fields | First name, last name, email, nationality present and validated |
| APP-03 [B] | Education fields | University, course/major, graduation year present and validated |
| APP-04 [B] | Availability | Preferred dates collected; clarify single range versus multiple ranges [D] |
| APP-05 [B] | CV upload | Private upload succeeds within approved type/size policy; only authorized admins may download submitted documents |
| APP-06 [B] | Additional information | Multiline optional notes safely stored, escaped when rendered |
| APP-07 [B] | Functional Save Draft | Draft survives page refresh/log out/log back in and is limited to owning student |
| APP-08 [R] | Resume/overwrite draft | Draft can be reopened and updated without creating multiple drafts unintentionally |
| APP-09 [B] | Required validation | Server validates final submit regardless of client; field-specific accessible errors shown |
| APP-10 [B] | Consent capture | Consent to current privacy/terms/personal data policy with version and timestamp, per finalized legal wording |
| APP-11 [B] | Final submission | Atomic transition from `Draft` to `New`; associates internship, student and CV; records submitted timestamp |
| APP-12 [R] | Repeated clicks/idempotency | At most one submitted application per click/token; retry cannot accidentally duplicate application |
| APP-13 [C] | Application uniqueness | Enforce one record per student per internship across all statuses, including rejected; student cannot create another record; admin-only reopen |
| APP-14 [R] | Validation against unpublished listings | Reject new submission if internship became unavailable after form was opened; preserve draft for staff guidance |
| APP-15 [R] | Draft cleanup | Old drafts/files cleaned under approved retention schedule; never delete an in-use submitted CV |
| APP-16 [C] | Post-submit editing and hard lock | Students can amend own `New`/`In Review` records; each revision forces admin re-review; edit endpoints and CV replacement are locked at `Quotation Sent` or later |

**Visual guidance:** Proposal p. 10 divides form into Personal Information, Education, Documents and Notes, with separate **Submit application** and **Save draft** controls. PDF/DOCX is indicated as a visual example, but actual allowed formats and size limit require approval (Q11).

## 7.5 Admin listing management

| ID | Requirement | Acceptance criteria |
|---|---|---|
| ADM-JOB-01 [B] | Authorized admin routes | Non-admin users cannot render pages or execute write/read operations on restricted data |
| ADM-JOB-02 [B] | Create and edit internship | Admin can save title, slug, location, country, dates, category, description, responsibilities, requirements |
| ADM-JOB-03 [B] | Publish and unpublish | Only published records appear publicly; published URL invalidated/revalidated correctly on change |
| ADM-JOB-04 [R] | Listing form validation | Required fields and date consistency enforced on server |
| ADM-JOB-05 [R] | Stable links | Slug unique; editing title does not unintentionally break canonical link without redirect policy |
| ADM-JOB-06 [B] | Search/sort/page admin records | Manage listing inventory with filters for status, country/category as appropriate |
| ADM-JOB-07 [B] | Listing audit entries | Create/edit/publish/unpublish record who changed what and when |
| ADM-JOB-08 [R] | Safe historical applications | Unpublishing does not orphan submitted applications or eliminate audit/quote history |

## 7.6 Admin applications, students and quotations

| ID | Requirement | Acceptance criteria |
|---|---|---|
| ADM-APP-01 [B] | List, search, filter, sort, paginate applications | Search by allowed fields; stable sorting; no full-table client fetch |
| ADM-APP-02 [B] | View student records | Admin can search/paginate students and view basic profile/application relationship, not full CRM |
| ADM-APP-03 [B] | Review application and attachments | Shows submitted field snapshot, internship details, private CV and notes |
| ADM-APP-04 [B] | Enforce named statuses | New, In Review, Quotation Sent, Accepted, Rejected, Completed; `Draft` is pre-submission only |
| ADM-APP-05 [B] | Record quotation on transition | Before `Quotation Sent`, positive money amount and notes recorded and linked to application |
| ADM-APP-06 [C] | Quote currency | Only SGD accepted; amount in integer cents or documented `NUMERIC` precision; email includes SGD amount and terms |
| ADM-APP-07 [R] | Concurrent admin changes | Optimistic concurrency/version check or database row lock prevents accidental last-write-wins status/quote overwrite |
| ADM-APP-08 [B] | Status email after every change | Durable event recorded for each successful change; student email queued/sent and delivery result tracked |
| ADM-APP-09 [B] | Audit important changes | Actor, timestamp, before/after or summarized changes for status, quote and listing actions |
| ADM-APP-10 [R] | State-aware UI | Only permitted next transitions shown; confirm destructive/terminal actions |
| ADM-APP-11 [R] | Quote visibility separation | Internal admin notes never inserted into student emails unless marked student-visible and approved |
| ADM-APP-12 [C] | Who accepts/rejects | Student responds to quote by email; admin verifies reply and records `Accepted`/`Rejected`, response reference and audit entry; no in-app buttons |
| ADM-APP-13 [R] | File link lifetime | Admin download via short-lived signed URL after authorization; no public bucket access |

## 7.7 State model and transition constraints

**[B]** Source statuses: New, In Review, Quotation Sent, Accepted or Rejected, Completed. The source lists *Accepted or Rejected* conversationally; implement **two distinct stored states** for reporting and correct branching. **Draft** is the separate form state, never a submitted application status.

| From | To | Actor | Rule | Status |
|---|---|---|---|---|
| Draft | New | Student | All final validation passes; one atomic submit | [B] |
| New | In Review | Admin | Review begun | [R] Normal path |
| In Review | Quotation Sent | Admin | Valid quote amount, currency and notes recorded | [B] |
| Quotation Sent | Accepted | Admin | Student acceptance received by email; admin records decision and evidence/reference | [C] |
| Quotation Sent | Rejected | Admin | Student declines by email or authorized admin rejection under approved reason policy | [C] with wording [D] |
| Accepted | Completed | Admin | Authorized manual completion action; no automatic trigger from placement or dates | [C] |
| New/In Review | Rejected | Admin | Early rejection may be needed; confirm policy | [D] |
| Rejected | Reopened state TBD (`New` or `In Review`) | Admin only | Explicit audited reopen; same application ID; target state/notification still [D] | [C] admin-only |
| Completed | Any | Admin only | Remains terminal by default; exceptions require separate approval | [R] |
| Any submitted state | Previous state | Admin | Default prohibited to avoid silent quote/email inconsistencies | [R][D] |

**[R]** Persist transition and audit record in one DB transaction. Create an email-outbox event with an idempotency key. A status update must not claim a notification was delivered when only queued. **[C]** Quotation email contains SGD amount, student-facing terms, and reply instructions; internal notes are withheld. Student editing locks at `Quotation Sent`; admin alone records email response and later manually marks `Completed`. Quote expiry and revision rules remain [D].

## 7.8 Admin dashboard (correctly scoped)

**[B]** Admin dashboard is a supplied visual reference. **[C]** Build a lightweight operational page showing real counts from application and internship tables: `New`, `In Review`, `Quotation Sent`, `Accepted`, `Rejected`, `Completed`, `Published internships`, and `Unread alerts`, plus links to filtered lists. A simple recent-activity section is acceptable if backed by audit data.

**Do not represent the page-11 wireframe's "Operations score 86," "marketing demand rising," "7-day outlook," "placement activity" forecast, or recommended actions as accurate unless their formulas, datasets and separate scope are formally agreed.** Advanced reporting is excluded by the proposal. Any chart on MVP must use a clearly documented and real aggregate with a simple query.

## 7.9 Contact form and email notifications

| ID | Requirement | Acceptance criteria |
|---|---|---|
| COM-01 [B] | Contact submission | User can submit approved fields; success confirmation after successful validation and persistence/delivery |
| COM-02 [B] | Anti-bot protection | Cloudflare Turnstile verified on server; failures do not create accepted submission |
| COM-03 [B] | Privacy notice | Privacy-policy link and legally approved acknowledgement if required |
| COM-04 [B][D] | Delivery channel | Submission stored for admins **or** delivered by email; choose one required channel |
| COM-05 [R] | Abuse protection | Honeypot/rate limit, controlled error output and basic spam hygiene |
| NOT-01 [C] | New application notification | Jalanin receives both transactional email and durable dashboard indicator, idempotently |
| NOT-02 [B] | Student status-change emails | Each committed status change emits appropriate student message (including quotation event) |
| NOT-03 [R] | Reliability | Outbox or equivalent retry/reconciliation; failures visible to operator and deduplicated |
| NOT-04 [R] | Email templates | Branded content, application reference, current status, next step, support contact, legal footer as needed |
| NOT-05 [C][D] | Quote specifics | SGD amount, student-facing terms and reply-by-email required; expiry is [D] and must not be invented |

**[R]** Initial contact fields: name, email, message and optional subject; the proposal does not specify the field set. **[R]** Source-conservative notification option: admin alert by email and student status email via a transactional provider; avoids a real-time push infrastructure. All operational recipient addresses must be configured rather than hard-coded.

### Proposed notification event matrix

| Event | Recipient | Required? | Proposed content |
|---|---|---|---|
| Application submitted / status New | Jalanin | [C] Both email **and** persisted dashboard indicator | Applicant name, role, reference and admin deep link; no CV attachment |
| Application submitted / status New | Student | [R] Confirmation | Receipt and tracking reference; avoids promising acceptance |
| New → In Review | Student | [B] | In Review notice |
| In Review → Quotation Sent | Student | [C] | SGD amount, student-facing terms and reply-to instructions; expiration omitted pending B01 |
| Quotation Sent → Accepted | Student | [B] | Accepted status and approved next steps |
| Quotation Sent → Rejected | Student | [B] | Rejected status and approved wording |
| Accepted → Completed | Student | [B] | Completed status and approved next steps |
| Password reset | Student | [B] | Supabase Auth recovery link |
| Contact inquiry | Jalanin | [B] If email route chosen | Inquiry content; avoid unsafe HTML |

# 8. Data requirements and proposed schema

**[R]** Use normalized PostgreSQL tables; use database constraints and migrations. The list below is a proposed logical model rather than an already agreed physical schema. UUID primary keys, timestamptz UTC timestamps, sensible indexes, server timestamps and foreign keys apply by default.

| Entity | Main attributes | Notes / indexes |
|---|---|---|
| `auth.users` (managed) | `id`, `email`, auth data | Managed by Supabase Auth; never expose service role key |
| `profiles` | `user_id PK/FK`, `display_name`, `created_at`, `updated_at` | Minimal read-only admin student directory; sensitive fields on application snapshot |
| `admin_users` | `user_id PK/FK`, `active`, `granted_at`, `granted_by` | Trusted role table; do not rely on editable user metadata |
| `categories` | `id`, `slug`, `name`, `active` | Unique slug/name as needed; simple admin-managed category list [D] |
| `internships` | `id`, `slug`, `title`, `city`, `country_code`, `category_id`, `start_date`, `end_date`, `description`, `responsibilities`, `requirements`, `publication_status`, `featured`, `application_deadline NULL`, `published_at`, timestamps | Index `publication_status`, `country_code`, `category_id`, `start_date`; search index depending actual search needs |
| `applications` | `id`, `internship_id`, `applicant_user_id`, `first_name`, `last_name`, `email`, `nationality`, `university`, `course`, `graduation_year`, `preferred_start`, `preferred_end`, `additional_information`, `lifecycle_status`, `submitted_at`, `revision`, `reviewed_revision`, `needs_re_review`, `reopened_by NULL`, `reopened_at NULL`, timestamps | `Draft` vs submitted states; indexes on `applicant_user_id`, `internship_id`, `lifecycle_status`, `submitted_at`; `UNIQUE(applicant_user_id, internship_id)` [C]; application edit lock after quote [C] |
| `application_documents` | `id`, `application_id`, `document_type`, `private_storage_path`, `original_filename`, `mime_type`, `byte_size`, `uploaded_by`, `created_at` | Private bucket; no public URLs; CV required at submit |
| `quotations` | `id`, `application_id`, `amount_minor`, `currency DEFAULT SGD CHECK(currency = 'SGD')`, `notes_internal`, `notes_student`, `created_by`, `created_at`, `sent_at`, `revision` | Monetary amounts in integer minor units or SQL numeric with documented precision; quote revisions policy [D] |
| `placements` | `id`, `student_user_id`, `application_id NULL`, `organization`, `role`, `country_code`, `start_date`, `end_date`, `placement_status`, `created_by`, `updated_by`, timestamps | Admin-owned; enum/check `Preparing`, `Confirmed`, `Active`, `Completed`, `Cancelled`; index student/history; no auto-sync to application completion |
| `admin_notifications` | `id`, `application_id`, `event_key UNIQUE`, `event_type`, `is_read`, `created_at`, `read_at` | Durable new-application/re-review indicators; counts from persisted records; admin-only |
| `application_status_events` | `id`, `application_id`, `from_status`, `to_status`, `actor_user_id`, `reason`, `created_at` | Append-only transitions, indexed by application and time |
| `audit_events` | `id`, `actor_user_id`, `entity_type`, `entity_id`, `action`, `changes_summary`, `created_at` | Sanitized diffs only; never credentials, raw CV or tokens |
| `contact_submissions` | `id`, `name`, `email`, `subject`, `message`, `created_at`, `origin` | Needed only if storage route selected; server-side validated |
| `consent_records` | `id`, `user_id`, `application_id`, `policy_type`, `policy_version`, `consented_at` | Consent proof and version; data retention to be approved |
| `notification_outbox` | `id`, `event_key UNIQUE`, `recipient`, `template_key`, `payload_minimal`, `status`, `attempt_count`, `next_attempt_at`, `sent_at`, `provider_message_id` | Suggested reliable email dispatch and retry; avoid logging sensitive CV data |

**Data correctness rules**

1. `start_date <= end_date` on internships; graduation year and application date ranges checked against a supported range.
2. Public query only returns published internships. Student draft query returns own drafts. Admin queries require server/DB role checks.
3. Do not store file contents in Postgres or send documents as attachments in application alerts.
4. Snapshot applicant fields at submission so changing a profile later does not rewrite the original application.
5. Quote values require `amount > 0` and explicit currency; an app cannot be moved to `Quotation Sent` without corresponding persisted quotation data.
6. Non-deleted historical submissions must remain linked to their internship even if unpublished; prefer soft-unpublish over deletion.
7. Admin data export is excluded; unrestricted bulk download endpoints must not be added implicitly.
8. **[C]** Currency is SGD; application uniqueness and admin-only rejected reopening are fixed. **[D]** Confirm launch country/nationality vocabularies, time zone/date format, deadline enforcement, and records retention before final migrations.

## 8.1 Suggested RLS and storage policies

| Resource | Anonymous | Authenticated student | Admin |
|---|---|---|---|
| Published internships/categories | Read | Read | Read/write all listing statuses |
| Unpublished internships | No access | No access | Read/write |
| Profiles | None | Own minimal profile | Read basic directory |
| Applications | None | Own draft insert/read/update; submitted own read and update only in `New`/`In Review`; later read-only | Read/update workflow fields, admin-only reopen, audit required |
| Application documents | None | Upload own draft; replacement of submitted CV only before `Quotation Sent` if allowed by final file policy; no broad download | Read/download after auth check |
| Quotations/internal notes | None | None by default | Read/write |
| Audit/status history | None | None by default | Read, append server-controlled only |
| Contact inquiries | Submit through rate-limited server endpoint | Same | Read if stored |
| Placements | None | Read own placement history | Create/update/read all; full audit |
| Admin notifications | None | None | Read/mark own admin notifications; no student access |
| Admin user grants | None | None | Server owner/provisioning only |

**[D]** The proposal states CVs and supporting documents are accessible **only to authorized admins**, while students must upload their own files. Treat write/upload permission separately from read/download permission. If students should be able to download or view their own submitted CVs, that is an explicit policy exception to confirm.

# 9. Recommended technical architecture

## 9.1 Stack decision

**Confirmed MVP architecture:**

- **Web:** Next.js App Router, TypeScript in strict mode, React Server Components where appropriate, Node runtime for compatible server functions.
- **Package manager:** pnpm with a committed lockfile; one repository and one Next.js deployment.
- **Styles/UI:** Tailwind CSS or equally lean CSS modules; native HTML controls and selective accessible primitives; avoid a broad chart/UI dependency bundle unless justified.
- **Forms:** React Hook Form if form complexity warrants it, and shared Zod server/client schemas (or equivalent lightweight validation); server remains source of truth.
- **Database:** Supabase managed PostgreSQL with indexed tables, RLS, versioned SQL migrations and connection-pooling configuration appropriate to serverless hosting.
- **Auth:** Supabase Auth email/password and password recovery.
- **Files:** Supabase Storage private bucket for CVs; short-lived signed admin download URLs only after permission checks.
- **Hosting:** Vercel under Jalanin-owned account; preview deployments and environment isolation.
- **Email:** Minimal transactional provider **[D]**; use an idempotent outbox/retry mechanism or equivalent managed delivery assurance.
- **Anti-bot:** Cloudflare Turnstile server verification; rate limiting to complement it.
- **Diagnostics:** Error tracking + structured logs with PII redaction; web analytics per approved privacy policy.

**[C] Backend choice is finalized:** Supabase PostgreSQL + Auth + private Storage. Standalone PostgreSQL and other auth/storage replacements are out of the current MVP architecture unless a change request is approved. Supabase subscription tier, actual backup capabilities and recovery objectives still require operational validation.

## 9.2 High-level request/data flow

```text
Visitor / Student / Jalanin Admin
               |
           HTTPS CDN
               |
     Next.js (Vercel, one app)
        |             |
   Public SSR/ISR   Authenticated server actions/handlers
        |             |                  |
        |        Supabase Auth       Turnstile verify
        |             |
        +------ PostgreSQL + RLS --------+
                      |
        Private Supabase Storage (CVs)
                      |
               Admin-signed download

   DB event / outbox -> secured sender -> Email provider
   Errors and web events -> approved monitoring/analytics
```

**[R]** Prefer server-side reads/mutations and minimal API surface. Only make a component client-side when it requires browser interactivity. Keep filters in URL parameters; call queries from server with bounded `limit/offset` or keyset pagination when suitable. Never put Supabase service-role secrets in any `NEXT_PUBLIC_` variable or browser bundle.

## 9.3 Rendering and caching

| Page | Strategy | Cache/invalidation |
|---|---|---|
| Landing | Static/ISR | Revalidate on featured listing changes and content deploy |
| Directory | Server-rendered with cacheable published data/query strategy | Filtered results short cache; keep user-specific data out |
| Details | Static/ISR by slug or server-rendered | Revalidate publish/edit/unpublish; prevent stale application eligibility on submit |
| Auth/application | Dynamic, no public cache | Session checked on every protected request |
| Admin | Dynamic, private, `no-store` for sensitive views | Server-side authorization; no CDN caching of PII |
| Legal pages | Static/ISR | Bump policy version when approved content changes |

## 9.4 Repository and environments

```text
app/                  # App Router routes, layouts, server pages
components/           # Lightweight shared UI
features/             # internships, applications, admin, contact
lib/                  # auth, db, email, permissions, validation
supabase/migrations/   # Version-controlled SQL
public/                # Jalanin-approved brand assets
scripts/               # Maintenance and setup scripts
 tests/                # Unit/integration/e2e tests
```

**[R]** Use environment isolation for development, staging/UAT and production; define controlled seed data for staging only. Store `NEXT_PUBLIC_SUPABASE_URL`, public anon key, private DB/service keys, Turnstile secret, email provider secret, sender identity, recipient and monitoring keys in environment configuration (names are illustrative). Rotate leaked credentials and never put `.env` secrets in Git.

## 9.5 Recommended dependency discipline

**[R]** Add libraries only when they materially reduce code or risk. Avoid full-state stores for server-owned data, avoid a queue infrastructure if a DB-backed outbox suffices, avoid ORM layering if direct typed queries plus SQL migrations are simpler for this scale, avoid heavy client charts for the MVP, and prefer optimized built-in image/metadata support. Select Supabase JS/client setup using maintained official integration patterns. The exact package versions should be pinned at implementation start, not invented in this PRD.

# 10. Performance, quality and operational requirements

The following [R] numeric figures are **proposed release targets**, not values present in the supplied proposal. They require UAT measurement and owner approval.

| ID | Area | Proposed requirement / verification |
|---|---|---|
| NFR-01 | Core Web Vitals | Mobile p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 on public key pages; collect representative lab + field evidence |
| NFR-02 | Interactivity | Filter changes and form navigation give prompt feedback; no main-thread-heavy full-client listing fetch |
| NFR-03 | Query behavior | Bounded pages (e.g., 20 results/page), indexes for public filters and admin status/created timestamp; inspect query plans on realistic data |
| NFR-04 | Bundle size | Keep pages server-first; no unnecessary charting, large date, or all-purpose UI dependency |
| NFR-05 | Security | Enforced access control, input validation, HTTPS, CSRF-compatible auth patterns, safe file handling, request throttling, RLS tests |
| NFR-06 | Accessibility | Aim WCAG 2.2 AA for core workflows; labels, focus, errors, touch targets, color contrast, keyboard access |
| NFR-07 | Error handling | User-friendly error/empty states; actionable logs without passwords, tokens, raw CV contents or unnecessary PII |
| NFR-08 | Reliability | Event retries/idempotency for email; no lost status history or half-written quote/status transition |
| NFR-09 | Backups | Production DB backup schedule, retention, owner, restore steps and test documented; source proposal calls for provider-backed backups |
| NFR-10 | Recovery | Provisional RPO ≤24h and RTO ≤24h **only if verified against chosen plan/process**; otherwise determine actual recovery objectives [D] |
| NFR-11 | Privacy | Consent/version record, data minimization, retention/deletion policy and student privacy-request process agreed with legal owner |
| NFR-12 | Observability | Capture errors, email failures, application-submit failures and elevated auth failures; operator knows where to check |
| NFR-13 | Browser/device | Current evergreen Chrome, Safari, Firefox, Edge; recent iOS/Android webviews at agreed support baseline |
| NFR-14 | SEO | Valid sitemap, robots/noindex for admin/auth, canonical metadata, appropriate page titles and descriptions |
| NFR-15 | Maintainability | Strict TS, pnpm lock, formatting/lint, SQL migrations, environment docs, repeatable release/checklist |
| NFR-16 | Security QA | Critical authz and document-access tests must pass before live publication |

**[B] Hosting/accounts:** Vercel, Supabase, GitHub, domain/email/backup accounts belong to Jalanin; the proposal specifies the required paid Supabase backup subscription as **at least USD 25/month at the proposal's time**. Treat this as a project budgeting statement, **not verified current vendor pricing**. Jalanin pays third-party charges directly. GitHub access is provided from development start (proposal pp. 5-6, 12).

# 11. Search, SEO, analytics and data collection

## 11.1 Search/filter specifics

**[R]** Start with indexed PostgreSQL search over role title and location, case-insensitive, combined with country/category and predictable pagination. The matching algorithm can be `ILIKE` for small data volumes or full-text/trigram for measured needs; do not add an external search service without evidence. Record empty results, reset filters, and protect against invalid query strings.

**[D]** Confirm default sort (recommended newest published), secondary sort choices (title, soonest start date), and whether start-date control from wireframe p. 8 belongs in P0.

## 11.2 SEO and metadata

**[B]** Public internship pages get unique metadata, title, description and sitemap entries. **[R]** Add canonical URLs and semantic markup; generate only published detail page entries. Do not promise Google Jobs rich-result eligibility without checking the actual data and search-engine policy requirements, particularly missing salary/public compensation data. Avoid exposing student or admin information through structured markup, caches or source HTML.

## 11.3 Basic analytics

**[B]** Measure page views, internship views and application conversions. **[R]** Define events `page_view`, `internship_view`, `apply_clicked`, `application_draft_saved`, `application_submitted`, and optionally `contact_submitted`. Use an approved provider and lawful consent approach. Avoid sending nationality, email, CV filename or application notes to analytics.

# 12. Privacy, security, legal and operational guardrails

1. **[B]** Protect public forms using Cloudflare Turnstile and field validation. Verify Turnstile response on server against a server-stored secret; do not trust frontend success alone.
2. **[B]** Store consent to privacy policy, terms and data processing with timestamps and versions. **[D]** Jalanin provides final legal copy, data controller contact and applicable jurisdiction-specific disclosures.
3. **[B]** Store CVs and any supporting documents privately; never use public file buckets; admin access checked before download.
4. **[R]** Limit file formats/extensions, size and content signature; use random object keys, sanitize filenames and prevent path traversal. **[D]** Malware scanning policy and allowable upload sizes.
5. **[R]** Use RLS plus server-side permissions for all student/admin records. Do not trust UI-hidden buttons as authorization.
6. **[R]** Retain an append-only audit trail of material admin actions and permission changes; record no raw secrets in audit diffs.
7. **[R]** Make email events idempotent and provide support visibility for undelivered notifications.
8. **[R]** Maintain documented backup/restore drills and least-privilege access to project accounts.
9. **[D]** Define data retention for abandoned drafts, submitted CVs, rejected applications, contacts, logs, audit events and backups, plus deletion/subject access request procedure before production.
10. **[D]** Confirm whether international student data transfers require additional terms. This PRD does not constitute legal compliance certification.

# 13. Implementation plan, dependencies and delivery gates

**[B]** The supplied proposal describes approximately one month of development excluding 1-2 weeks of UAT, with a more expansive 2-3 month end-to-end design estimate; it also says no production release before defect fix/retest. Because the original 1 September 2026 kickoff date has passed, the schedule below is a **sequence of work**, not confirmed calendar dates.

| Gate | Suggested work package | Done when |
|---|---|---|
| G0 - Product decisions | Apply 20 confirmed decisions; resolve quote expiry/payment-status, rejected reopening destination, deadline semantics, privacy, support and scope approvals | P0 decision log resolved; approved scope/change-order boundary documented |
| G1 - Foundation | Jalanin-owned accounts, GitHub, pnpm/Next.js repo, Supabase project, migrations, environments, auth/role baseline | Preview deployment + protected test admin access + CI passes |
| G2 - Public experience | Landing, directory, detail, SEO, mobile styling, listing CMS | Admin publish/edit reflects publicly; stale cache tests pass |
| G3 - Student application | Auth/reset, full dashboard, form/CV/drafts, edit/re-review lock, validation/consent/submit | End-to-end application reaches New; ownership/RLS tests pass |
| G4 - Admin and notifications | Applications/students, manual placements, admin-only rejected reopening, manual completion, quotations, email + dashboard alerts, contact | Entire workflow and failure/retry scenarios pass |
| G5 - UAT and release | Security, performance, accessibility, UAT fixes, monitoring/backups, handover | Product owner signs off; restore runbook present; deployment checklist signed |

**Dependencies:** approved copy/brand assets, current-site routing decision, domain ownership, admin email addresses, auth redirect URLs, sender domain DNS verification, legal pages, budget/vendor plan approval, test/UAT participants, and initial internship records. The proposal states brand assets were available for its original kickoff (p. 12); verify remaining operational access now.

# 14. UAT acceptance test matrix

The following cases are minimum named acceptance tests; engineering should add unit/integration tests and cross-browser checks.

| Test ID | Scenario | Expected outcome |
|---|---|---|
| UAT-01 | Open legacy site and new internship entry | Legacy site uninterrupted; new entry works |
| UAT-02 | Open landing on mobile and desktop | All core sections readable; no horizontal overflow |
| UAT-03 | Search and combine country/category filters | Correct published results; predictable count and page |
| UAT-04 | Sort, paginate, browser back, malformed query | Stable results; graceful invalid query handling |
| UAT-05 | Open published versus unpublished detail | Published accessible; unpublished not publicly disclosed |
| UAT-06 | Anonymous visitor clicks Apply | Redirected through auth and returned to chosen internship |
| UAT-07 | Register/login/forgot/reset/logout | All flows valid; expired recovery fails safely |
| UAT-08 | Student saves a partly filled draft, leaves, returns | Same owned draft loads with saved values |
| UAT-09 | Student attempts final submit missing required field/CV | Specific validation; no New application created |
| UAT-10 | Student uploads valid private CV and submits | Document linked privately; exactly one New application |
| UAT-11 | Double-click submit/retry request | No unintended duplicate submission |
| UAT-12 | User A attempts to read/update user B draft | Denied at backend/database |
| UAT-13 | Student/anonymous attempts to access admin or CV URL | Denied; private document not served |
| UAT-14 | Admin creates, edits, publishes, unpublishes job | Changes audited; public cache matches state |
| UAT-15 | Admin moves New → In Review | One event, one eligible email, visible history |
| UAT-16 | Admin moves to Quotation Sent with missing/invalid quote | Server rejects transition |
| UAT-17 | Admin saves valid quote and sends | Quote/status saved together, email event tracked |
| UAT-18 | Accepted → Completed and Rejected terminal paths | Only approved transitions allowed; audit + notice emitted |
| UAT-19 | Two admins edit same application concurrently | No silent quote/status overwrite |
| UAT-20 | Email provider fails temporarily | Status remains consistent; retry/failure visible; no duplicate email storm |
| UAT-21 | Contact form valid, invalid, missing Turnstile | Correct stored/delivered result; human-readable confirmation/errors |
| UAT-22 | Consent omitted or expired version | Submission blocked or re-consent requested per approved policy |
| UAT-23 | Admin searches/paginates student/application records | Only permitted columns and bounded results load |
| UAT-24 | Site crawl/sitemap/robots check | Only allowed published URLs indexed; canonical/metadata correct |
| UAT-25 | Database restore and owner handover rehearsal | Restore steps demonstrated against approved objective |
| UAT-26 | Accessibility and performance smoke tests | Agreed NFR targets and blocker-free keyboard path |

**Additional mandatory v0.4 acceptance tests:** V04-01 to V04-10 in section 0.B.2 cover quote-stage edit lock, admin-only rejected reopening, manual completion, placement state machine, publication/deadline separation, roles and open-decision behavior.

**Release blockers:** any cross-user or unauthorized-document access, incorrect application/quotation statuses, lost submissions, untracked status notifications, missing consent, broken authentication/reset, broken data backup ownership, or unaddressed P0 UAT defect.

# 15. Decision register: clarifications needed

Ranked **Critical** when the answer changes architecture, data design, commercial scope, or legal exposure. **High** affects UX/workflow or release readiness. **Normal** can be finalized during implementation. Defaults are recommendations and should not be treated as approvals.

| Q | Priority | Question | Working recommendation / effect |
|---|---|---|---|
| Q01 | Critical | Where exactly does the internship site live: subdomain, subpath on legacy domain, or independent domain? Who edits legacy nav/DNS? | CONFIRMED: separate subdomain, provisionally internships.jalanin.com; DNS owner remains operational |
| Q02 | Critical | Who can approve/accept/reject a quotation? Does student click Accept/Reject online, reply by email, or does admin record outcome manually? | DECIDED: Student replies by email; authorized admin records acceptance/rejection and status |
| Q03 | Critical | Does `Quotation Sent` email expose quote amount, currency, terms and notes to student, or only notify them to contact Jalanin? | DECIDED: Send quotation amount, currency, and terms by email; internal notes remain private |
| Q04 | Resolved | Is online payment excluded? | CONFIRMED: no online payments; manual payment-status tracking decision still pending, not currently approved |
| Q05 | High | How should students resume drafts and see prior applications without the excluded full student dashboard? | CONFIRMED: full student dashboard, application history and manually created placement history; payment tracking pending (B02) |
| Q06 | Resolved / High | Can student apply more than once for the same internship? Can they amend a submitted application? | CONFIRMED: one record per student/internship; pre-quote edits require admin re-review; edit locked at Quotation Sent; only admin can reopen Rejected; target reopening status still pending |
| Q07 | Critical | Which status changes are allowed (early rejection, reopening, cancellation, quote revision)? What does Completed signify? | CONFIRMED: admin manually marks Completed, only admin reopens Rejected, student email reply recorded by admin; target status for reopening and early rejection policy pending |
| Q08 | Resolved / High | Which currency and tax/fee rules apply? | CONFIRMED: SGD only; quotation expiration/validity still pending (B01); tax/fee presentation and revision rules pending |
| Q09 | Critical | Which country/market choices are launch scope? Which language, time zone and date format? | DECIDED: English-only launch; countries/timezone/date display still to confirm |
| Q10 | High | Are internship dates fixed or flexible, and should a listing auto-close after start/end or an application deadline? | CONFIRMED: admin publication control and optional deadline; never auto-unpublish; deadline submission enforcement still pending (B04) |
| Q11 | High | CV formats and maximum file size? Are transcripts/ID files uploaded in MVP or only protected if they exist? | CV PDF/DOCX with agreed cap; extra docs not collected without approval |
| Q12 | High | Is email verification mandatory before an application can be submitted? | Yes recommended for sender deliverability and spam protection |
| Q13 | High | Are student status updates email-only in MVP, or must students see live status/quote history in an account screen? | Student dashboard includes own application and placement history; status visible in dashboard; quote amount/currency/terms delivered by email |
| Q14 | High | Which recipients receive new-application email alerts? Which recipient address? | Both email alert and dashboard indicator are mandatory |
| Q15 | High | Contact form fields and channel: stored admin submissions, emailed inquiry, or both? | Name/email/message; store in admin view; optionally email if approved |
| Q16 | High | Who can be an admin, how many, and who provisions/revokes access? Need super-admin or single role? | CONFIRMED: one admin role with all operational permissions; manual privileged provisioning/revocation |
| Q17 | Critical | What privacy/terms content, consent wording, data controller, retention/deletion periods and cross-border data policies apply? | Owner/legal to provide final copy before forms go live |
| Q18 | High | Which transactional email sender/provider, from-domain and reply-to? | Choose a lightweight provider already acceptable to Jalanin |
| Q19 | High | Which analytics tool and event/consent approach is permitted? Are conversion goals defined? | Privacy-respecting basic page/detail/submit events only |
| Q20 | Normal | Is start-date filtering in wireframe p. 8 mandatory, and what sort options/default should appear? | Add after/soonest-start filtering if confirmed |
| Q21 | Normal | Can admins create/edit country/category values; how are featured internships chosen? | Admin editable curated featured flag; simple category list |
| Q22 | High | Are dashboards expected to replicate p. 11 metrics, forecasting and action recommendations or only visual style? | Real operational counts and application management mandatory; forecasts and simulated metrics excluded |
| Q23 | Critical | What are actual launch/UAT dates, who signs off, and is SGD 600 still the agreed commercial baseline? | Re-baseline 2026-09-01 proposal schedule and change-request approval |
| Q24 | High | What duration of bug-fix support is included and what post-support fee applies? | Must be agreed in writing before go-live per source proposal |
| Q25 | High | Which backup plan, retention, RPO/RTO and restore owner does Jalanin approve? | Managed backups with documented restore test; validate actual plan features |
| Q26 | High | Will students view/download their own submitted CV? Who can upload later supporting docs? | Students upload/replace draft CV; admin download after submit; extra docs future |
| Q27 | Normal | Need a public About/Contact as distinct pages or landing-page sections only? | Landing sections only to minimize routes |
| Q28 | High | Does Jalanin have initial internship content, live brand assets, privacy page and approved email templates? | Use real approved content, not wireframe sample dates/roles |

# 16. Risks, dependencies, assumptions and tradeoffs

| Risk | Impact | Mitigation / decision |
|---|---|---|
| Ambiguous quote-to-acceptance rule | Incomplete user journey and email requirements | Resolve Q02-Q03 and Q07 before schema/email templates |
|---|---|---|
| Student dashboard shown in proposed enhancements | Scope creep and unplanned account UI | Full student dashboard requested; obtain written change approval |
|---|---|---|
| Admin dashboard image includes unsupported predictive cards | False metrics and extra build work | Replace with real operational counts or formally fund extra scope |
|---|---|---|
| CV privacy and personal data | High-risk PII exposure | RLS + server controls + private storage + pen tests |
|---|---|---|
| Third-party transactional email issues | Missed customer update | Outbox/dedup/retries, sender verification, operational monitoring |
|---|---|---|
| Static site and new deployment integration | Broken legacy site or unexpected routing | Decide URL/DNS ownership upfront, test separately |
|---|---|---|
| Ambiguous project dates/costs | Unrealistic acceptance expectations | Reconfirm schedule and approved changes in writing |
|---|---|---|
| Published listing changed during draft | Invalid submission or stale content | Validate listing at final submit and preserve explainable failure |
|---|---|---|
| Unclear data retention policy | Privacy/compliance and storage-cost risk | Get legal/operational retention matrix before release |
|---|---|---|
| Provider plan limits / backup expectations | Unexpected recurring cost or restore gap | Select and verify plan against target data and recovery need |

# 17. Launch readiness and handover checklist

- [ ] Final product decision register signed off; all Critical items resolved.
- [ ] Confirm approved MVP scope/change requests and revised dates/budget if needed.
- [ ] Domain/canonical routes/legacy navigation verified with Jalanin.
- [ ] Brand copy, real listings, categories, legal pages and emails approved.
- [ ] Admin accounts provisioned and least privilege tested.
- [ ] Auth, redirect, reset and protected session flows verified.
- [ ] Full Draft → New → In Review → Quotation Sent → Accepted/Rejected → Completed journey UAT approved.
- [ ] Negative authorization tests against RLS, admin routes and documents passed.
- [ ] Turnstile keys and validation enabled on production public forms.
- [ ] Email sender verified; status notification/outbox failure tests passed.
- [ ] Contact channel operational and confirmation accessible.
- [ ] Analytics/SEO/metadata/sitemap and robots/noindex verified.
- [ ] Mobile layout and agreed performance/accessibility gates passed.
- [ ] Managed database backup plan, recovery owner and restoration steps documented.
- [ ] Vercel/Supabase/GitHub/domain/email credentials owned by Jalanin; env vars documented securely.
- [ ] GitHub repository, migrations, deployment procedure, monitoring and operations handbook handed over.
- [ ] Bug-fix support coverage, escalation contact and end date agreed in writing.
- [ ] Jalanin UAT approver grants written production sign-off.

# 18. Traceability back to proposal

| Proposal location | Source material reflected in PRD |
|---|---|
| Page 1 | Project objective; visitor browsing; price suppression; landing/listings/detail; auth; application; admin and quotation |
| Page 2 | Private documents; environment/deployment/backup ownership; CRM exclusion; change control |
| Page 3 | Statuses/alerts, admin/student record filters/sorting/pagination, audit, drafts, Turnstile/consent, monitoring, SEO and analytics |
| Page 4 | Future functionality not part of confirmed MVP |
| Page 5 | Original timeline, costs, Next.js/Vercel choice |
| Page 6 | Supabase database/Auth/Storage, GitHub and step-by-step user flow |
| Pages 7-10 | Landing, directory with visible start-date filter, detail custom-quote card, application layout and Save Draft |
| Page 11 | Admin visual design; dashboard data elements treated as illustrative pending explicit scope |
| Page 12 | Client-owned accounts/assets, go-live after UAT, written scope approvals, support-term ambiguity |

---

# 19. Optional feature requirements - future roadmap only

**[F] Except where expressly promoted below, the capabilities in this section were originally outside the SGD 600 proposal. Student dashboard/application and admin-managed placement history (FUT-01) has now been requested for revised delivery; pricing, schedule, and boundaries require written change approval. All other future features remain excluded.** They appear in the proposal as suggested additional scopes. The descriptions below make them estimable in a future change request; they are not approved specifications. New journeys, privacy obligations, QA tests, vendor charges, and implementation estimates must be agreed before any work begins.

| Module ID | Future capability | Minimum scope if commissioned | Prerequisites / acceptance checkpoints |
|---|---|---|---|
| FUT-01 | Student self-service dashboard (**promoted to requested revised MVP; commercial approval pending**) | Own saved drafts, submitted application/status history, and manually managed placement history | Only own data via RLS. Quote amount/terms via email; dashboard quote amount is unapproved. Payment status remains B02 pending, not a committed dashboard feature |
| FUT-02 | Company/employer portal | Company accounts, approval/moderation, company-managed listing draft/edit, separation from Jalanin admin | Employer identity/organization model; row-level multi-tenancy; review before publish; company cannot read student applications unless explicitly approved |
| FUT-03 | Multilingual content management | Localized public pages, categories and listing content for approved languages/markets; language switch and fallbacks | Decide English/Indonesian/Mandarin/Thai/Vietnamese priority; translation authorship, SEO `hreflang`, complete key-message translations and fallback behavior |
| FUT-04 | Consultation scheduling | Student books available consultation slots; confirmations, rescheduling, cancellation | Calendar provider, timezone normalization, conflict protection, meeting medium, cancellation window; never double-book a slot |
| FUT-05 | Application scoring/qualification rules | Explainable admin-visible screening signals using education, nationality, language skills, availability and requirements | Obtain lawful/ethical screening criteria, human override, audit, consent; no automatic adverse decision without approved governance |
| FUT-06 | Internship recommendations | Student receives suggested roles matching profile/preferences and basic relevance signals | Define ranking metrics, cold-start behavior, privacy, transparency; no opaque discrimination or unreviewed eligibility claims |
| FUT-07 | Follow-up/task management | Admin tasks for document requests, quotations, payment follow-up and placement preparation; due dates and ownership | Staff-assignment/CRM-like expansion; actor roles, reminders, access policy; task creation and completion audited |
| FUT-08 | Internship waitlist | Capacity rule, waitlist registration and promotion when a slot becomes available | Listing capacity and application policy; race-safe slot allocation; email communication and expiry rules |
| FUT-09 | Cancellation/refund workflow | Record cancellation request, approval, refund eligibility and payment reconciliation | Requires agreed payment/order data model and refund policy; idempotent gateway refund with auditable outcome |
| FUT-10 | Discounts, scholarships and fee adjustments | Coupon rules or approved manual adjustments applied to quotation/order amount | Define stackability, currency, eligibility, approval permissions, quote versioning and audit |
| FUT-11 | Advanced analytics and reporting | Reporting by country, category, source, placement period, funnel/conversion and revenue | Define event taxonomy, denominators, financial data source and export rights; no predictions without grounded model |
| FUT-12 | External payment gateways | Secure payment initiation, hosted checkout, provider webhooks, payment status and reconciliation with quotation | Provider selection (Stripe/Xendit/Midtrans or other), legal merchant account, supported currencies, taxes/receipts, webhook idempotency and refund policy |
| FUT-13 | Identity/document verification | Collect and verify regulated ID/document requirements for applicable placement markets | Legal basis, country policy, retention/minimization, secure vendor or manual verification workflow; no public ID downloads |
| FUT-14 | Public/internal API and webhooks | Versioned machine interfaces and webhook events for approved partners/operations | Authentication/signatures, rate limits, scopes, versioning, replay protection, key rotation and audit; no unrestricted applicant PII |

## 19.1 Recommended ordering for future discovery

1. **[R] Student-facing quotation decision** (accept/reject or consultation follow-up) should be scoped before the broader student dashboard if it solves a real quotation bottleneck. This capability is **not in the baseline** until explicitly approved.
2. **[R] Payment integration** should come only after quote acceptance, pricing/currency, refunds, financial ownership and legal terms are specified; then attach payment status to the student dashboard.
3. **[R] Employer accounts** are a significant security boundary and should be treated as a separately designed product, not simply an added role toggle.
4. **[R] Scoring, recommendations and forecasting** need reliable and permitted data; do not add them merely to reproduce dashboard wireframe decorations.
5. **[D]** Product owner may rank FUT-02 to FUT-14 for future discovery and obtain written time/cost approval before implementation.

## Product approval record (to complete after discussion)

**Product owner:** TBD  
**Technical owner:** TBD  
**Approving administrator / UAT lead:** TBD  
**Domain/hosting decision:** Dedicated Jalanin subdomain; Next.js/Vercel + Supabase PostgreSQL/Auth/Storage (confirmed); DNS ownership TBD  
**Quote acceptance decision:** Student email reply, admin-recorded outcome (confirmed); quote expiry TBD  
**Data protection and retention decision:** TBD  
**Release target:** TBD  
**Scope baseline/version:** TBD  
**Sign-off date:** TBD

**Document status:** v0.4 remains a comprehensive **review draft** with 20 confirmed product decisions. B01 (quotation expiry) and B02 (manual payment-status tracking) remain specifically undecided. Engineering can proceed on unaffected features, but finalize B01/B02 and legal/commercial/release blockers before declaring v1.0 or production-ready scope.
