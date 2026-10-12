# Jalanin design system — incident.io-informed indigo (supersedes Clear Horizons)

Version 2.0 · Light theme + dark admin rail · English · October 2026

> Supersedes the v1.0 "Clear Horizons" evergreen direction. Primary brand is
> now exactly `oklch(0.27 0.09 265.54)` (`--jalanin-900`, sRGB ≈ `#112252`)
> with a 50–950 OKLCH ramp. Visual grammar follows the incident.io Mobbin
> audit in `docs/design/incident-io-reference-audit.md`.

## Tokens

Tokens are CSS custom properties in `src/app/globals.css`, mapped through `tailwind.config.ts` for semantic Tailwind usage.

| Token | Value / intent |
|---|---|
| Primary base | `oklch(0.27 0.09 265.54)` (`--jalanin-900`); hover `--jalanin-800` |
| Ramp | `--jalanin-50…950` OKLCH indigo ramp (hue 265.54) |
| Primary foreground | White |
| Canvas | Near-white indigo tint `oklch(0.99 0.003 265.54)` |
| Surface / muted | White / `--jalanin-50` |
| Text primary | `--jalanin-950` |
| Text secondary | `oklch(0.45 0.035 265.54)` |
| Border / focus | `oklch(0.91 0.012 265.54)` / `--jalanin-600` |
| Dark rail (admin) | `oklch(0.225 0.05 265.54)` with `--rail-foreground/muted` |
| Success / warning / error / information | OKLCH semantic pairs with explicit text labels |
| Email-safe brand hex | `#112252` (sRGB fallback for HTML mail only) |

Contrast target is WCAG 2.2 AA for text and focus. Status always includes visible text; color is supplemental. No dark theme is implemented for MVP.

## Typography

Use the platform sans stack (`Inter`, `ui-sans-serif`, system UI, sans-serif) to avoid new external font requests and layout shift. Hierarchy: responsive display 36–56px; page heading 28–36px; section 20–24px; card 16–18px; body 16px/1.6; compact body 14px/1.5; caption 12px/1.4. Keep prose measures near 65–75 characters.

## Layout and spacing

Use a 4px base rhythm (1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24 units). Public content max width 1160px; reading content 760px; auth form 440px. Page gutters 20px mobile, 32px tablet, 40px desktop. Typical section gap 64–96px public and 24–40px app. Breakpoints follow Tailwind defaults: 640 / 768 / 1024 / 1280px. Admin sidebar target 224px; compact mobile navigation is horizontally scrollable with visible active treatment.

## Surfaces

- Standard: opaque white, 1px semantic border, 16px radius.
- Elevated: white, same border, soft shadow for popovers/dialogs only.
- Glass: compact header/overlay only, surface at 90% with blur, border; solid surface fallback and reduced-transparency override.
- Form section: opaque white, border, 16px radius, 24px padding desktop / 16px mobile.
- Tables: flat header row and subtle row separators; avoid individual row cards on desktop.

## Radius, shadow, focus

Control radius 10px, card 16px, large section 24px, pill 999px. Use one subtle elevation and one modal elevation (tokenized `--shadow-subtle` / `--shadow-modal`). Focus uses a 3px indigo ring (`--ring`) with 2px offset, never color-only selected indicators.

## Motion

CSS transitions only: 140ms controls, 180ms surface changes, standard ease-out. Respect `prefers-reduced-motion: reduce`; do not animate critical task completion or state transitions in ways that delay action.

## Component inventory / implementation map

