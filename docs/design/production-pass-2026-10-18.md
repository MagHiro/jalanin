# Production-focused shared UX and runtime pass — 18 October 2026

This focused pass covers the shared shell used by admin and student routes, application submission, authentication, and error recovery. It is **not** a claim that every state and screen has been visually certified.

## Mobbin reference-to-implementation mapping

- [Mercor applicant dashboard](https://mobbin.com/screens/a61d83b2-1972-48be-b400-e11eaeefe61a): applicant-facing progress, legible status, and a clear next action. Retained the existing Jalanin dashboard records and focus on resumable drafts.
- [Workable recruiting operations](https://mobbin.com/screens/7e33f607-2b4c-4961-b4c7-6c4232295d5d): data-first admin navigation and action priorities. Improved workspace focus/skip navigation and reduced admin navigation queries.
- [Braintrust candidate upload journey](https://mobbin.com/flows/06fe98c4-06f1-428c-a482-ab109dec378a): staged document upload and review. Improved immediate file-limit/type feedback and retry handling without copying third-party assets.

References are inspiration rather than UI assets; no external screenshots are embedded. The existing Jalanin indigo/ivory design direction remains authoritative.

## Changes and validation boundaries

- Shared admin/student workspace no longer bundles GSAP for entry animation. Native dialog, responsive table scrolling, visible focus, and skip-to-content remain.
- Each nested admin page executes only the unread-notifications count in the layout, instead of all overview aggregates.
- Unconfirmed sign-ups receive actionable email-confirmation guidance rather than a dashboard/login redirect loop.
- Application submissions guard duplicate client requests; file checks prevent oversized/unaccepted file uploads before network I/O. The server continues to validate all data.
- Sign-out failure is visible and does not falsely imply the account is signed out.
- Production errors expose only a support reference. Server incident logs omit potentially sensitive error messages.

Verification must come from PR CI plus staging tests with real Supabase Auth/Storage, SMTP, and approved legal/retention configuration. No production deployment is implied.


## Lightweight motion follow-up

- Public section entrances now use the browser's IntersectionObserver and CSS animation; grouped form entrances use the Web Animations API. Both preserve visible content when JavaScript is unavailable or the visitor requests reduced motion.
- Client bundles no longer import GSAP via the shared workspace shell or these two motion wrappers. Package removal is deferred to a separate lockfile-reviewed maintenance task.
- Production SMTP now fails explicitly when required connection/sender settings are omitted. Real provider delivery, browser motion smoothness and shipped bundle size should be checked in staging.
