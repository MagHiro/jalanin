# incident.io Web — Reference Audit (Mobbin MCP, 12 Oct 2026)

Source collection: https://mobbin.com/apps/incident-io-web-ba939364-061a-4808-8636-8f7e60a8dca6/dc465259-77ce-459a-9842-38412601ca5c/screens
Access method: Mobbin MCP `mobbin_search_screens` / `mobbin_search_flows` (platform: web).
Preview images were inspected inline in the tool results. No screenshots are embedded in the product.

> Rule: `Observed` = visible in a preview. `Inferred` = designer interpretation.
> `Adapted` = Jalanin-specific translation. No incident.io logos, copy, or artwork are reused.

## Collection inventory (actually returned)

Flows returned: `Incidents` (4 screens), `Home` (3), `Searching incident.io` (3),
`Declaring an incident` (13), `Status page` (4). Screens search returned 20 + 20
incident.io web screens covering: incidents list (bulk, filter, empty/loading),
home (onboarding banner, active incidents kanban, escalations), post-incident
follow-ups, command palette, declare-incident dialog, incident detail (tabs +
right rail), notifications drawer + toast, on-call tables, status pages, catalog,
workflows, settings/AI.

If a state is not listed below, it was not observed — do not claim it was.

## 1. Application shell

| Element | Observed | Screen IDs / links |
|---|---|---|
| Dark left sidebar, narrow (~200–230px), near-black plum/charcoal with white/gray text | Observed: logo tile top-left, search input, nav list with icons, active row lighter dark pill, bottom workspace card | `8343b547…` home, `149735b2…` incidents, all admin screens |
| Nav items: Search, Home, Incidents, Alerts, On-call, Status pages, Post-incident, Insights, Catalog, Workflows, Settings | Observed (labels + icons, Incidents has orange flame dot) | Incidents flow pos 1–4; Home flow |
| Collapsed icon-rail variant | Observed: one Home preview shows ~56px icon rail (no labels) | Flow `Home` pos 1 variant |
| Workspace footer card ("Engineering level 1", green snooze variant) | Observed | Home / On-call screens |
| Topbar: page icon tile + title + chevron, right-aligned Export / Filter / Save view / Declare (black primary) | Observed | `149735b2…`, `beb49f89…`, `cdf4ba88…` |
| Canvas: very light gray, cards white with hairline border, 8–12px radius | Observed | All list/home/detail screens |

Inferred: sidebar ~208–232px expanded, ~60–68px collapsed; topbar ~56–60px; card radius ~10px; hairline `1px` borders over shadows.
Adapted: Jalanin admin = dark indigo-tinted sidebar (same geometry); student = light variant of same shell; public = sticky white topbar only.

## 2. Navigation, search, command palette

| Pattern | Observed |
|---|---|
| Sidebar search input ("Search", `⌘K`-style kbd hints) | Observed, top of sidebar |
| Full command palette modal: "Type a command or search", grouped Actions / Navigation / Incidents, severity badges in results, footer kbd hints | Observed (2 variants: empty + "incident" query) |
| Breadcrumbs (`Incidents / INC-2 …`, `Catalog / Set up your services`) | Observed on detail screens |
| Tabs: Escalations / Escalation paths / Schedules / Pay calculator; Post-incident flow / Follow-ups; Active / Retrospective / Test (dialog) | Observed |
| Org switcher popover (SLMobbin, Add organization, email, Help, Contact, Preferences, Sign out) | Observed |

Adapted: Jalanin keeps URL-driven filters (no command palette — unjustified scope); breadcrumbs + tabs reuse the same geometry.

## 3. Dashboard / home cards

| Pattern | Observed |
|---|---|
| Lavender recommendation banner ("Chris recommends Set up your teams…", black CTA, integration icons right) | Observed, Home with 0/1 incidents |
| Kanban groups: "Active incidents N", columns Investigating / Monitoring / "Empty columns" (Triage / Fixing), cards with ID, title, age, severity + status pills, assignee avatar | Observed (`cdf4ba88…`, `beb49f89…`) |
| "Active escalations" section with designed empty state ("No active escalations — Rest easy…") + dashed icon | Observed |
| Zero-data home: faded card silhouettes + "No active incidents — Good news…" | Observed |

Inferred: cards dense (~14px title, 12px meta), pills 12px semibold with dot/icon.
Adapted: admin overview = real-count metric cards linking to filtered lists (never forecasts); student overview = record cards + drafts; empty states same calm tone, Jalanin copy.

## 4. Lists, tables, filtering

