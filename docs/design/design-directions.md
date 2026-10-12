# Design directions — Jalanin

## Existing constraints

The approved product is a trustworthy internship discovery and application platform for Southeast Asia. No formal public identity assets are present in the repository. Existing implementation uses an emerald/white palette; preserve the recognizable green direction while refining it. Public listings must not show fixed fees or salary, quotation replies are by email, and admin counts must be real database-derived figures.

## Three concepts

| Concept | Brand fit | Accessibility | Performance | Mobile usability | Complexity / maintainability | Trust | Task efficiency |
|---|---|---|---|---|---|---|---|
| A — Editorial Minimalism | High: warm, human and opportunity-led; can retain evergreen accent. | High when neutral contrast and typography are controlled. | Excellent: mostly CSS and static content. | High with clear text-first stacking. | Low; easy to maintain. | High for public and student flows. | Medium-high; admin may need more structured density. |
| B — Modern Glass SaaS | High as a premium student experience if selectively used. | Medium by default; translucency must not reduce contrast. | Medium; blur is expensive on large/scrolling surfaces. | Medium-high if glass nav remains compact and mobile fallback solid. | Medium; surface variants need discipline. | High when forms and data remain opaque. | Medium-high. |
| C — Contemporary Product UI | Medium-high: practical and controlled, less expressive publicly. | High with consistent focus and semantic states. | Excellent. | High when tables have a designed compact representation. | Low-medium; familiar components. | High for operational records. | Excellent for admin. |

## Selected direction: “Clear Horizons”

Use Concept B as a small accent in compact navigation and overlays, anchored by Concept A’s editorial spacing and Concept C’s precise task hierarchy. This is one coherent system: warm off-white canvas, deep evergreen text/action, restrained pale mint surfaces, and a small apricot/amber highlight. Public pages are more spacious; student pages are reassuring and record-oriented; admin pages use tighter but still readable spacing. Forms and primary reading surfaces remain solid and high contrast.

### Principles

1. **Opportunity first:** headline and role content lead; supporting decoration never competes.
2. **Transparent states:** label the actual workflow state and next allowed action; never imply expiry, payment, or progress not in the data.
3. **A calm canvas:** warm neutrals and thin borders define sections; use shadow only to indicate elevation.
4. **Selective depth:** compact sticky header/dialogs may use a translucent surface with opaque fallback; never place long-form text on glass.
5. **Responsive by intention:** search controls wrap, forms stack, and admin records switch to compact cards where columns stop fitting.
6. **Motion with purpose:** short hover/focus feedback only, respecting reduced motion.

## Screen direction

- Public: editorial hero and clearly labeled discovery CTA, simple how-it-works sequence, featured opportunities as meaningful cards.
- Listings/detail: search and filters stay URL-driven; role information is structured and price-free.
- Authentication: focused, narrow form surface within shared public shell.
- Application/student: solid form sections, clear draft/submitted/re-review messages, timeline reflecting actual state.
- Admin: compact app shell, stable nav, real metric links, readable operational tables and responsive record cards.

## Superseded (12 Oct 2026 implementation run)

> The "Clear Horizons" evergreen direction above is **superseded** by the
> incident.io-informed indigo system: primary `oklch(0.27 0.09 265.54)`,
> dark admin rail, light student rail, `docs/design/incident-io-reference-audit.md`
> as visual evidence. The constraints below (price-free listings, reply-by-email
> quotations, real DB counts) remain authoritative.

Direction confirmed as **Clear Horizons** — no new concepts introduced. Fresh Mobbin evidence
(Phase 2 pass in `mobbin-research.md`: Glassdoor, Sana AI, Wellfound, Peerlist, Mercor,
Cofounder, Teachable, PayPal, Dropbox, Figma/Notion careers) reinforces the same conclusion:
editorial public hierarchy + compact operational admin + narrow focused auth. Glass remains
limited to the sticky site header and overlays.

**E2E copy contracts are load-bearing.** `tests/e2e/journeys.spec.ts` and
`accessibility.spec.ts` assert landing headings (`Internships across…`, `How It Works`,
`Featured`, `About Jalanin`, `Contact us`), the opportunities result count and filter
placeholder, and the Apply Now link. The redesign preserves these strings verbatim while
restyling around them — visual polish must never rename asserted copy.
