# Mobbin-informed section refresh — 13 October 2026

This pass builds on the existing [section reference map](./section-reference-map.md) and the approved Jalanin indigo/ivory Direction G. Mobbin MCP was searched separately for the website hero, careers directory, application steps, About, contact, footer, opportunity detail, application form, authentication, and student/admin workspaces. The site uses pattern inspiration only; no third-party copy, logos or screen assets are embedded.

## Section-to-reference map

| Jalanin surface | Mobbin UI reference | Applied adaptation |
|---|---|---|
| Hero | [Wix Learn](https://mobbin.com/sites/sections/6eae0753-3cdb-4ca3-b070-0a207d352552); new candidate [Lightship](https://mobbin.com/sites/sections/99fe8788-b376-4838-84a4-185e8511f69f) | Editorial photographic inset with left-aligned high-contrast type, accessible primary CTA, supporting destination note on large screens and preserved mobile scroll affordance. |
| Introduction | [Sana](https://mobbin.com/sites/sections/43cb59b0-b00d-4b19-ba13-e910fd4b0f1e) | Two-part mission text with a third, locally hosted collaboration-photo column and small caption. |
| Featured opportunities and directory | [Vanta](https://mobbin.com/sites/sections/4388b797-146a-491b-ad47-82fab8951d60) | Readable ruled role rows, better metadata hierarchy, visible data-backed result heading, accessible URL-driven filters. |
| How It Works | [Clay](https://mobbin.com/sites/sections/28c16d19-1b1c-4c38-b06e-660c77901cbc); new candidate [Braintrust](https://mobbin.com/sites/sections/3269321e-bdad-48fc-a49b-c1126a3fed77) | Four clearly numbered responsive tiles, distinct alternating tonal surfaces, intact validated workflow wording. |
| About | [Resend](https://mobbin.com/sites/sections/bba6377d-4b63-44d8-9884-a23cb2eefb06) | Deep-indigо statement with wide Singapore destination photo and explicit location caption, not implied staff imagery. |
| Contact | [Savor](https://mobbin.com/sites/sections/ae1f5fe6-9420-45e4-b097-64ae2aa8c06e) | Split editorial invitation and high-contrast form surface; labels, validation, submission and Turnstile unchanged. |
| Footer | [Kit](https://mobbin.com/sites/sections/010cfdb2-641a-487c-be55-e5e5b83c6989); new candidate [Twenty](https://mobbin.com/sites/sections/27b07cc4-07a2-48ee-9e1b-26302f5c9858) | More deliberate high-contrast CTA, oversized closing statement, accessible grouped navigation and compact legal line. |
| Opportunity detail | [Dovetail](https://mobbin.com/sites/sections/906f9500-b731-4d80-82e5-08ffe8514caf); new candidate [Remote](https://mobbin.com/screens/94a9646f-0b81-4a30-b166-86edbfd3dc2c) | Wider headline and structured description sections, existing sticky application panel and mobile CTA. |
| Auth, recovery and application | [Replit](https://mobbin.com/screens/b75fa638-3243-4d4e-9cca-aee6d48307cc), [Mercor](https://mobbin.com/screens/327648ec-d6a5-441d-bd17-fb40a6401904) | Refined focus and card geometry on existing split auth and grouped application forms; no auth or upload logic changed. |
| Student and admin workspaces | [Squarespace](https://mobbin.com/screens/832bf878-b38c-49f8-9ba3-26e63f5fb818), [Toggl Track](https://mobbin.com/screens/350128d2-62fa-4a48-8307-47e41fe7fce7), new candidate [Wellfound](https://mobbin.com/screens/7a621947-a24a-4e2d-88e2-4f82e71af178) | More legible stat actions, next-step panel, operational rows, consistent interactive focus and responsive padding; real counts and authorization preserved. |
| Legal | [Upwork](https://mobbin.com/sites/sections/628dc701-15b6-4444-9517-591272c30e8f) | Existing left document index and reading column retained; keyboard hover/focus state refined. |

Pre-existing mapped references above are documented as visually inspected in the repository. New search results are recorded as exploration candidates, not claims of pixel-exact reproduction or observed motion.

## Guardrails

- No backend routes, authentication checks, schemas, quotations, emails or status-transition logic changed.
- Existing content strings required by functional tests remain present.
- All imagery remains served from existing local assets; no screenshots or third-party logo assets are shipped.
- Progressive enhancement: content and links remain available without JavaScript, and transitions honor reduced motion.
- Layout uses the existing 1440px public boundary and keeps workspace-specific rules separate.

## Verification status

Extended Playwright regression coverage for landing sections and directory at 320, 375, 768 and 1440px. CI/build and authenticated browser screenshots must be verified on the PR branch; this connector-only change was not locally executed against a running application.
