# Typography — Jalanin

## Approved reference

Use the homepage **Featured internships** section as the approved typography
baseline. It follows the compact OpenAI featured-role reference on Mobbin,
adapted to Jalanin with **Google Sans Flex**, a 25% increase over the initial
type scale, and a navy browse button.

Implementation: `src/app/page.tsx` and the `.featured-internships` styles in
`src/app/fieldnotes.css`.

This file describes visual typography only. Product requirements, confirmed
decisions and unresolved scope remain governed by
`docs/Jalanin_Internship_Platform_PRD_v0.4.md`.

## Font

- Use the existing locally hosted **Google Sans Flex** variable font.
- Keep the font setup in `src/app/layout.tsx`; do not add an external font or
  substitute a serif/display face.
- Prefer regular weight and a restrained hierarchy rather than oversized,
  heavy headings or widely tracked uppercase labels.

## Approved type scale

| Role | Desktop | Mobile (≤767px) | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Section heading | 37.5px | 35px | 400 | 1.25 | −0.025em |
| Supporting sentence | 17.5px | 17.5px | 400 | 1.6 | Normal |
| Role title | 15px | 17.5px | 400 | 1.6 | Normal |
| Category and location | 15px | 15px | 400 | 1.6 | Normal |
| Row details link | 15px | 15px | 400 | 1.6 | Normal |
| Browse button label | 15px | 15px | 400 | 1.5 | Normal |

The mobile role title is intentionally larger for scanning the stacked rows.
Balance heading and supporting-copy wrapping. Do not add custom tracking to
body text, metadata, links or buttons.

## Hero typography

The hero uses Google Sans Flex with a larger scale than section headings.

| Role | Desktop | Mobile (≤767px) | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Hero heading | Up to 72px | 44px | 400 | 1.08 desktop / 1.12 mobile | −0.035em desktop / −0.025em mobile |
| Hero supporting text | 18px | 17.5px | 400 | 1.6 | Normal |

- Responsive heading size: `clamp(44px, 5vw, 72px)`; mobile uses 44px.
- Preserve the existing two-part headline and explicit line break; allow
  additional wrapping on narrow screens rather than overflow.
- Keep regular, upright type throughout the headline, including its `em` element.
- Heading maximum width: 1000px; supporting text: 560px (320px on mobile).
- Retain white heading text and the existing light supporting text over the photo.

## Featured section color and presentation

- Heading, role title and details link: `#111111`.
- Supporting sentence: `#222222`.
- Category and location: `#656565`.
- Browse button: `#102568`, white label; hover: `#243966`.
- Center the section heading, supporting sentence and browse button.
- Keep role rows flat, white and square-cornered, spanning the full section
  content width—not the viewport—with 16px between rows.
- Preserve visible keyboard focus and readable responsive wrapping.

## Footer

- Use Google Sans Flex and a light page-background surface with subtle dividers.
  A soft upward shadow (`0 -8px 28px -16px rgb(19 35 78 / .18)`) separates
  the footer from the page content.
- Invitation heading: 37.5px desktop / 35px mobile, weight 400, line height 1.25,
  letter spacing −0.025em.
- Supporting text and links: 15px, regular weight, normal letter spacing;
  navigation column labels use weight 500. Copyright text: 13px.
- Use the supplied `public/logo.png`, displayed at 220px wide with its original
  aspect ratio, and the approved navy pill button treatment.
- Desktop: brand and two navigation columns. Mobile: brand above two columns.
- Preserve all discovery/legal destinations and visible keyboard focus.

## Applying this baseline

Use these roles as the reference for future typography changes. Preserve
semantic heading levels and existing functionality. This documentation does
not authorize a site-wide restyle or override the separately approved hero
and navbar treatments; apply changes only to the requested scope.
