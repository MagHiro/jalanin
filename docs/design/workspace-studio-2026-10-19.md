# Workspace Studio — new UI direction, 2026-10-19

This pass intentionally replaces the **visual direction** of the previous workspace overhaul. Legacy CSS remains loaded for uncommon component behaviors, but the last-loaded `workspace-studio.css` is the new design authority for all authenticated admin and student surfaces. Do not treat older workspace screenshots as the target.

## Reference-based design decisions

- [Revolut Business overview (Mobbin)](https://mobbin.com/screens/642f8ac1-17b9-4735-a453-4efa31969116): operational metrics and a clear sidebar-to-content structure. Adaptation: live Jalanin metrics and a deep-indigo rail, not third-party artwork.
- [Square operations overview (Mobbin)](https://mobbin.com/screens/a2391f45-04cb-4081-8f5c-f197ac6ea8ba): restrained panels and scannable information. Adaptation: a true application-status distribution bar instead of an invented trend chart.
- [Whop management list (Mobbin)](https://mobbin.com/screens/0ec7fd15-b0bd-4c4d-9a6d-c67cbef1c1f4): search/filter/action composition. Adaptation: existing server-backed URL filters, clear active views, and accessible row actions.

These links are reference inspiration, not pixel-for-pixel reproductions. No Mobbin screenshot assets, original logos or proprietary copy are added. The design stays within the product's business rules.

## Implementation coverage

| Route family | Implemented in this pass |
| --- | --- |
| `/admin`, `/dashboard` | Unified editorial overview masthead, independently clickable live KPI cards, timeline/list panels, clear next actions |
| `/admin/{applications,internships,students,placements,contacts,notifications}` | Global navigation, hierarchy, table geometry, filters, status badges, search, row menus, mobile record layout |
| `/dashboard/{applications,placements}` | Consistent list/record hierarchy, filter views, mobile record handling, application actions |
| Nested record and editor routes | Section surfaces, typography, forms, calendar, dropdown, focus and help states, editor action bars |
| Responsive shell | Deep-indigο collapsible rail, mobile drawer, lower navigation, quick page search with keyboard shortcut |

## Control and state coverage

- Native form submission and server-side validation are preserved.
- Date and date-time fields have an editable HTML input for native validity and a branded calendar popover; date-time adds an explicit time entry and Apply step.
- Multi-select shows a selected count, clear-all, and Done; keyboard Escape and arrow navigation remain available.
- Tables keep URL-backed filters and pagination, now with visible numbered page navigation.
- Existing real zero-data states retain meaningful descriptions and next actions; no fabricated seed metrics or charts are introduced.
- GSAP remains constrained to scoped route and popover entrances with reduced-motion checks. Hover/focus interactions use CSS transitions.
- Footer, dialog, responsive surface, error and disabled states all use the new tokens.

## Production validation

Typechecking, linting, unit tests, build, and E2E are delegated to the repository's CI workflow on direct-main commits. Browser screenshot comparison is **not** claimed: a graphical authenticated browser was not available in this session. Check GitHub Actions for the exact latest run outcome and inspect desktop/mobile routes before an irreversible rollout.
