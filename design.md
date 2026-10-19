# Jalanin / Chapters — implemented product design system

Updated: 19 October 2026
Implementation branch: `feat/mobbin-editorial-overhaul-20261019`
Status: frontend design implementation and verification in progress.

## 1. Creative direction

**Chapters** is Jalanin's original editorial/product design direction: an expressive public experience for finding an internship and a focused, high-density operating environment for applications and administrative work. The governing principles are precise typography, inviting spaciousness, quiet field surfaces, purposeful motion, and visible progress. The public site tells a career-journey story; authenticated interfaces make actual records and actions the center of attention.

Borderless by default does **not** mean deleting accessible focus treatments. Use contrast, grouping and proximity first. Use lines only where information scanning or safety requires them. Do not use the ornamental diagonal arrow as a routine action symbol.

## 2. Foundations and canonical implementation

The original local Google Sans Flex variable font is retained in `src/app/layout.tsx` and `src/app/fonts/google-sans-flex-latin.woff2`. Do not substitute Inter/Geist for the primary interface. Use features already provided by the local font rather than downloading a third-party file.

The existing deep-blue identity `oklch(0.27 0.09 265.54)` remains the primary anchor (`--jalanin-900`). The system extends it through muted blue and near-white surfaces, as implemented in `src/app/chapters.css` (imported last in the root layout).

Current core tokens:

| Purpose | Token | Value |
| --- | --- | --- |
| Deep brand | `--jalanin-900` / `--primary` | `oklch(0.27 0.09 265.54)` |
| Brand dark | `--jalanin-950` | `#111f48` |
| Interactive mid-blue | `--jalanin-600` | `#345bb9` |
| Soft primary surface | `--jalanin-50` | `#eef3ff` |
| Canvas | `--background` | `#f7f9fd` |
| Ink | `--foreground` | `#182447` |
| Surface | `--surface` | `#ffffff` |
| Secondary surface | `--secondary` | `#edf2fb` |
| Muted text | `--muted-foreground` | `#65728e` |
| Focus | `--ring` | `#537ce6` |

Other implemented tokens cover elevation, corners, interactive timing and reduced-motion overrides.

## 3. Typography and composition

- Display: Google Sans Flex, 650–720 weight, tight tracking (about -0.045em to -0.079em), short editorial lines.
- Section headings: responsive `clamp` sizing, controlled line-length and generous section separation.
- Operations: strong page headings, compact metadata, tabular numerals and legible data density.
- Labels: 0.68–0.82rem where appropriate, high-contrast text, selective uppercase tracked overlines.
- Default body: 16px, proportional line-height 1.55; longer public copy runs at about 1.65–1.7.

The public desktop hero is asymmetric, with content and a purpose-drawn SVG illustrating discovery, application, and growth. It becomes a stacked composition on small screens. No invented opportunity, testimonial or conversion metric is introduced by the art. The original SVG lives in `src/components/graphics/journey-illustration.tsx`.

Public cards are list items with title/location/date metadata and a horizontal action. The filters remain URL-backed GET forms. The public legal, auth, detail, apply and empty/error surfaces share the same ink/surface/spacing decisions.

Workspaces use a navy navigation rail and an airy command surface. Admin and student overview mastheads use different blue tints and display live values derived from existing data, never placeholder KPIs. CRM listing tables use quiet headers, accessible alignment, hover rows and responsive mobile records.

## 4. Components

The shared `chapters.css` stylesheet styles the existing functional components. These are the implemented control conventions:

| Component | Implemented rule |
| --- | --- |
| Buttons and links | Pill primary/secondary actions, unambiguous labels, tactile press and hover; horizontal arrow only when informative |
| Inputs, search, textarea | Filled blue-gray surfaces, transparent default border, clear hover and high-contrast focus ring |
| Native selects | Same field geometry; retain browser keyboard and screen-reader support |
| WorkspaceSelect | Rounded combobox trigger and option list, selected/active states, search, keyboard controls and multi-select footer |
| DateInput | Calendar popover with styled days/month controls, date bounds, today semantic state and native form field submission |
| Form group/step | Numbered editorial section headings, structured field groups and accessible native HTML validation |
| Upload | Soft inset upload area and refined native file picker; MIME/size checks remain enforced at submission and server |
| Tables/CRM records | Low-noise headers, restrained separators, row emphasis, responsive list presentation |
| Dialogs/search palette | Elevated surfaces, native dialog semantics, backdrop, focus restoration and Escape handling |
| Status/timelines | Existing status components and workflow contracts retained; pills, progress and typography follow the unified palette |
| Empty/validation/loading | Consistent backgrounds, readable feedback, existing skeleton and alert mechanisms |
| Navigation | Public responsive panel and admin/student workspace rail/mobile navigation, keyboard-focus visibility |

