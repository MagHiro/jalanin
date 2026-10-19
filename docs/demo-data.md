# Student application demo

Populate the local development database with fictional, connected student journeys:

```sh
pnpm db:migrate
pnpm db:seed
pnpm admin:grant 00000000-0000-0000-0000-00000000ad01
pnpm db:seed:demo
```

Use a local `DATABASE_URL`. Scripts load the project's environment files
automatically. Start the app with `E2E_MODE=1 pnpm dev`, open `/dev/login`,
and enter as the student or admin. The developer login is only available
in the existing development/test mode (never production).

## Included scenarios

**Amina Rahman**, a hospitality-focused business student at Universitas Indonesia:

- Marketing in Bangkok: in review.
- Food & Beverage in Singapore: quotation sent, SGD 1,850.
- Finance in Penang: updated statement awaiting coordinator re-review.
- Hotel Operations in Singapore: accepted, SGD 2,100 quotation and confirmed placement.
- UI Design in Singapore: saved draft ready to resume.
- Previous Guest Services intake: completed, SGD 1,650 quotation and completed placement.

**Rizky Pratama**, a computer science student:

- Software Engineering in Kuala Lumpur: newly submitted.
- UI Design in Singapore: rejected with coordinator feedback.
- Finance in Penang: saved draft.

Submitted applications include real, readable fictional PDF CVs stored in the
private filesystem document store, policy-version consent records, dated status
histories and audit records. Quotations distinguish student-facing terms from
internal notes. Notifications include unread submission and re-review scenarios.
The previous intake is unpublished and stays out of the public directory.

## Repeatability

The seed runs in a transaction, validates lifecycle paths against the canonical
workflow, and skips existing applications (including student/internship conflicts).
Re-running adds no duplicate history or documents and preserves edits made while
demonstrating the product. Newly uploaded documents are removed if the transaction
fails. Existing test fixtures and student applications are retained.

Demo identities are fictional fixed IDs with login-disabled placeholder
password hashes in the native `users` table (the E2E session seam mints real
sessions for them). The command requires a local development database and a
separately provisioned admin. Demo seeding does not send emails.
