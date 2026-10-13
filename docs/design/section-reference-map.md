# Non-hero Mobbin reference map — 2026-10-13

Actual MCP preview images inspected for all references below. Hero preserved; `/admin` and `/dashboard` excluded. Layout relationships closely reproduced in local Google Sans Flex, existing ivory/charcoal/indigo colors and the 1440px public boundary. Reference branding, photography, copy, counts and unsupported product features are not imported. Responsive arrangements and motion are Jalanin-specific adaptations, not observed animation evidence.

| Surface | Inspected reference | Observed and implemented layout |
|---|---|---|
| Intro statement | [Sana](https://mobbin.com/sites/sections/43cb59b0-b00d-4b19-ba13-e910fd4b0f1e) | Short left statement; substantial right-column explanation with generous whitespace. No invented numbered claims. |
| Featured / opportunity directory | [Vanta](https://mobbin.com/sites/sections/4388b797-146a-491b-ad47-82fab8951d60) | Centered directory introduction, filter band, white grouped role list, category/title left, location and trailing action right. Dates retained as required domain metadata. |
| How It Works | [Clay](https://mobbin.com/sites/sections/28c16d19-1b1c-4c38-b06e-660c77901cbc) | Heading and CTA above four equal rounded numbered tiles. Existing four application steps retained. |
| About | [Resend](https://mobbin.com/sites/sections/bba6377d-4b63-44d8-9884-a23cb2eefb06) | Dark section, centered heading/body/action, wide image below. Indigo replaces black; labelled destination image avoids implying stock people are Jalanin staff. |
| Contact | [Savor](https://mobbin.com/sites/sections/ae1f5fe6-9420-45e4-b097-64ae2aa8c06e) | Small bottom-aligned left contact block, large right introduction and understated underlined fields. Existing field labels, validation and Turnstile retained. |
| Footer | [Kit](https://mobbin.com/sites/sections/010cfdb2-641a-487c-be55-e5e5b83c6989) | Dark background, left brand statement, grouped navigation columns and contrasting CTA. Fewer columns reflect actual site scope. |
| Detail | [Dovetail](https://mobbin.com/sites/sections/906f9500-b731-4d80-82e5-08ffe8514caf) | Wide reading column with ruled stacked sections and narrow elevated right application panel. No fabricated team profiles. |
| Auth and recovery | [Replit](https://mobbin.com/screens/b75fa638-3243-4d4e-9cca-aee6d48307cc) | Form left, full-height photograph right, restrained form width. Existing email/password and recovery flows only. |
| Application form | [Mercor](https://mobbin.com/screens/327648ec-d6a5-441d-bd17-fb40a6401904) | Left section labels, right field groups, thin section divisions; scoped to public application so dashboard form remains unchanged. |
| Legal | [Upwork](https://mobbin.com/sites/sections/628dc701-15b6-4444-9517-591272c30e8f) | Left document navigation with active rule and right reading column. Existing draft notices and legal copy retained. |

Navigation and error/empty feedback continue the established direction-G component system. No separate screenshot match claimed for these states. Public hero JSX and hero CSS remain unchanged in this pass.

## Verification

Checks tracked in `tests/e2e/public-design.spec.ts`, existing public viewport QA and accessibility suites. Browser checks cover 320–1440px, 1920px container alignment, public routing/filter keyboard use, menu dismissal, no-JS content and reduced-motion cleanup. Authenticated application visual state testing and hosted auth/email integrations are separate from the anonymous browser sweep.

Results: lint, TypeScript, production build and diff whitespace check pass. All 38 public browser scenarios passed across the initial sweep and targeted reruns. Two motion/no-JS tests required scoping the hero CTA selector after About gained an outlined CTA; two auth console checks passed on isolated rerun. Desktop full-page composition and auth screenshot reviewed; screenshot capture now waits for image decoding after viewport changes. Authenticated application visual states remain unverified in this pass.
