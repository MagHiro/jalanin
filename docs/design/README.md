# Active design system

The current Jalanin frontend design contract is [Chapters](../../design.md), implemented in `src/app/chapters.css`, the shared components under `src/components/`, and the public and workspace routes under `src/app/`.

Other files in this directory reflect past exploration and implementation history. They are **not** normative for new design decisions and must not be used to restore retired visual language. In particular, do not treat old screenshots or design concepts as higher priority than the current implementation.

### Maintain
- Google Sans Flex as the only primary typeface; existing Jalanin deep-blue anchor.
- Original editorial compositions for public pages and practical information density for logged-in product workflows.
- Shared accessible borderless controls, styled date picker, form state feedback and clear focus indicators.
- Reduced-motion support and scoped GSAP cleanup.
- Real data and preserved server-validated workflows. Do not introduce fake records or metrics.

Changes to implemented components must be reflected in `../../design.md`, tested with the existing repo CI, and visually reviewed on mobile and desktop before merging.
