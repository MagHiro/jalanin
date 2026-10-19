# Authenticated workspace overhaul — 19 October 2026

## Scope and decisions

This is a **visual, accessibility and navigation refresh** of `/admin` and `/dashboard`. Keep route-level authentication, existing services, lifecycle state machines, persisted data and server validation unchanged. No simulated revenue or platform activity and no new business feature scope.

## Design research

Mobbin references consulted for layout/navigation and dense operational interfaces:
- [Mixpanel analytics UI](https://mobbin.com/screens/3f2332fc-27be-4825-af3d-b935e977a638)
- [Square operational records](https://mobbin.com/screens/85857182-8f04-4314-b06e-29df202cf84a)
- [Shopify management UI](https://mobbin.com/screens/7c5875cc-c53f-4721-9ea5-5380c32044fa)

Only interaction and layout patterns informed the design, not copied assets. Jalanin's indigo palette, warm accent and typography identity remain.

## Delivered

- Unified responsive rail and sticky utility toolbar across authenticated routes; visible current navigation, session identity, quick actions and keyboard navigation search (`Cmd/Ctrl + K`).
- New typographic hierarchy, compact metrics, card density, row states, table tokens, focus rings, responsive spacing and accessible contrast.
- GSAP animation for entering content and quick navigation, fully disabled under `prefers-reduced-motion`; no delayed data or blocking transitions.
- Searchable `WorkspaceSelect` component with optional multi-select and hidden form values. Server-side query filters remain the source of truth.
- `DateInput` retains native date parsing, locale picker and validation, with explicit accessible calendar button. Other text, checkbox, radio, file and textarea controls share workspace styling.
- `RecordActions` contextual links on internship records; destructive actions were not added without established delete workflows.
- Real lifecycle distribution in the admin overview and status breakdown for student applications; counts come solely from existing authorized queries.
- Helpful actions for empty/filter states; no fabricated sample records.

## Validation / release

GitHub CI on main checks TypeScript, ESLint, unit tests, Next.js production build and Playwright. Review CI and verify form keyboard behavior, filter submissions, mobile navigation and authenticated responsive pages with real data before considering the redesign fully signed off.

## Requirements traceability

Related existing scopes: admin overview/review queue, internship management, placements, student application list, notifications and role-specific navigation. No API, database schema, payment, authorization or lifecycle changes. This update is presentation-layer only.

## Visual refinement — 19 October 2026 (second pass)

The first pass was too ornamental. This pass closely follows the UI composition of the [Stripe dashboard reference](https://mobbin.com/screens/673e89af-fe9e-4ab9-ac27-435dedf21888): a slim pale navigation column, grouped small-icon labels, quiet selected-row fill, an unobtrusive utility header, prominent summary metrics, and compact structured operational panels. Also reviewed [Midday's accounting dashboard](https://mobbin.com/screens/647eb31b-b5b8-4af5-bc99-0dab7dfc5d03) as an alternate navigation treatment. Jalanin's own brand name, icons, colors and application-specific data are retained.

Changes: removed the redundant sidebar marketing card, replaced the dark admin rail with a shared light indigo-tinted rail, removed KPI left-side accent stripes and decorative diagonal-arrow affordances, reduced ornamental headings, and used a reusable layered-shadow elevation system for cards, toolbars, tables and forms. Main overviews now use a data-first grid with real application counts, statuses and recent actions. A Playwright assertion checks that overview cards have no left border and do have a shadow.

This is a presentation redesign; there are no fabricated records, no new permissions, and no new lifecycle transitions.

## CRM record workflow and typography compliance — 19 October 2026

**Design source of truth:** `design.md` v2.1, section “Typography (mandatory for future work)”. The local Latin Google Sans Flex WOFF2 remains loaded by `next/font/local`; the workspace explicitly inherits it. Workspace titles are fluid 30–36px at weight 500; body copy is 16px / 1.55; 14px labels and actions use 500–600 sparingly; row metadata is 12–14px; dates, counts and revisions use tabular numerals. The canvas and surfaces now use the warm `#f7f6f2` / `#fffefa` system without altering `--jalanin-900`.

**Reference audit:** [Attio CRM directory](https://mobbin.com/screens/e8183328-914b-4606-a87f-876733c421e4) and [Attio CRM record management](https://mobbin.com/screens/dbf84920-56a9-4511-99fd-405be4082530) were retrieved to orient dense table semantics, along with the previously recorded [incident.io incidents list](https://mobbin.com/screens/f9757c15-2aaf-4031-9a47-8344c0f81fed) from the design constitution. The current implementation adapts these applications' *list-first information architecture* rather than copying copyrighted branding or artwork. Data model, tabs, labels and user actions are Jalanin-specific.

**Operational routes and concrete behavior**
- `/admin/applications`: URL-backed lifecycle views, persisted re-review view, status/search/sort form, visible filter reset, sortable applicant/submission headings, revision and date columns, review links. Pagination remains service-backed (20 per page).
- `/admin/internships`: published/draft/unpublished views, title/location/status/date table, sortable supported columns, edit and published public-listing actions.
- `/admin/students`: actual profile directory table (name, profile reference, joined, updated). The service exposes only profile fields, so no made-up lead-stage, owner, email or score column.
- `/admin/placements`: lifecycle views, role/organization/country/date/status table, existing edit action and 20-row service pagination.
- `/admin/contacts`: searchable contact inbox (name, email, subject), collapsible full message, dates, explicit `mailto:` reply. Never imply that the system sent an email or tracks response state.
- `/admin/notifications`: persisted unread/all views, application links and existing server-authorized mark-read action; status labels reflect the DB.
- `/dashboard/applications`: student-scoped all/submitted/draft views with distinct review vs resume actions, no fabricated status changes.
- `/dashboard/placements`: student-owned placement rows with dates, status and optional expandable notes, read-only.

The list primitives `CrmViews`, `CrmFilterChips`, `CrmTableMeta`, `listHref` and shared record-table CSS give all pages the same row rhythm, keyboard focus, mobile records, responsive overflow and honest empty states. Query-backed views and page navigation are shareable and browser-history-compatible. No unapproved payment, CRM lead assignment, export, destructive bulk edit, or workflow mutation has been introduced.

**QA qualification:** Browser regression adds workspace typography weight, route-specific CRM tabs and filter routing. CI validates lint, typechecking, unit, build and responsive authenticated Playwright; production/staging visual sign-off with populated tables still needs human review.
