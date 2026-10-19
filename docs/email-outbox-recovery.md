# Email outbox concurrency and recovery

Confirmed delivery-hardening fix in `src/lib/email/outbox.ts` and `smtp.ts`.
No schema changes or business workflow changes.

## Claim and retry behavior

- Claim UPDATE checks queued status, the selected attempt generation, and that
  `nextAttemptAt` is still due. A stale SELECT alone never authorizes a send.
- A successful claim increments `attemptCount` and sets a two-minute lease in
  `nextAttemptAt`. Completion checks status, generation, exact lease timestamp,
  and an unexpired lease using the database clock.
- Retry delays are separate from that lease: 1 minute, 5 minutes, 15 minutes,
  1 hour, then 6 hours, measured from a completed unsuccessful attempt.
- An interrupted claim becomes eligible when its lease expires. After eight
  attempts, an expired queued row is marked failed without a ninth send.
- `processed` counts successful claims and exhausted-row recoveries, rather
  than SELECT candidates. `sent`/`failed` count accepted conditional completion
  writes, so stale completions do not report success or overwrite newer state.

## Runtime and diagnostics

- Each invocation has a 45-second work budget, stops starting work with under
  2 seconds left, and waits at most 10 seconds per provider call (also bounded
  by remaining invocation/lease time). Candidate selection is capped at 100.
- SMTP has 3-second connection/greeting and 5-second socket inactivity
  timeouts, plus an 8-second overall send deadline and best-effort close.
- Provider error messages/properties are never forwarded to logs or persisted
  as outbox errors. Generic diagnostics use incident identifiers.
- Database stalls and synchronous event-loop stalls cannot be bounded by these
  timers. Hosting duration must accommodate this budget plus database overhead.
  Worker/database clocks should be synchronized; claim expiry is checked by DB.

## Delivery limitations

`event_key` deduplicates enqueue only. SMTP acceptance followed by timeout,
process interruption, or a failed database completion write has an ambiguous
outcome. Recovery may deliver a duplicate: this is at-least-once retry behavior,
not exactly-once provider delivery, and bounded attempts do not ensure eventual
delivery. A Promise timeout cannot cancel arbitrary providers; SMTP close is
best effort. Late provider resolution never performs an additional completion.
Recovery requires a subsequent dispatcher invocation.

## Focused verification

`tests/unit/email-outbox.test.ts` models live UPDATE predicate evaluation with
snapshot SELECT results. It covers competing claims, due rechecks, separate
lease/backoff, provider throws, timeout/late success, expired claim recovery,
attempt exhaustion, stale completion fencing, and invocation budget limits.
`tests/unit/email-smtp.test.ts` covers phase/overall timeouts, transport close,
sanitized diagnostics, successful delivery, and timer cleanup.

These are mocked unit tests; live PostgreSQL locking and SMTP acceptance are
not exercised by this suite.