| Pattern | Observed |
|---|---|
| Full-width "Search incidents" input + Select all / Customise view / view-density toggles | Observed |
| Bulk bar: "N incidents selected, Deselect all, Apply bulk actions" + popover menu (Update custom field, Set severity ›, Set status, Assign role ›, Mark as test, Decline) | Observed |
| Row: checkbox, bold ID + title, severity badge (chart icon), status pill (dot), "Reported Xm Ys ago", reporter + avatar, right chevron; expanded row shows Mode + Reporter pills | Observed |
| Filter popover: field (Status), operator (is one of), value pill (Fixing), search, grouped checkboxes (Active: Fixing/Investigating/Monitoring; Post-incident: Documenting/Reviewing; Closed), Done (black) | Observed |
| Table variant: On-call Escalations (Title / Incident / Path / Latest action), flat header, row separators, no row-cards on desktop | Observed |
| Loading: centered spinner in list body on query change | Observed (`error` query screen) |
| "At a glance" aggregate table (Severity / Open / Completed %) + grouped task lists with checkboxes, assignees, kebab menus, Sort + Search | Observed (Post-incident) |

Adapted: admin applications/students/internships/placements/contacts keep server pagination + URL filters; desktop table + mobile card transformation; filter bar styled as incident.io toolbar; no bulk actions (out of scope).

## 5. Forms, dialogs, drawers, toasts

| Pattern | Observed |
|---|---|
| Declare-incident dialog: centered ~640px, tabs, labeled inputs, severity select with inline explanation, rich-text toolbar (B/I/link/lists), Cancel (ghost) + Declare (black) | Observed (Minor + Critical variants) |
| Small confirm dialog: "Delete escalation path — Are you sure…", Cancel + Confirm (red) | Observed |
| Create-folder mini-dialog: input + Cancel + Save (black) | Observed |
| Right-side drawer: "Manage in incident.io" (orange header) with textarea + parsed list; Notifications drawer (left in one variant) with NEW badge + comment feed | Observed |
| Toast: black rounded bar top-right, green check, "Successfully muted incident INC-4…" + close | Observed |
| Inline upsell/tooltip: "Your current plan does not support saved views. Upgrade" | Observed |
| Settings forms: stacked labels, helper text, checkboxes, toggles, Save (black), left sub-nav | Observed |

Adapted: Jalanin dialogs follow the same geometry (centered card, ghost + primary footer); destructive confirms red; notifications are a page + durable unread state (no socket toast); no plan-gating copy.

## 6. Badges, status, timelines

| Pattern | Observed |
|---|---|
| Severity: Critical (red solid), Major (red text + chart icon), Minor; Status: Investigating / Fixing / Monitoring / Documenting / Reviewing / Closed, Triage — pill with dot or icon, always with text | Observed |
| Detail header: lifecycle chain `Investigating › Fixing › … › Closed`, severity badge, "Ongoing for Ns" pill, Subscribe + kebab | Observed |
| Right rail: Incident Lead / Reporter / Observers (avatars), Slack link, Post-mortem, Calls, Related incidents, Timestamps, Duration metrics, Attachments | Observed |
| Tabs: Updates / Timeline / Actions / Follow-ups; Post-incident: Documenting/Reviewing checklists + progress bar "100% complete" | Observed |
| Follow-up rows: open circle / green check, owner avatar, kebab | Observed |

Adapted: Jalanin `StatusBadge` (dot + text, never color-only) maps application statuses (New / In Review / Quotation Sent / Accepted / Rejected / Completed) and placement stages (Preparing → Confirmed → Active → Completed / Cancelled) to distinct accessible pairs; timelines render committed events only.

## 7. Typography, spacing, elevation

Observed: sans UI, ~14px body, 20–24px page titles (semibold, tight), 11–12px uppercase section labels, tabular ages/counts; 4px-based spacing; hairline borders dominate, shadows only on popovers/dialogs/toasts; focus rings visible in command palette / inputs.
Inferred (not measured): 14/20 body, 12 meta, 11 eyebrow; radius 8–12 cards, 8 controls, 999 pills; sidebar ~220px.
Adapted: Jalanin tokenizes these exact roles under its own indigo ramp (see `design.md` §3); no pixel claims beyond the tokens.

## 8. Limitations — what was NOT observed

- No pixel measurements, no design-token values, no mobile/responsive variants, no keyboard-focus order, no reduced-motion behavior, no auth screens, no public marketing pages in this collection.
- Marketing-site sections (Figma/Ada/Notion careers etc. from prior research) are secondary references, not this collection.
- Do not cite incident.io text, severity names, or plan copy as Jalanin requirements.

## Reference → Jalanin mapping (summary)

| incident.io surface | Jalanin surface | Notes |
|---|---|---|
| Dark sidebar + topbar + card canvas | Admin shell (dark) / student shell (light variant) / public topbar | Same geometry, Jalanin indigo |
| Incidents list + bulk + filter | Admin applications/students/internships/placements/contacts lists | Row rhythm + toolbar, no bulk |
| Home kanban + banner + escalations | Admin overview (real counts) / student overview (records + drafts) | No forecasts, no invented charts |
| Incident detail + right rail + tabs | Admin application detail / student application detail / internship detail Apply panel | Same two-column grammar |
| Declare dialog + confirms + drawers | Internship/placement editors (pages), delete/reopen confirms, notifications | Dialog geometry reused |
| Badges + chains + timelines | StatusBadge + StatusTimeline + revision/audit history | Distinct accessible pairs |
| Toasts + notification feed | Notification center (durable) + transient form feedback | Queue vs delivery distinguished |