The application form retains explicit save-draft and final-submit behavior, ordered groups, validation, upload and consent. This implementation does not silently convert the approved single-page form into a hidden-step wizard; doing so requires a dedicated validation and end-to-end review to preserve the existing draft/revision semantics.

## 5. GSAP motion

- `src/components/motion/public-motion.tsx` uses `useGSAP` and scoped `ScrollTrigger` reveals for text, the hero composition, and public sections.
- `src/components/layout/workspace-shell.tsx` retains scoped GSAP context page entrances and dialog response animations. The component-specific select/calendar open interactions also use GSAP.
- Motion favors opacity and transforms. Context cleanup is required whenever GSAP creates a timeline or triggers.
- No scroll hijacking and no perpetual hidden content. The static DOM is readable before animation initializes.
- `prefers-reduced-motion: reduce` removes decorative animation and smooth scrolling at the CSS level; JS also skips reveal animations.
- Implemented timing tokens: `--motion-fast: .16s`, `--motion-base: .28s`, `--motion-slow: .56s`.

## 6. Responsive patterns

At 1440px, editorial columns and readable workspace grid density. At 1024px, narrower rail and adapted content. At 768px, public hero stacks and the workspace uses mobile navigation. At 375px, cards become one-column entries, long admin records have dedicated mobile versions, inputs remain touch sized and the file/date control areas adapt to viewport width. Approximate breakpoints in CSS: 1200, 1024, 768 and 420 pixels.

## 7. Accessibility rules

Use proper button, input, form, dialog, table, and landmark elements; never represent record actions with inert art. Keyboard navigation and programmatic labels are required. Focus-visible outlines must remain visible regardless of the borderless default. The calendar annotates today's date with `aria-current="date"` in addition to its selection state. Empty states and errors provide language and actionable next steps. Honor both native validation and backend guards; styling must not weaken security or authorization.

## 8. Mobbin research consulted

Research was performed through the connected Mobbin integration, across website sections, individual screens and complete flows. The references informed information architecture and interaction strategy; no screen was copied wholesale.

- Editorial product composition: [Contractbook website section](https://mobbin.com/sites/sections/9457282b-ec69-42d8-836c-b2ee708a9d18) and [Customer.io website section](https://mobbin.com/sites/sections/c74125df-8280-4579-9289-6255600499f1)
- Opportunity discovery: [Upwork screen](https://mobbin.com/screens/3e496996-8cc0-41f2-a144-785213fa5711), [Remote screen](https://mobbin.com/screens/583a50de-3cf4-4391-a7e5-fa0f6b5e528c)
- Workspace overview: [Mintlify screen](https://mobbin.com/screens/4e5e24d5-edf6-4895-9a0c-b8634c37a34c), [Arcade screen](https://mobbin.com/screens/278852c6-e966-405a-a58d-b813ea7dcc80)
- Operations filtering: [Remote management screen](https://mobbin.com/screens/9ad0d8b8-ccfc-4176-a185-4397ec212720)
- Auth entry: [Gusto screen](https://mobbin.com/screens/faab7a02-dc26-462b-b0f9-0a4a5245a65e)
- Date selection: [Square screen](https://mobbin.com/screens/241c60f9-e2fa-4e9a-a422-01aeffb99f58)
- Progressive onboarding: [Melio account setup flow](https://mobbin.com/flows/19e7920f-cdc3-4612-bc67-2660ed342ece), [Customer.io onboarding](https://mobbin.com/flows/9264db59-22a9-4b4d-8beb-eaeb96e3ce5d)
- Mobile account and tab navigation: [Linear Mobile flow](https://mobbin.com/flows/dcec3f35-a716-43a3-9bac-e4b21f64108e)

## 9. Screen coverage and architecture constraints

The global style layer is applied by the shared root layout on every public route, including home, discovery/detail, apply, auth, legal, errors and not-found pages. It is also applied to the existing student `/dashboard/**` and admin `/admin/**` shells, their record detail pages, CRUD forms, loading/empty states and responsive views. Both overview route components now expose real contextual hero counts. This is a shared visual and layout system, **not a claim that every route's JSX was individually replaced**.

Existing Next.js 14 App Router / React 18 / Tailwind / Drizzle architecture, security, authorization, native authentication, backend validation, private file storage, SGD minor-unit quotation behavior, notifications and application/placement state machines remain authoritative and unmodified.

## 10. Maintenance

Prefer `chapters.css` and the shared component tree for future changes. Do not copy Mobbin imagery into the product. Any further migration should gradually consolidate the legacy CSS layers after screenshot-based verification, instead of deleting styles needed by functional routes prematurely. Keep the design documentation synchronized with code shipped and record build, unit and Playwright results from an actual run rather than assuming success.
