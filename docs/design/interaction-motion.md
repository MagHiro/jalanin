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
