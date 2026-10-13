# Public direction G — Human-centered learning

Selected by the user on 2026-10-13.

## 1440px follow-up

Public navigation, main content (including every landing section), footer invitation and footer links share `--public-max-width: 1440px`. Narrower legal and form reading measures remain intentional. Hero responsive sizes match the wider container. Public 404 and error states now use the same quiet rounded presentation, scoped to `.public-site` so workspace fallback styles are unaffected. Added a 1920px viewport test asserting the 1440px centered boundaries, landing section containment, and public 404 presentation.

## Reference and decisions

**Observed in Mobbin:** [Wix Learn hero](https://mobbin.com/sites/sections/6eae0753-3cdb-4ca3-b070-0a207d352552): compact horizontal navigation, inset rounded photographic hero, centered overlaid headline with highlighted phrase, outlined pill CTA. Actual returned preview reviewed. Screenshot is not used in the application.

**Jalanin-specific adaptation:** local Google Sans Flex with existing display scale; ivory/charcoal/indigo and existing pale accent; collaboration photograph; alternating process/photo section; split indigo About section; open contact form; photographic directory heading and authentication panels; ruled detail content; application intro panel; typographic legal pages and large footer invitation. Admin and dashboard excluded through `.public-site` wrapper. Existing data, filters, forms, validation and workflows retained.

**Inferred by designer:** responsive stacking and GSAP choreography. Motion cannot be inferred from the static Mobbin preview.

## Image provenance

Locally hosted Unsplash photographs (atmospheric imagery, not claims of actual Jalanin participants or partners):

- `/images/learning-together.jpg`: https://images.unsplash.com/photo-1522071820081-009f0129c71c (landscape collaboration scene).
- `/images/work-together.jpg`: https://images.unsplash.com/photo-1521737711867-e3b97375f902 (portrait collaboration scene).
- `/images/singapore.jpg`: existing locally hosted destination image, source recorded in design.md.

Rendered through next/image with responsive sizes; hero prioritized. No Mobbin screenshot assets embedded.

## Components and motion

- `public-design.css`: public-scoped layout, responsive and color composition.
- `PublicMotion`: GSAP hero image scale and staggered copy, IntersectionObserver-triggered section entrances. Scoped GSAP contexts reverted on unmount; live reduced-motion changes revert motion. Native scrolling; content visible without JS.
- `AuthStory`: shared photographic panel for login, signup, recovery/reset.
- Existing cards, navigation, contact and application forms retain their behavioral contracts.

## Verification

- Lint and TypeScript pass; production build passes (39 generated pages).
- Chromium viewport checks: landing, directory, login and privacy at 320/375/430/768/1024/1280/1440px; no horizontal overflow.
- Chromium accessibility smoke: keyboard CTA, labelled GET filters, native required auth validation, apply login gate and focus styling.
- Added browser checks: navigation interruption, live reduced motion, no-JS content/CTA, signup/recovery/reset/terms/detail at 320 and 1440px, mobile menu dismissal and full-page screenshots.
- One development-console failure on login at 1280px passed on isolated rerun. A build overlapping a development run encountered generated-module interference; serial production build passed.
- Desktop and 320px hero screenshots and desktop full-page composition reviewed. Full-page screenshot evidence in `/tmp/opencode/jalanin-g-{mobile,desktop}.png` (ephemeral).
- Authenticated application mutation tests and hosted auth/email/storage were not re-run in this presentation-only revision. Existing backend/DB/authz/state unit/integration coverage remains applicable; no backend schema or service changes made by this revision.
