# Interaction & Motion — Jalanin

## Policy

GSAP (`gsap` + `@gsap/react`) is approved **selectively**. Everything ordinary
(hover, focus, dropdowns, tooltips, drawers, skeletons) uses CSS transitions
(140ms controls / 180ms surfaces, ease-out). No GSAP on admin data tables.

## Where GSAP is used

| Surface | Effect | Implementation |
|---|---|---|
| Landing hero | one-time rise/fade of headline, copy, CTAs, support panel (staggered) | `Reveal` with `data-reveal` children, `useGSAP` + `gsap.context` scope, `revert()` cleanup |
| Featured / directory cards | gentle stagger-in on first viewport entry only | `Reveal` with `stagger: 0.06`, `once: true` |
| Application step sections | fade/slide on section mount | `Reveal` per `form-section` |
| Sidebar expand/collapse | width coordination | CSS transition only (no GSAP) |
| Completion states | single subtle emphasis (e.g. draft-saved alert) | CSS only |

## Guards

- `prefers-reduced-motion: reduce` → no GSAP transforms; content renders in final state (never hidden by default; `fromTo` with `immediateRender: false` semantics — server HTML stays visible if JS fails).
- `clearProps: 'all'` after entrance; animate `transform`/`opacity` only.
- No ScrollTrigger on admin/student record pages; public sections only, lazy, cleaned up.
- Tests: unit-test the reduced-motion guard; E2E copy contracts unaffected (text present regardless of animation).

## Exceptions log

- No command palette (unjustified scope; URL filters instead) — see `decision-log.md`.
- No bulk-action menus (no bulk mutations in PRD).
- `window.confirm` replaced by accessible `ConfirmDialog`.
# Public header refresh — 12 Oct 2026

Floating follow-up: selected tabs use CSS color/background transitions; expanded desktop Explore panel opens immediately, overlays content and dismisses on Escape, outside click, focus exit, selection or breakpoint change. No added animation dependency.

Public navigation uses 160ms CSS color/underline transitions, disabled under reduced motion. Mobile navigation is an immediate disclosure (no GSAP dependency), with Escape focus restoration and link/outside/desktop-resize dismissal. Sticky-header scroll padding keeps anchor destinations visible.
# Workspace motion — 2026-10-12

`WorkspaceShell` scopes GSAP to its content container. Route changes use an 8px / 320ms content entrance; no individual operational row sequencing or ScrollTrigger. `useGSAP` reverts on route updates/unmount; `gsap.matchMedia` disables entrances for reduced motion and reacts to preference changes. Server content is visible without JavaScript. Hover/focus remain CSS. Mobile navigation uses a native modal dialog with browser focus containment and Escape/focus restoration.

Chromium workspace tests exercise reduced-motion rendering, non-reduced route navigation, navigation away/back, mobile dialog dismissal and focus restoration.
# Direction G public motion (2026-10-13)

`PublicMotion` adds GSAP hero image/copy sequencing and one-shot IntersectionObserver section entrances. Native scroll preserved; visible SSR content; live reduced-motion media matching; observers disconnected and GSAP contexts reverted on cleanup. Browser tests cover interruption, reduced-motion changes, and no-JS navigation. See `public-direction-g.md`.
