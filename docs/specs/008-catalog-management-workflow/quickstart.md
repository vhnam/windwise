# Quickstart: Catalog Management Workflow

Validation guide. See [data-model.md](./data-model.md) and
[contracts/catalog-write.md](./contracts/catalog-write.md) for referenced
shapes.

## Prerequisites

- `apps/manager-dashboard` running with the organization plugin configured
  (research.md §1)
- A test organization with five users, one per role
  (Owner/Admin/Editor/Reviewer/Viewer)
- `apps/consumer-application` running, pointed at the same database, to verify
  cross-app visibility

## Scenario 1 — Draft never reaches consumers

1. As Editor, `createInstrumentRecord`.
2. **Expect**: `status: 'draft'`.
3. Open the consumer catalog listing
   ([007](../007-instrument-catalog-browsing/spec.md)) and the record's direct
   detail URL.
4. **Expect**: it does not appear in listings and the detail page shows "not
   available" (spec FR-001, cross-checked against 007's contract).

## Scenario 2 — Full lifecycle with role gating

1. As Editor, `transitionStatus(draft → in_review)`.
2. As Editor (not Reviewer), attempt `transitionStatus(in_review → published)`.
3. **Expect**: `{ error: 'FORBIDDEN' }`.
4. As Reviewer, `transitionStatus(in_review → published)`.
5. **Expect**: success; the record now appears on consumer catalog pages.
6. As Reviewer, `transitionStatus(published → archived)`.
7. **Expect**: success; the record disappears from consumer listings but its
   detail page and audit trail remain accessible in the dashboard.

## Scenario 3 — Publish blocked on missing fields

1. As Editor, create a record missing a required field (e.g., no
   `last_verified_at` or no primary image).
2. As Reviewer, attempt `transitionStatus(in_review → published)`.
3. **Expect**: `{ error: 'MISSING_REQUIRED_FIELDS', fields: [...] }` — publish
   does not proceed (spec FR-009).

## Scenario 4 — Verification queue surfaces the right records

1. Seed one record with `last_verified_at` > 180 days ago, one with a missing
   required field, one with a `sources` row flagged `source_ok: false`, and one
   fully current record.
2. Call `getVerificationQueue()`.
3. **Expect**: the first three appear (with matching `reasons`), the
   fully-current record does not (spec FR-003/FR-004/FR-005).

## Scenario 5 — Role restrictions are enforced, not just hidden in the UI

1. As Viewer, call `transitionStatus` or `editInstrumentRecord` directly
   (bypassing any UI affordance).
2. **Expect**: `{ error: 'FORBIDDEN' }` for every mutating call — Viewer can
   still call `getAuditTrail`/read endpoints successfully (spec FR-008, SC-004).

## Scenario 6 — Revoked role takes effect immediately

1. As Owner, note a session where an Editor is mid-edit (has called
   `editInstrumentRecord` once already, keeps the tab open).
2. As Owner, `updateMemberRole(editor → viewer)`.
3. As the now-Viewer user, attempt another `editInstrumentRecord` call in the
   same still-open session.
4. **Expect**: `{ error: 'FORBIDDEN' }` — the check re-reads current role, not a
   session-start snapshot (spec FR-012).

## Scenario 7 — Every mutation is audited with a real diff

1. Perform one create, one edit, one status transition, and one archive on the
   same record (across Scenarios 1-2).
2. Call `getAuditTrail` for that record.
3. **Expect**: four chronological entries, each with the correct actor, action,
   and a `diff` reflecting only the fields that actually changed (spec
   FR-010/FR-011, SC-003).

## Scenario 8 — Concurrent edit conflict is surfaced, not silently lost

1. Two Editor sessions load the same draft record (same `expectedVersion`).
2. Session A saves a change successfully.
3. Session B saves a different change using its now-stale `expectedVersion`.
4. **Expect**: `{ error: 'CONFLICT', currentVersion }` for Session B — its
   change is not silently discarded or silently applied over Session A's
   (research.md §5, spec Edge Cases).

## Scenario 9 — Source liveness is refreshed off the request path

1. Ensure the dashboard is **not** used to probe source URLs.
2. From the repo root, run the manual/cron entry point:

   ```bash
   vp -C packages/db run db:check-sources
   ```

   Optionally limit the run with `SOURCE_IDS=uuid1,uuid2`.

3. **Expect**: each checked `sources` row updates `source_ok` /
   `last_checked_at` without loading `/verification-queue`. Transient failures
   require two consecutive misses before `source_ok` becomes `false`
   (research.md §4).
4. Reload the verification queue — broken-source reasons reflect the refreshed
   flags only.

## Success criteria mapped

| Quickstart scenario | Spec success criterion                                     |
| ------------------- | ---------------------------------------------------------- |
| 1                   | SC-001 (zero draft/in-review records visible to consumers) |
| 4                   | SC-002 (100% of flagged records surfaced)                  |
| 5, 6                | SC-004 (100% role-restricted actions denied)               |
| 7                   | SC-003 (every change audited with a complete diff)         |
| 9                   | FR-005 broken-source detection stays off the page path     |
