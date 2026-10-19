# Screen-by-screen Mobbin reconstruction — 19 October 2026

Direct reconstruction of UI geometry and patterns across every authenticated page, not generic design inspiration. The source screens were selected using Mobbin search. Jalanin retains its own identity, local Google Sans Flex font, real data, authorization rules and state machines; screenshots, logos, proprietary illustrations and brand text from third parties are not embedded.

## Route-to-screen reconstruction

| Jalanin routes | Specific Mobbin screen | Reconstructed components |
| --- | --- | --- |
| /admin | [Stripe dashboard](https://mobbin.com/screens/673e89af-fe9e-4ab9-ac27-435dedf21888) | divided real-data metric ribbon, utility bar, operational activity and recent submitted records |
| /dashboard | [Stripe dashboard](https://mobbin.com/screens/e56b763c-5f8a-4002-bfa1-05f9b0341f38) | metrics, application list, progress and contextual next action |
| /admin/internships | [Attio CRM directory](https://mobbin.com/screens/bbd875eb-f4c3-4600-bbd6-44da33761528) | attached views, compact records and actions |
| /admin/internships/new and /admin/internships/[id]/edit | [Linear editor](https://mobbin.com/screens/60fb29a7-f5c7-4df0-a7bc-6290d3f0ec93) | field density, select/calendar controls and split context |
| /admin/applications | [Homerun candidate management](https://mobbin.com/screens/80dfe542-7c1b-4303-a449-b4f465d615fe) | status views, applicant table and contextual communication |
| /admin/applications/[id] | [Attio person record](https://mobbin.com/screens/d76ba56f-98c3-463f-9e1d-bbe4831ee47a) | record identity, status sequence, documents, sticky actions |
| /admin/students | [Attio people](https://mobbin.com/screens/50e23384-5853-455c-9e3a-6ef80b2ec216) | avatar-led searchable directory |
| /admin/students/[id] | [Attio person profile](https://mobbin.com/screens/cf4f2b49-652f-4c76-8a7c-1ea4f57c10cf) | identity, related-record lists, account properties |
| /admin/placements and /dashboard/placements | [Attio list](https://mobbin.com/screens/1feec693-b9aa-4028-8c79-0271a6b7e4d5) | status views, compact records and related actions |
| /admin/placements/new and /admin/placements/[id]/edit | [Linear editor](https://mobbin.com/screens/6bd32918-97a5-45ec-bd95-efe367207a22) | grouped compact form with workflow context |
| /admin/contacts | [Attio CRM list](https://mobbin.com/screens/bbd875eb-f4c3-4600-bbd6-44da33761528) | compact inbox, expandable message rows and email replies |
| /admin/notifications | [Stripe activity](https://mobbin.com/screens/3ac28d1f-3058-4190-a369-ab4e5ef27a42) | read/unread views and related action list |
| /dashboard/applications and /dashboard/applications/[id] | [Attio list and record](https://mobbin.com/screens/d76ba56f-98c3-463f-9e1d-bbe4831ee47a) | draft views, student-owned details, timeline and resume editing |

## Every component type covered

Shared rail and workspace search; masthead and action toolbars; list views and count badges; URL-backed filters, native form submissions and pagination; table, mobile records and row-action menus; profile properties and activity; status history, document access and transitions; calendar and search-enabled select popovers; input, textarea, checkbox and file states; reduced-motion-aware GSAP transitions and keyboard focus; compact guidance for genuinely empty datasets.

## Integrity and QA

User data, status transitions and private document controls remain backed by existing server-side authorization. Never insert fake metrics or sample activity. This is a reconstruction of layout and component grammar, not a claim of automated pixel extraction or pixel-perfect visual-diff parity. Staging screenshots with populated records still require human visual review.

GitHub CI checks typecheck, lint, unit tests, production build and browser routes. The extra browser spec checks real dashboard records, CRM lists, both editor forms and narrow-screen overflow.
