# Decision Log — Jalanin design

## 2026-10-12 — Hero-only editorial collage

User selected editorial collage and hero-only scope. Recompose the hero into independent headline/story/photo regions, with an offset indigo guidance note and an external destination caption. Retain Google Sans Flex (44–74px, 500, 1.04, −.065em), warm tokens, exact primary, original heading, and both existing CTA destinations. Reuse local Singapore photography as destination atmosphere. Mobile stacks the regions; tablet places note and photograph beside each other; desktop overlaps the note within the photograph without obscuring its caption. Existing scoped `Reveal` handles motion.

Actual MCP previews reviewed: [Maze typography-led hero](https://mobbin.com/sites/sections/26e3e993-5f8b-43a3-82a3-92893f3150b4) demonstrates oversized quiet type; [Mural photographic split](https://mobbin.com/sites/sections/3d2b9836-efb4-4c02-ab6e-d15e673019f4) demonstrates independently weighted text and photography; [Maze offset image composition](https://mobbin.com/sites/sections/692025e8-77b8-45c7-9f60-3ee6d44e0688) demonstrates irregular visual rhythm. These are secondary marketing references. Geometry, captions and the guidance note are Jalanin-specific adaptations; no reference assets embedded.

| ID | Date | Decision | Reason | Reference |
|---|---|---|---|---|
| DL-01 | 12 Oct 2026 | Primary brand `oklch(0.27 0.09 265.54)` indigo ramp replaces evergreen Clear Horizons palette | Mandatory global color from task brief + `design.md` §3 | `design.md` §3, `globals.css` |
| DL-02 | 12 Oct 2026 | Admin shell = dark sidebar (incident.io geometry), student shell = light variant, public = topbar only | Observed dark rail + light canvas; student needs calmer, reassuring surface | `incident-io-reference-audit.md` §1 |
| DL-03 | 12 Oct 2026 | No command palette, no bulk actions, no saved views, no charts/forecasts | No PRD authorization; URL-driven filters + real counts instead | PRD D06, audit §8 |
| DL-04 | 12 Oct 2026 | Lifecycle chain header (`New › In Review › …`) on application detail pages | Observed incident status chain; maps 1:1 to `transitions.ts` vocabulary | audit §6, `transitions.ts` |
| DL-05 | 12 Oct 2026 | `window.confirm` → accessible `ConfirmDialog` | Keyboard/focus requirements; incident.io confirm geometry | audit §5 |
| DL-06 | 12 Oct 2026 | GSAP only for hero/cards/form-section entrances; CSS elsewhere | Performance + reduced-motion; no animation on admin tables | `interaction-motion.md` |
| DL-07 | 12 Oct 2026 | E2E copy contracts preserved verbatim through restyle | `tests/e2e/*.spec.ts` pin landing/directory/apply strings | `design-directions.md` |
| DL-08 | 12 Oct 2026 | Mobile: sidebar → drawer (admin/student), tables → cards, detail Apply → fixed CTA bar | No mobile variants observed; standard adaptation, tested at 320–1440px | `screen-audit.md` |
| DL-09 | 12 Oct 2026 | Status colors stay semantic (sky/amber/violet/emerald/rose/slate), not all-indigo | Meaning must remain distinguishable; brand indigo reserved for primary/interactive | `design.md` §3 |
| DL-10 | 12 Oct 2026 | No payment UI, no expiry claims, no salary/fee display, no student accept/reject buttons | Unresolved B01/B02; confirmed D02/D12/D13 | `open-decisions.md` |
| DL-11 | 12 Oct 2026 | Tailwind v3 silently drops opacity modifiers (`/40`, `/95`) on `var()`-based colors and never generated `*-bg` token utilities — replaced with plain-CSS semantic classes (`.badge-rereview`, `.notification-unread`, `.overlay-dim`, etc.) | Compiled-CSS probe showed `border-warning/40`, `bg-warning-bg`, `bg-jalanin-950/50` emitted zero rules, leaving unread/overlay/badge states unstyled | `globals.css`, built CSS verification |
| DL-12 | 12 Oct 2026 | Removed segment-level `loading.tsx` files — an `opportunities/loading.tsx` Suspense boundary turned the draft-slug 404 into HTTP 200, failing the `draft.status() === 404` E2E contract | Bisected: test passes with the file removed, fails with it restored; skeletons stay available as components for explicit Suspense use | `tests/e2e/journeys.spec.ts` |
| DL-13 | 12 Oct 2026 | Fixed pre-existing landing hydration warning: raw `<script>` for Turnstile inside `ContactForm` → `next/script` with `afterInteractive` | Warning reproduced on pristine HEAD; raw script tags in client components break server/client HTML parity | `contact-form.tsx` |
# 2026-10-12 — Editorial & refined

The user selected Editorial & refined and explicitly requested Google Sans Flex. Adopt warm ivory/charcoal foundations while retaining the exact Jalanin indigo primary. Replace the boxed feature-panel hero with an asymmetrical editorial headline and local destination photography; replace boxed process cards with numbered rules. Login/signup now share a split narrative/form composition. Lucide SVGs replace rendered Unicode icons in rails, headers, and empty states. Google Sans Flex is locally served through Next.js font optimization. `design.md` v2 supersedes earlier typography and public art direction.

Evidence: [Ada careers](https://mobbin.com/sites/sections/3da0e92d-c14f-43a6-b0ae-c6ecc047e6b6), [Canva stories](https://mobbin.com/sites/sections/e4a2c1fa-0807-479c-b24f-73ee6d725ace), [incident.io list](https://mobbin.com/screens/f9757c15-2aaf-4031-9a47-8344c0f81fed). Actual MCP previews reviewed; no reference screenshot assets copied.

## 2026-10-12 — Public navigation / supplied brand assets

Final user refinement: remove the floating shell/dropdown outline and widen the header to a 1600px maximum with existing responsive outer gutters. Inner navigation spans the full shell; typography and theme tokens are preserved.

Follow-up user reference: change the header to a floating rounded surface like the supplied Coda image. Jalanin adaptation: bounded 1280px surface, 12px desktop sticky inset, 16px outer gutters, 24px corners, restrained shadow; mobile uses 8px inset/gutters and 20px corners. The disclosure stays inside the same rounded surface.

The user also requested the same expanded-navigation pattern. Adapt the supplied screenshot's soft selected tabs, two grouped link columns and photographic feature panel into an Explore disclosure using existing Jalanin destinations. The panel overlays content without pushing the page down and joins the rounded header surface. Use a static import for the latest supplied wide logo to retain its actual aspect ratio. Keep Google Sans Flex, warm ivory/charcoal and exact indigo primary; the feature uses existing Singapore destination photography instead of reference artwork.

User selected public-header-only scope and editorial & architectural direction. Use `public/logo.png` as the header brand, retaining its original artwork and aspect ratio; synchronize the App Router favicon with `public/favicon.ico`. Preserve local Google Sans Flex.

Observed secondary marketing references: [Coda](https://mobbin.com/sites/sections/5267d6c6-eeca-4050-bbae-119af1bb9106) separates logo, central links, and right-side actions with generous spacing; [Bird](https://mobbin.com/sites/sections/3369b81d-787c-4970-b49e-165e0393bc43) uses quiet horizontal rules; [Mixpanel](https://mobbin.com/sites/sections/0dd0987b-88f6-4fb0-889b-722b81b92847) distinguishes lightweight links and a pill CTA. Actual MCP preview images reviewed. These are public marketing references, not workspace evidence.

Jalanin-specific adaptation: solid warm-ivory sticky header, 100px desktop / 84px mobile height, hairline account divider, active/hover underline, and labelled Lucide mobile disclosure menu below 1024px. Escape restores toggle focus; outside click, link selection, and desktop resize close the menu. Anchor scroll padding accounts for the sticky header. Role determination remains server-side.
# Standalone editorial workspaces — 2026-10-12

User selected **Editorial studio**, **spacious for both roles**, and all in-page input/UI coverage. `/admin` and `/dashboard` now own full-height navigation, utility header, main landmark and compact workspace footer. `RouteFrame` excludes public chrome on these route families, including client-side navigation.

Jalanin-specific adaptation: deep-indigo admin rail versus ivory student rail; 36px Google Sans Flex workspace titles; rule-separated live statistics; next-step band; application rows; roomy pipeline and activity sections. No screenshot artwork embedded. Native mobile dialog provides focus containment, Escape and focus restoration. Nested routes share scoped field/button/table/form/feedback styling.

Observed references: [incident.io incidents list](https://mobbin.com/screens/f9757c15-2aaf-4031-9a47-8344c0f81fed), [home with command overlay](https://mobbin.com/screens/f7b1d160-79fc-4a70-a1f7-e553896d3ce6), [notifications](https://mobbin.com/screens/f479153e-9b68-47ad-bd5f-242132562e49). The search API exposes relevant screens, not collection enumeration; exhaustive collection coverage is not claimed.
# 2026-10-13 — User selected direction G

Subsequent user instruction: inspect and closely reproduce a suitable Mobbin reference for each non-hero section. Implemented the per-section mapping in `section-reference-map.md`, keeping the approved hero, typography, palette and 1440px shell. No backend or workspace changes.

Selected Human-centered learning from the observed [Wix Learn Mobbin hero](https://mobbin.com/sites/sections/6eae0753-3cdb-4ca3-b070-0a207d352552). Replaces the public collage composition with an inset photographic hero, centered type, compact navigation, alternating imagery and shared photographic authentication panels. Preserves Google Sans Flex and Jalanin tokens. Workspace routes excluded by explicit user request. Full adaptation/provenance/verification record: `public-direction-g.md`.