Shared primitives (`src/components/ui/`): `StatusBadge` (dot + text, wraps
`statusBadgeClass`), `EmptyState`, `PageHeader`, `InternshipCard` (landing +
directory), `StatusTimeline` (committed events only), `ActiveFilterChips`
(URL-driven removal). Global classes in `globals.css` (`@layer components`):
`.eyebrow`, `.btn` + `.btn-primary/.btn-outline/.btn-ghost/.btn-sm`, `.field`
+ `.field-label/.field-hint`, `.alert` + success/warning/error/info, `.badge`
+ `.badge-dot`, `.form-section`. Feature components remain the functional
source: `auth/auth-form.tsx` (password visibility, brand panel on sign-up),
`applications/application-form.tsx` (5 grouped sections, upload feedback),
`contact/contact-form.tsx`, admin `internship-form`, `placement-form`,
`transition-controls`, `reopen-control`. Shells: `layout/site-header`
(glass, sticky), `site-footer`, `app/dashboard/layout.tsx` (student tabs),
`app/admin/layout.tsx` (sidebar + unread badge). No extra component library
was added; no animation library; platform font stack. Domain status/workflow
rules remain in `src/lib/workflow/` and services — components never duplicate
transition tables.

## Responsive and accessibility rules

- At 320px, use 16px page gutters and allow controls to wrap; no fixed-width panels.
- Touch targets are at least 44px where practical; controls retain visible labels.
- Tables switch to labeled record rows/card layouts where columns cannot retain identity and actions.
- All errors associate with form controls and announce through the existing semantic form flow.
- Keyboard focus remains visible; skip link remains first interactive control.
- Translucency is removed under `prefers-reduced-transparency` where supported and replaced by solid surfaces.

## Handover and QA coverage

### Screen coverage (12 October 2026 — full pass)

- [x] Public landing (E2E copy contracts preserved), opportunities directory (chips, sort, pagination), internship detail (sticky panel + mobile CTA bar), footer/legal navigation.
- [x] Shared public/mobile navigation and global semantic token/focus/motion foundation.
- [x] Login, registration (brand panel), forgot-password (check-email state), reset-password (visibility toggle) + callback.
- [x] Application form (5 grouped sections, upload feedback, draft/submit, lock states) + apply page shell.
- [x] Student shell (tab nav) + overview, applications list (draft/submitted split), application detail (timeline + quotation explainer), placements.
- [x] Admin shell (sidebar, unread badge) + operational overview (real counts, activity), applications (desktop table + mobile cards), application detail (snapshot/docs/quotes/revisions/timeline/actions), internships, students + record, placements + create/manage, contacts, notifications.
- [x] Contact form states, privacy/terms (draft banners), 404, empty/error/loading states per screen.

### Findings / QA (12 October 2026)

- `pnpm typecheck` clean, `pnpm lint` clean, `pnpm test` 37/37 pass, `pnpm build` green (43 routes, shared first-load JS 87.3 kB — unchanged, no new deps).
- Playwright E2E against seeded local Postgres: 9/9 API-level tests pass (admin lifecycle, re-review block, reopen, placements, sitemap/robots, authz denials). 11 browser-rendered tests cannot launch here — Chromium system libs (`libglib`) are uninstallable without sudo. This is environmental, not a code failure.
- SSR verification performed instead (dev server + curl): all E2E-asserted strings present (landing headings, `published N placements`, filter placeholder/button, Apply Now, auth labels); draft slug 404s; anonymous apply/dashboard/admin redirect to login with `?next=`; cross-student record 404s; every admin/student route returns 200 with the E2E seam; robots/sitemap correct.
- Contrast computed for all text pairs (body 15.49, primary 6.44, muted 5.82, hero 5.74, alerts 7.3+) and all badge pairs (7.9–11.9): every pair passes WCAG 2.2 AA for normal text.
- Markup a11y verified: skip link, banner/main/contentinfo landmarks, associated form labels, `role=status/alert/note`, visible `:focus-visible`, reduced-motion + reduced-transparency fallbacks, `min-w-0`/`overflow-x-auto` guards on tables/navs.
- No image/font/animation dependency added. Platform font stack avoids font downloads; blur limited to sticky header + mobile bars with solid fallbacks.
- Product blockers remain authoritative: B01/B02/B07/B08; B09 commercial approval for expanded student dashboard/manual placements/editing; B10 content. No payment UI, quote expiry claims, fee display, or student accept/reject actions were introduced.
- Remaining follow-up for environments with a working browser: run the 11 rendered Playwright tests, capture 320/375/430/768/1024/1280/1440px screenshots, and run an automated axe pass in CI.
