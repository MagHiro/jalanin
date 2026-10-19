# Jalanin — Fieldnotes

Implemented product design system · 19 October 2026

## Direction

Homepage hero refinement: the stepped-path hero is replaced by the existing
local `work-together.jpg` photograph, priority-loaded through Next Image. A large
asymmetric crop and restrained caption pair with the original headline and CTA.
The Pathway graphic remains available for other existing uses.

Fieldnotes pairs editorial discovery with a focused operational workspace. Large,
closely tracked Google Sans Flex headings, off-white space, deep Jalanin blue,
and an original stepped-path illustration communicate movement and possibility.
Surfaces group related information; outlines are reserved for focus, date-today
indicators, and cases where separation is functionally necessary.

This document replaces all earlier visual directions. Functional requirements,
authorization, data contracts, and lifecycle rules remain authoritative in their
existing product and engineering documents.

## Research actually consulted

Mobbin MCP searches included website sections, individual screens and flows.
The returned preview images were examined. These are principles, not replicas:

| Source | Applied principle |
|---|---|
| [SSENSE editorial](https://mobbin.com/sites/sections/4de98a06-dbff-4e54-83c6-a301c519bba0) | Confident typography and open negative space; its serif is not adopted |
| [Ditto homepage](https://mobbin.com/sites/sections/0fad7b67-08fd-4559-abbf-32eb65f84e01) | One coherent graphic composition; its purple palette is not adopted |
| [Braintrust jobs](https://mobbin.com/screens/82f14032-d3bf-45d7-85ba-0611f75b0a59) | Role-first hierarchy and immediately available filters |
| [SuperHi learning](https://mobbin.com/screens/86e8f0df-ce01-4176-bdf8-3e7f93e4b161) | A clear next action alongside current work |
| [Twingate resources](https://mobbin.com/screens/3d0051cf-fdf8-4bed-a8d8-863efff311f5) | Quiet tables, lightweight views and generous row spacing |
| [Tripadvisor dates](https://mobbin.com/screens/70cfee88-b811-4e75-9384-d750fedb42f6) | Uncluttered month grid with distinct navigation and selection |
| [Employment Hero select](https://mobbin.com/screens/44ea903e-55c1-4a02-8430-30682ec50acc) | Search inside a constrained option surface |
| [Qatalog confirmation](https://mobbin.com/screens/ebd304f8-fab1-4804-be7c-dce121a6966d) | Concise confirmation with one clear continuation |
| [Deputy application flow](https://mobbin.com/flows/39b243dd-d98c-4a7b-aa0a-53598cee249f) | Persistent section orientation, focused fields and explicit document feedback |
| [Meetup login flow](https://mobbin.com/flows/01a754b1-44fe-4ef7-99c7-54722f920822) | Focused account task and clear recovery route; no new identity providers |
| [Basedash filtering flow](https://mobbin.com/flows/5484023f-abe7-43ca-b5d1-460350ed6fc9) | Keep filter context close to data; render only real counts |
| [Hootsuite account drawer](https://mobbin.com/screens/155a6fa5-52e6-466e-b3b3-6333eb747dd6) | Separate navigation from account actions; this is a desktop reference |

The WRITER result from the initial mobile-navigation search was unrelated and
was excluded. Static screenshots cannot establish animation timing; motion
choreography is original rather than claimed to reproduce reference behavior.

## Implementation ownership

- `src/app/fieldnotes.css`: authoritative presentation, responsive layouts,
  surface tokens and control states.
- `src/app/globals.css`: Tailwind and lower-priority structural compatibility
  rules, contained in the base cascade layer.
- `src/app/layout.tsx`: imports only these two stylesheets; retains the exact
  locally hosted Google Sans Flex variable font implementation.
- `src/components/graphics/pathway.tsx`: original decorative route diagram.
- `src/components/motion/`: scoped GSAP enhancement and motion tokens.

Do not reintroduce the retired public-design, workspace-refinement,
mobbin-replica, workspace-studio or chapters stylesheet imports.

## Color

| Token | Value / purpose |
|---|---|
| `--primary` | Existing `--jalanin-900`, `oklch(0.27 0.09 265.54)` |
| `--primary-hover` | Existing `--jalanin-700` |
| `--background` | `#f6f7f9`, main canvas |
| `--foreground` | `#17243c`, ink |
| `--surface` | `#ffffff`, grouped content |
| `--secondary` | `#e9eef6`, supportive surfaces |
| `--muted` | `#edf0f5`, input surfaces |
| `--muted-foreground` | `#59677c`, secondary text |
| `--accent` | `#aac8ff`, light-blue accents on dark blue |
| `--ring` | `#426fca`, visible keyboard focus |
| `--border` | `#e1e7ef`, only purposeful separators |

The original Jalanin blue ramp is retained. Semantic success, error, warning and
information tokens continue to describe actual states. Status badges include
text, so meaning never relies on color alone. No fabricated metrics or claims.

## Type and space

Google Sans Flex remains the sole primary family, locally served at weights
100–1000. Display type is typically 48–96px, weight 500–520, line-height
0.99–1.08, tracking −0.06 to −0.075em. Page headings are 34–52px; section titles
36–68px. Operational section headings are 22–24px. Body is 14–16px with generous
line-height; editorial supporting copy can be 19px. Uppercase metadata is
10–11px with 0.1–0.14em tracking. Numeric data uses tabular numerals.

Public content has a 1440px maximum including gutters, with 20px mobile gutters
and up to 80px desktop gutters. Section rhythm is 48px mobile / 72px desktop.
Workspace navigation is 224px desktop, collapsible to 76px. Workspace content
uses responsive 24–64px gutters and a 1500px maximum. Most grouped surfaces
use 24–32px internal space. Radii are 6–8px for controls, 10–12px for panels,
and circles only for avatars and calendar dates. Shadows are limited to floating
menus and dialogs.

## Page compositions

Discovery refinements: a compact blue-tinted directory masthead, role-icon cards,
and a detail page with location/date facts, section anchors and a dark-blue apply
panel. Student placements are responsive record cards with expandable notes;
the empty state provides direct application and discovery actions. Individual
student placement information stays within each card rather than a new route.

Student profiles use a blue identity mark, linked count strip, application cards
with submitted education context, placement outcomes and a compact account
sidebar. The technical account reference is available in a disclosure.
Student application details pair a location/date opportunity header and compact
submission grid with a connected event timeline and quotation guidance. Drafts
show a continuation card; existing editing eligibility remains unchanged.

Admin application records use an applicant identity masthead, education and
availability highlights, stacked-label snapshot fields, file rows and a connected
audit timeline. A separate review column holds existing workflow controls and
internship context. Status highlighting uses committed events, not an assumed
linear progression; all transitions still come from the workflow module.

- **Home:** asymmetric display headline and original path diagram; a quiet
  editorial introduction; two-column opportunity index; stacked process steps;
  split blue story/photo section; contact form and large footer invitation.
- **Directory:** wide two-column heading, contextual count, filter workspace,
  two-column role entries. URL-backed GET filtering and pagination are retained.
- **Opportunity:** editorial title, labelled content sections and sticky desktop
  application summary; fixed mobile application action.
- **Accounts:** focused form beside original path artwork. Mobile puts the
  account task before supporting artwork. Recovery, verification and error
  screens use the same controls and typography.
- **Application:** anchored section index beside the real form. All sections
  remain mounted, preserving native validation, FormData and explicit draft
  saving. This is a guided single-page form, not a new multi-step state machine.
- **Student:** open masthead, grouped real counts, recent applications and a
  blue next-action panel, followed by progress and placements.
- **Admin:** compact light navigation, open masthead, grouped metrics, real
  pipeline, review queue and recent submissions. Record lists use views,
  contextual filters and airy tables. Detail and editor routes use the same
  white/blue surface hierarchy.
- **Legal/support:** document navigation and readable text column; shared
  error, not-found, empty and loading presentation.

## Components

Input values use regular-weight 15px text; labels own the 8px control gap.
Date inputs and their 44px calendar triggers share a grid cell, avoiding inherited
offsets. Application date pairs stack on narrow phones. Upload guidance persists
after selection and is associated with the native file input.

Internship creation and editing share four numbered sections: essentials, dates,
role details and publishing. Anchor shortcuts orient the editor; writing prompts
and publication guidance sit next to the relevant fields. Sidebar navigation,
secondary links and logout use matching 14px labels and 20px icon columns.
Collapsed desktop logout uses a labelled icon button; mobile retains its label.
Workspace sidebar places the rail toggle beside the logo in a shared header row.

**Buttons:** 44–48px minimum primary interaction height, 8px radius, iconless
where practical. Primary blue, secondary muted blue. Hover changes surface;
press scales subtly. Disabled controls retain native disabled semantics.

**Fields:** borderless muted surfaces, 50px default height, 15px text, 13px
labels, visible 2px focus ring with offset. Textareas resize vertically. Native
select fallback receives the same surface and chevron. Validation uses the
existing server errors and native constraints; no business rules moved client-side.

**Select/multi-select:** shared searchable popover, 44px option rows, selected
checkmark and tint, Arrow/Home/End/Enter/Escape handling, active option scroll,
selected-count summary, Clear/Done actions. Hidden values retain FormData
contracts and are disabled along with the control. Long lists scroll locally.

**Calendar:** 7-column month grid, outside-month muting, circular selection,
outlined today, disabled min/max dates, 44px month actions. Arrow keys move
between visible days; editable native date values remain available. Date-time
uses an explicit local-time input and Apply. Mobile picker is viewport-centered.

**Uploads:** a neutral upload surface, clear file selector, filename/size
feedback, existing PDF/DOCX and 5MB checks, unchanged private server upload.
The file input is functional; no unsupported drag-and-drop behavior is advertised.

**Records:** borderless outer table surface, restrained header tint, 22px row
padding, clear name/secondary metadata hierarchy and local horizontal scrolling.
Existing mobile record lists replace desktop tables where implemented.

**Dialogs:** native modal dialog focus containment and restoration, dimmed
backdrop, limited elevation. Existing busy-dismiss prevention is retained.
Workspace mobile navigation and command search use native dialogs.

**Feedback:** status text and badges, inline alerts with live roles, functional
empty-state action, skeleton loading boundaries. Notifications continue through
the existing inbox/outbox behavior rather than a new notification subsystem.

## Motion

`motion/tokens.ts` defines quick 180ms, control 240ms, reveal 550ms and story
850ms durations, `power3.out`, 55ms stagger and 16px default movement.
`PublicMotion` uses `useGSAP` and ScrollTrigger for hero copy/graphic entrances,
progressive section reveals and a small diagram parallax. Path nodes receive a
coordinated scale reveal. `Reveal` uses `useGSAP` for grouped form sections.
Workspace page changes, command search, select/calendar opening and confirmation
dialogs retain scoped GSAP contexts/tweens with cleanup. CSS handles small button
and surface hover/press responses.

HTML starts visible. Reduced motion disables animation and CSS transitions.
There is no scroll hijacking, indefinite decorative loop or pinned narrative.
Reference previews are static: no claim is made that their motion was observed.

## Responsive and accessibility

Primary breakpoints: 767px mobile, 1024px desktop workspace navigation, and a
1100px composition adjustment. Mobile uses one-column discovery, stacked
sections, horizontal application-section links, a navigation dialog and a
bottom workspace shortcut bar with safe-area space. Controls and popovers stay
within viewport bounds. Keyboard focus is explicit even without borders.

Retain semantic headings, labels, landmarks, skip links, aria-current navigation,
live feedback, native field constraints and Escape dismissal. Decorative SVG is
hidden from assistive technology. Never infer application lifecycle history
from a visual ordinal: continue using the shared workflow logic and real events.

## Route coverage

Public: `/`, `/opportunities`, `/opportunities/[slug]`, `/privacy`, `/terms`.
Accounts: `/auth/login`, `/auth/sign-up`, `/auth/verify`,
`/auth/forgot-password`, `/auth/reset-password`, `/dev/login`.
Application: `/apply/[internshipId]`.
Student: `/dashboard`, `/dashboard/applications`,
`/dashboard/applications/[id]`, `/dashboard/placements`.
Admin: `/admin`, `/admin/internships`, `/admin/internships/new`,
`/admin/internships/[id]/edit`, `/admin/applications`,
`/admin/applications/[id]`, `/admin/students`, `/admin/students/[id]`,
`/admin/placements`, `/admin/placements/new`, `/admin/placements/[id]/edit`,
`/admin/contacts`, `/admin/notifications`.
Shared: root error/not-found and admin/dashboard/apply loading boundaries.

Verification evidence and qualifications are tracked in
`docs/design/fieldnotes-verification.md` and `docs/requirements-matrix.md`.
