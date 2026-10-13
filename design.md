# Jalanin — Product Design System & UI/UX Constitution

**Version:** 2.1 — Human-centered learning (public direction G), approved 2026-10-13
**Product:** Jalanin Internship Platform  
**Primary visual reference:** [incident.io Web collection on Mobbin](https://mobbin.com/apps/incident-io-web-ba939364-061a-4808-8636-8f7e60a8dca6/dc465259-77ce-459a-9842-38412601ca5c/screens)  
**Product authority:** `Jalanin_Internship_Platform_PRD_v0.4.md` (or latest approved revision)  
**Primary brand color (exact):** `oklch(0.27 0.09 265.54)`  
**Status:** Active typography and art direction. This revision supersedes the previous cold-indigo, card-heavy public direction. The editorial rules below take priority over older baseline guidance in this document.

## Current direction — Editorial & refined

### Public direction G — selected 2026-10-13

The user selected **Human-centered learning**, referencing the actual [Wix Learn hero on Mobbin](https://mobbin.com/sites/sections/6eae0753-3cdb-4ca3-b070-0a207d352552). Public pages now use compact navigation, a large rounded photographic hero with centered overlaid typography and outlined CTA, alternating image/text sections, and photographic auth panels. This supersedes the earlier public asymmetrical collage requirement below. Google Sans Flex and all existing color tokens remain authoritative. `/admin` and `/dashboard` are excluded from this revision.

Public outer container maximum: **1440px**, shared by navigation, main content, and both footer sections. Reading/form columns remain narrower for usability. Implementation evidence, image sources, and verification: `docs/design/public-direction-g.md`.

User-selected direction: warm ivory, charcoal typography, deep-indigo accents, expressive whitespace, and considered photography. Jalanin should feel like the start of a meaningful journey.

### Typography (mandatory for future work)

- Use **Google Sans Flex** on every surface: display, body, labels, forms, tables, legal, student, and admin.
- Load the local Latin WOFF2 through `next/font/local` (`src/app/fonts/google-sans-flex-latin.woff2`) with `display: swap`. Source: Google Fonts, Google Sans Flex v23. No runtime Google Fonts dependency.
- Display: fluid 44–74px, weight 500, line-height 1.04, tracking −0.065em. Section headings: 32–56px, weight 500, line-height 1.1, tracking −0.045em.
- Workspace titles: 30–36px, weight 500. Body: 16px/1.55; editorial supporting copy: 16–18px/28–32px. Labels: 14px; metadata: 12–14px.
- Use 600 for actions and labels sparingly. Avoid heavy bold on every heading. Use tabular numerals for operational counts, quotations, dates, and tables.

### Palette, composition, and imagery

- Canvas `#f7f6f2`, surface `#fffefa`, charcoal text `#252822`, muted text `#64685f`, rules `#dedfd5`, warm secondary `#eeeee5`. Preserve exact primary `oklch(0.27 0.09 265.54)`.
- Public layouts: 1440px outer container, approved direction-G photographic hero, reference-matched non-hero sections (see `docs/design/section-reference-map.md`), and a deep-indigo About band.
- Avoid repetitive bordered boxes, generic benefit dashboards in the hero, blurred gradient blobs, and fabricated counts/testimonials.
- Use rounded pill actions, 12–16px card corners, restrained shadows. Public photography can use a single expressive corner; data surfaces remain quiet.
- Destination photography provides atmosphere and is not evidence of a particular internship or partner. Current locally hosted Singapore image: https://images.unsplash.com/photo-1525625293386-3f8f99389edd (Unsplash). Use `next/image`, responsive sizes, and descriptive alt text.
- Use **Lucide** SVG icons at 16–24px, stroke 1.5–1.7, with labels for interactive controls. No Unicode glyphs as rendered navigation or page-header icons. `DomainIcon` adapts legacy route icon identifiers.
- Student/admin workspaces inherit the font and warm tokens, with denser tables and restrained headers. Keep semantic status colors distinct.

### Observed Mobbin evidence (2026-10-12)

Actual preview images reviewed via MCP:

- [Ada careers hero](https://mobbin.com/sites/sections/3da0e92d-c14f-43a6-b0ae-c6ecc047e6b6): generous whitespace, oversized lightweight heading, rounded CTA with directional arrow, varied photographic rhythm. Adaptation: editorial Jalanin typography and expressive destination hero.
- [Canva stories](https://mobbin.com/sites/sections/e4a2c1fa-0807-479c-b24f-73ee6d725ace): large heading and offset photograph/text composition. Adaptation: strong separation of narrative and supporting visuals.
- [incident.io incidents list](https://mobbin.com/screens/f9757c15-2aaf-4031-9a47-8344c0f81fed): dark compact rail, icon-label navigation, restrained header, scannable bordered rows. Adaptation: shared workspace navigation and quiet data hierarchy.
- [incident.io home with command overlay](https://mobbin.com/screens/f7b1d160-79fc-4a70-a1f7-e553896d3ce6): modal over a compact operational workspace. Used only as hierarchy evidence; it does not authorize adding command search.

Colors, sizing, font, copy, imagery, and geometry are Jalanin-specific design choices, not pixel measurements extracted from Mobbin. The full collection has not been enumerated. Screenshots and brand artwork are not embedded in the application.

## 0. Read me first: the design contract

1. **Reference priority:** Use the specific Mobbin **incident.io Web** collection as the primary benchmark for interface craft, compositional grammar, density, navigation, components, visual rhythm, and interaction behavior. Analyze the **actual screens and flows** via Mobbin MCP, not assumed visuals.
2. **Adapt rather than clone:** Transfer patterns, hierarchy, relationships, spacing, interaction logic, and visual quality to Jalanin. Do **not** copy incident.io branding, logos, original illustrations, proprietary text, screenshot assets, or unique artwork. Do not embed Mobbin screenshots in the product.
3. **PRD wins on functionality:** The Jalanin PRD defines routes, permissions, fields, statuses, workflows, content, and scope. Reference screens do not authorize new features.
4. **Global chromatic identity:** Primary shade `--jalanin-900: oklch(0.27 0.09 265.54)` and the related tonal ramp below; avoid incident.io's orange/burgundy brand identity.
5. **Design every surface and state:** Public, auth, student, and admin experiences must look and behave like one system, including dialogs, menu states, form errors, upload progress, empty views, skeletons, notifications, and mobile variants.
6. **Motion is purposeful:** Use GSAP where its sequencing, ScrollTrigger, or coordinated transitions measurably help. No gratuitous motion on high-frequency admin workflows.
7. **Proof of completeness:** Every route, nested screen, interaction, and visual state must be inventoried, implemented, visually reviewed, and recorded in `docs/design/screen-audit.md`.

## 1. Evidence & research protocol

### Source status
- The linked Mobbin page is confirmed to be titled **“incident.io Web | Mobbin”**, but its screenshot collection is not exposed through the public page response in this environment. **No pixel measurements, specific screen appearances, or exhaustive component coverage from that Mobbin collection have been verified here.**
- Public incident.io design notes independently describe a **more compact/collapsible sidebar, simplified page headers, scannable incident cards, contextual hover disclosure, redesigned badges/icons, and checkbox-based filters in popovers**. Treat these as **documented product patterns**, not proof that every referenced Mobbin screen displays them. Source: https://incident.io/changelog/ui-refresh-new-design-and-enhanced-user-experience (2024-06-04).
- incident.io's public brand guide lists its own colors and fonts; these are **not** Jalanin's colors or required licensed fonts. Source: https://incident.io/brand.
- Mobbin MCP is a design research integration; availability depends on an agent having configured access. Source: https://mobbin.com/mcp.

### Mandatory MCP reference audit
When the implementing agent has access to Mobbin MCP:
1. Discover the actual Mobbin MCP tools. Resolve the exact app and linked collection using the supplied URL, IDs, or tool-supported resource lookup.
2. Enumerate **every accessible screen** in the collection. Capture identifiers, titles, route/flow associations, images/reference URLs, and available descriptions.
3. Group screens into navigation, overview, list/table, detail, creation/editing, settings, forms, dialog/drawer, status/feedback, search/filter, onboarding, empty/error, mobile/responsive when available.
4. Extract **observed** details: container widths, shell geometry, header hierarchy, typography scale, color roles, corner radii, strokes, shadows, borders, whitespace, density, icon treatment, hover/focus/selected states, and motion only when shown.
5. Record `Observed in Mobbin`, `Inferred by designer`, or `Jalanin-specific adaptation` for every major visual decision.
6. Populate `docs/design/incident-io-reference-audit.md` with screen-by-screen reference mapping, evidence links, and reusable lessons. Do not claim inaccessible states were reviewed.
7. Supplement missing interaction/mobile states from relevant Mobbin examples only when needed; clearly label them as secondary references.
8. Do not treat the marketing site as interchangeable with the app UI.

## 2. Art direction

**Design adjectives:** precise, purposeful, calm, dense-when-needed, high-trust, characterful without ornament, contemporary B2B SaaS craftsmanship.

- **Shell:** Compact, coherent application shell. Desktop utility sidebar with meaningful grouping and optional collapse. Restrained header with title, contextual description/breadcrumb and only the appropriate high-priority actions.
- **Content:** Strong top-down hierarchy; clean background; white or faintly tinted panels; confident indigo emphasis; restrained status tints; hairline borders more often than heavy shadows.
- **Data:** Consistent row rhythm, alignment, column semantics, powerful filter menus, stable toolbars, paginated query-backed tables, useful truncation and hover disclosures.
- **Cards:** Minimal, scannable, meaningful summaries; include actions that appear on keyboard focus as well as hover.
- **Marketing/public:** More breathing room and a more editorial tone than the admin workspace, but inherit the same color, radii, buttons, typography, and icons.
- **Glassmorphism:** Optional, **subtle**, primarily in sticky public navigation/hero overlays and limited modal decoration. Solid or near-opaque surfaces on data-heavy dashboards and forms. Contrast and performance take priority.
- **Never:** Copy incident.io's logo, flame motif, unique illustration system or text; apply glass blur everywhere; fill admin dashboards with invented charts; introduce uncontrolled gradients or arbitrary new status colors.

## 3. Global OKLCH token system

The following ramp is a **proposed Jalanin shade system**, not a claimed extraction from incident.io. Exact base shade is mandatory. Values should be checked for actual rendered contrast in the final components.

```css
:root {
  --jalanin-50:  oklch(0.975 0.012 265.54);
  --jalanin-100: oklch(0.950 0.020 265.54);
  --jalanin-200: oklch(0.900 0.035 265.54);
  --jalanin-300: oklch(0.820 0.055 265.54);
  --jalanin-400: oklch(0.700 0.080 265.54);
  --jalanin-500: oklch(0.580 0.110 265.54);
  --jalanin-600: oklch(0.470 0.110 265.54);
  --jalanin-700: oklch(0.390 0.105 265.54);
  --jalanin-800: oklch(0.330 0.095 265.54);
  --jalanin-900: oklch(0.270 0.090 265.54); /* exact required brand base */
  --jalanin-950: oklch(0.200 0.065 265.54);

  --color-background: oklch(0.990 0.003 265.54);
  --color-surface: oklch(1 0 0);
  --color-surface-muted: var(--jalanin-50);
  --color-surface-elevated: oklch(1 0 0);
  --color-foreground: var(--jalanin-950);
  --color-text-muted: oklch(0.45 0.035 265.54);
  --color-border: oklch(0.910 0.012 265.54);
  --color-border-strong: var(--jalanin-300);
  --color-primary: var(--jalanin-900);
  --color-primary-hover: var(--jalanin-800);
  --color-primary-foreground: oklch(1 0 0);
  --color-focus: var(--jalanin-600);
  --color-selection: var(--jalanin-100);
  --color-neutral-900: oklch(0.245 0.008 265.54);
  --radius-xs: 0.375rem;
  --radius-sm: 0.5rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
  --shadow-float: 0 12px 36px rgb(8 19 51 / 0.10);
}
```

**Component mapping:** Primary buttons use 900/white, hover 800; selected navigation may use 100/900; links generally 700 or darker with distinct decoration; focus ring 600 with a secondary outline/offset; page canvas near-white; cards white; section bands 50. Disabled controls must have readable labels, not opacity alone.

**Statuses:** Create semantic `success`, `warning`, `danger`, `info`, `neutral` tokens with accessible foreground/background pairs. Their accents may vary by hue **only to preserve well-recognized meanings**, while primary brand surfaces, borders, and interactive accents use the indigo ramp. Never color all statuses indigo: meanings must remain distinguishable.

**Typography:** Google Sans Flex exclusively; use the current typography specification above. Use tabular numerals for counts, SGD quotations, and dates.

**Spacing:** Use a 4px modular scale (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`). Audit density against the Mobbin reference. Proposed desktop sidebar 224–256px expanded and 64–76px collapsed; treat these as **initial engineering targets pending actual Mobbin measurement**.

**Layout:** Propose a consistent page `max-width` for public layouts and a fluid bounded work area for authenticated layouts. Use responsive grid and flexible sidebars; avoid fixed pixel assumptions without testing.

## 4. Global component vocabulary

**Primitive UI:** `AppShell`, `Sidebar`, `SidebarGroup`, `SidebarItem`, `Topbar`, `PageHeader`, `Breadcrumbs`, `CommandSearch` (only if justified), `Button`, `IconButton`, `Link`, `Badge`, `StatusBadge`, `Avatar`, `Card`, `Surface`, `Tabs`, `SegmentedControl`, `Dropdown`, `Popover`, `Tooltip`, `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `Toast`, `Banner`, `Checkbox`, `Radio`, `TextField`, `TextArea`, `Select`, `Combobox`, `DatePicker`, `FileUpload`, `DataTable`, `FilterPopover`, `Pagination`, `Stepper`, `Timeline`, `MetricCard`, `Skeleton`, `EmptyState`, `ErrorState`, `ForbiddenState`, `NotFound`, `Confirmation`, `HelpText`.

**Jalanin domain UI:** `InternshipCard`, `InternshipMeta`, `OpportunityFilters`, `OpportunitySearch`, `ApplyCTA`, `ApplicationForm`, `DraftIndicator`, `RevisionBanner`, `ReReviewBanner`, `ApplicationHistory`, `ApplicationStatusTimeline`, `QuotationSummary`, `PlacementStatusTimeline`, `DocumentAccessList`, `StudentOverview`, `AdminOperationalMetrics`, `AdminApplicationsTable`, `AdminStudentTable`, `InternshipEditor`, `QuotationEditor`, `PlacementEditor`, `AuditTimeline`, `NotificationInbox`, `ContactInbox` (if stored).

For each component document and implement: default, hover, focus-visible, active, selected, disabled, read-only, pending, error, empty where relevant; keyboard behavior; mobile fallback; loading semantics; correct user/permission boundaries. Reuse components across screens rather than duplicating styling.

### UX rules

- **Filter popovers:** Compact controls with clear selected state, keyboard operation, Apply/Clear semantics where needed, persisted via URL query when applicable.
- **Data tables:** Server pagination, stable sort, meaningful skeletons, sticky action toolbar where appropriate, row navigation and row-level action menu that are keyboard accessible, horizontal adaptation or card transformation on mobile.
- **Badges:** Compact, consistent size, meaningful label and icon; no arbitrary color coding. Map application and placement statuses separately.
- **Forms:** Associated labels, inline error text, optional/required markers, no-loss draft saving, review summary, disabled/loading submit with idempotency.
- **Dialogs/drawers:** Intentional use: quick edit/confirm in dialog; substantial workflows in dedicated page or large side sheet. Escape, close/focus restoration, unsaved changes guard.
- **Notifications:** Durable admin notification center; transient feedback toasts; distinguish queued email from delivered email. Never display sensitive CV content in previews.
- **Locked state:** At `Quotation Sent` and later, clearly communicate student edit lock, with server enforcement maintained.

## 5. Exhaustive screen & state coverage map

The route list follows proposed v0.4 PRD routes; discover and reconcile **actual project routes**. Add any missing routes or nested overlays found in the codebase. No visual work is complete until the final route inventory and all high-value states pass visual QA.

| Surface | Route(s) / page family | Must cover |
|---|---|---|
| Public landing | `/` | Hero, trust/value, how-it-works, featured internships, About, contact CTA/footer, responsive nav |
| Opportunity directory | `/opportunities` | Search, country/category filter, sort, page, active filters, empty/error/loading, mobile filter drawer |
| Opportunity detail | `/opportunities/[slug]` | Full structured content, location/dates, requirements, Apply CTA, restricted/unpublished/not-found states |
| Public information | `/about`, `/contact` or home sections | Contact validation, Turnstile, success/failure, consent/privacy links |
| Legal | `/privacy`, `/terms` | Readability, links, version and mobile layouts |
| Auth | `/auth/sign-up`, `/auth/login` | Loading, invalid credential, form errors, verification notices, redirect return path |
| Recovery | `/auth/forgot-password`, `/auth/reset-password` | Request, success, invalid/expired token, new password flow |
| Application | `/apply/[internshipId]` | New form, draft/save, resume, upload, submission, retry, conflict, duplicate application, lock and re-review |
| Student overview | `/dashboard` | Current applications, drafts, quotation state, placement overview, empty/loading/error |
| Student applications | `/dashboard/applications`, `/dashboard/applications/[id]` | History, details, timeline, edit/revision where allowed, lock state, documents |
| Student placements | `/dashboard/placements` | Preparing, Confirmed, Active, Completed, Cancelled, empty detail/history |
| Student profile | Existing or required account route | Own identity/profile, security/account links; do not invent out-of-scope settings |
| Admin overview | `/admin` | Real operational counts, recent activity, unread alerts, contextual links, empty/loading/error |
| Admin internships | `/admin/internships`, `/admin/internships/new`, `/admin/internships/[id]/edit` | Directory, create/edit, validation, publish/unpublish, confirm, archive/deadline UI |
| Admin applications | `/admin/applications`, `/admin/applications/[id]` | Filters/search/sort/page, revision/re-review, audit, status actions, quote composition, CV access |
| Admin students | `/admin/students`, `/admin/students/[id]` | Search/sort/page, basic profiles, related applications, permissions |
| Admin placements | Actual in-app route, if separately implemented | CRUD, transitions, timeline, cancellation, history, student relation |
| Admin notifications | Actual in-app route or shell panel | New application alert, unread/read, deep link, empty/errors |
| Admin contacts | `/admin/contacts` if submissions are stored | Inquiry list, detail, state, protection and abuse filtering |
| System states | `not-found`, `error`, `loading`, `forbidden` and overlays | Expired session, unauthorized, no data, no search results, maintenance fallback, retry |

**Special rule:** Deferred payment tracking and quotation expiry are unresolved in v0.4; do **not** add payment widgets or expiry badges merely to match reference screenshots. Do not show prohibited salary/program price on public listings. Other Suggested Additional Scopes remain excluded.

### Cross-cutting state matrix
For every screen, log coverage of: initial/normal, hover/focus, loading/skeleton, empty/no-data, filtered-zero, validation error, network/server error, success confirmation, unauthorized/forbidden, mobile, tablet, desktop. For critical forms include unsaved, partial draft, invalid file, upload in-progress, duplicate submission, resumed draft, locked submitted application, admin re-review required.

## 6. GSAP animation rules

GSAP is approved **selectively**. Only client components requiring coordinated motion should import it. Avoid unnecessary global GSAP loading and avoid animations on every table row.

- Install `gsap` and optionally `@gsap/react` where the project benefits. Use `useGSAP`/`gsap.context` to scope selectors and `revert()` on cleanup; dynamically import on view-specific components when useful.
- Use GSAP for: landing hero reveal, featured cards entrance (only within sensible viewport boundaries), intentional route/shell transitions, complex application step transitions, subtle sidebar expansion coordination, and lightweight celebratory completion states.
- Consider ScrollTrigger **only on public/marketing sections** with clearly measurable UX benefit. Lazy-initialize and clean up. Never hijack native scroll.
- Prefer CSS transitions or browser-native movement for hover/focus, dropdowns, tooltip/drawer behavior, skeletons, and small state changes; avoid conflict with Radix/shadcn focus management.
- Respect `prefers-reduced-motion`; functional content must never depend on finishing an animation.
- Performance guardrails: animate `transform` and `opacity`, avoid sustained `backdrop-filter`/`filter` animation, no layout thrashing, no scroll-linked animation in heavy admin lists, reasonable entrance durations (illustrative: 180–450ms, not a brand mandate).
- Add motion tests: reduced motion, navigation interruption, unmount cleanup, no invisible content on failed JS, no focus trap breakage, no layout shift.

**Possible implementation sketch (adapt to version):**

```tsx
'use client';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);
export function GentleReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo('[data-reveal]', { opacity: 0, y: 12 }, {
      opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06, clearProps: 'all',
    });
  }, { scope: ref });
  return <div ref={ref}><div data-reveal>{children}</div></div>;
}
```

Do not generalize the sample into a global document-level animation selector. Avoid hiding server-rendered content by default.

## 7. Accessibility, responsive, and performance gates

- **Accessibility:** WCAG 2.2 AA target, keyboard tab order, focus visible, aria/state semantics, semantic form errors, screen reader status updates, minimum comfortable touch targets, contrast check of token combinations.
- **Responsiveness:** Test 320, 375, 430, 768, 1024, 1280, 1440 px, plus intermediate breakpoints with actual overflow. Sidebar must become an appropriate mobile navigation pattern; tables require purposeful small-screen handling.
- **Performance:** React Server Components where possible, limited client islands, lean icon subset, optimized images/font loading, no unnecessary animation libs beyond GSAP, no massive blur panes, test build and vitals on representative routes.
- **QA tooling:** Browser automation/Playwright screenshots in desktop/mobile sizes; compare geometry and visual logic against references **without copyrighted asset reproduction**. Test loading, filters, create/edit/submit, admin status, drawers, toasts, failure states, permissions, and file upload.
- **Quality bar:** A design audit must verify every screen above is built from the same tokens and component system, including edge cases and authenticated shells.

## 8. Required living design documentation

Keep the following in repo and update with design changes:

```text
design.md                                    # design constitution; source of truth
docs/design/incident-io-reference-audit.md  # observed Mobbin screens and evidence links
docs/design/screen-audit.md                  # routes x states x viewports x status
docs/design/component-catalog.md            # tokens/components and usage
docs/design/interaction-motion.md            # GSAP versus CSS usage, exceptions
docs/design/decision-log.md                 # departures from reference + reasons
```

For each significant change, record screenshot evidence when possible, update components/tokens rather than one-off CSS, and revise the screen-audit result.

## 9. Delivery order and completion test

1. Inspect PRD and routes, build exhaustive route/state inventory.
2. Connect Mobbin MCP, enumerate the specific incident.io collection, document evidence.
3. Produce a reference-to-Jalanin mapping and selected layout system.
4. Implement global tokens, typography, shared shells, components and responsive behavior.
5. Redesign public flows, authentication, student flows, then admin flows.
6. Add selective GSAP micro-interactions and reduced-motion behavior.
7. Execute browser-based QA on **all** routes and critical modal/form states.
8. Fix visual inconsistencies and behavioral regressions, update docs.

**Definition of done:** Every in-scope route and interaction has reference-informed visuals, token consistency, mobile/desktop rendering, state coverage, accessibility checks, no broken business logic, and a recorded QA outcome. If Mobbin MCP was inaccessible, mark the reference audit **blocked**; do not misrepresent the result as exact incident.io fidelity.
