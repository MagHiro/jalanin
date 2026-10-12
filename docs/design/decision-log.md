# Decision Log — Jalanin design

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
