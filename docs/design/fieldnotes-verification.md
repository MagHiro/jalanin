# Fieldnotes verification

Implementation date: 2026-10-19.

## Environment

Created a new local PostgreSQL database, `jalanin_fieldnotes`, migrated it and
seeded test listings. All integration and E2E writes target this database.
The repository's configured remote database was not used for mutation tests.
Chromium runs against localhost:3101 with E2E_MODE enabled.

## Checks

Photographic homepage hero: lint/typecheck passed and public-design suite passed
6/6. Updated the obsolete SVG expectation to verify the hero image loads with
nonzero natural width at 320/375/768/1440px. Desktop screenshot inspected.

Placement/public discovery follow-up: typecheck/lint pass. Initial targeted run
failed five checks (missing route content and placement creation); the subsequent
identical public-design/admin-lifecycle run passed 10/10. Directory, public detail
and populated student placements measured 0px horizontal overflow at
375/768/1440px. Public detail screenshot inspected. No separate student placement
route was added; each card exposes its record notes through a native disclosure.

Student profile + dashboard application follow-up: lint/typecheck passed.
Four admin lifecycle checks and the student workspace check passed. The admin
workspace check timed out selecting Unpublished in the internship editor and is
not recorded as passing. Inspected populated screenshots of both redesigned
detail routes; each measured 0px horizontal overflow at 375/768/1440px.

Admin application record follow-up: lint/typecheck passed and all four
`admin-lifecycle.spec.ts` checks passed against the isolated local database.
Inspected a populated In Review record screenshot with document and audited
reopening history. Browser measurements found 0px horizontal overflow at
375, 768 and 1440px. Presentation changes preserve the existing server data and
workflow control components.

Input follow-up: removed legacy input margins and inherited heavy value text;
date buttons now share a grid cell with their input and reset the legacy translate.
Browser geometry confirms the button is contained and vertically centered (0px
center difference). Narrow application date pairs stack below 420px. Upload help
remains visible after selecting a file and is associated with the input.
Lint/typecheck passed; four workspace-replica tests passed. The application journey
reached the submitted URL but failed on the missing confirmation status element,
including a single-worker retry; this journey is not recorded as passing.

Follow-up internship editor/sidebar refinement: lint and typecheck passed;
the workspace and workspace-replica suites passed 6/6 against the isolated local
database. Coverage includes admin/student navigation, editor controls and overflow
at 320/375/768px. Expanded and collapsed desktop screenshots were also inspected.
The editor now groups existing fields into four sections; sidebar icon geometry
and label sizing are shared with logout. No API or database changes were needed.

- Typecheck: passed.
- Lint: passed without warnings after fixing the effect dependency.
- Production build: passed after the final CSS refinements.
- Unit/integration: 179 passed across 18 files.
- First browser suite: 56 passed / 7 failed. Failures included outdated visual
  assertions (old canvas width, heading weight and replaced artwork), a narrow
  filter layout overflow and an application workflow timeout under six workers.
- Refinement: stack narrow sort/actions; update only obsolete visual assertions;
  lower compatibility CSS cascade priority to prevent legacy colors winning;
  fix workspace wordmark alignment. Browser suite rerun with two workers.
- Full browser rerun: 61/63 passed. The remaining two obsolete metric assertions
  were updated. Subsequent investigation also fixed a real select reopening bug
  caused by default activation from its wrapping label; the targeted workspace
  rerun passed 2/2.
- After final workspace CSS refinements, `workspaces.spec.ts` and
  `workspace-replica.spec.ts` passed together: 6/6 with two workers.
- The complete 63-test suite was not rerun after these final fixes; the full-run
  and targeted-run results above are separate verification evidence.

Desktop screenshots inspected for home, discovery, login and populated admin
overview, plus mobile admin, student dashboard and an admin editor. Responsive
browser coverage exercises 375px, 768px, 1024px and 1440px layouts. Final visual
refinements addressed workspace heading hierarchy, navigation, fields, tables
and editor spacing, as well as the narrow discovery-filter overflow.

## Scope qualifications

This is presentation work. No new profile portal, payments, export, calendar
scheduling service, or application lifecycle has been introduced. Application
sections remain a guided single-page form with explicit draft saving. Shared
controls are rebuilt for existing uses; nonexistent product controls are not
added speculatively. Static Mobbin previews do not provide observed motion.

Many routes receive the redesign through shared components and the authoritative
`fieldnotes.css`, rather than individually rewritten page markup. `globals.css`
retains structural compatibility rules in the base layer. Historical stylesheet
files remain in the repository but their competing imports have been removed.
