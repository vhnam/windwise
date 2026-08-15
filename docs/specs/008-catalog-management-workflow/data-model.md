# Phase 1 Data Model: Catalog Management Workflow

Writes to the catalog tables 005/007 already read (`brands`,
`instrument_families`, `instrument_models`, `model_specs`, `model_images`,
`sources`, `model_sources` — platform §3.2). This feature adds the
identity/audit tables and the write-path shapes below.

## OrganizationMember (better-auth organization plugin, extended)

| Field                        | Type                                                   | Notes                                     |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| `id`                         | uuid                                                   | plugin-managed                            |
| `organization_id`, `user_id` | uuid (fk)                                              | plugin-managed                            |
| `role`                       | enum: `owner \| admin \| editor \| reviewer \| viewer` | maps directly to spec BR-M11's five roles |

## AuditLog (`@windwise/db`, new)

| Field             | Type                                                   | Notes                                     |
| ----------------- | ------------------------------------------------------ | ----------------------------------------- |
| `id`              | uuid                                                   |                                           |
| `actor_user_id`   | uuid (fk)                                              |                                           |
| `entity`          | text                                                   | e.g. `instrument_model`, `brand`          |
| `entity_id`       | uuid                                                   |                                           |
| `action`          | enum: `create \| edit \| status_transition \| archive` |                                           |
| `before`, `after` | jsonb                                                  | field-level diff, null `before` on create |
| `at`              | timestamp                                              |                                           |

Written in the same transaction as the mutation it records (research.md §3).

## InstrumentModel (extended from 005/007's read model)

Adds write-relevant fields already in platform §3.2 but not previously
exercised:

| Field                 | Type                                                | Notes                                                           |
| --------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| `status`              | enum: `draft \| in_review \| published \| archived` | this feature is the only writer of transitions                  |
| `data_completeness`   | int 0-100                                           | computed on write from the required-field list (research.md §4) |
| `verified_by_user_id` | uuid (fk)                                           | set when `last_verified_at` is updated                          |

## VerificationQueueItem (in-memory shape, `@windwise/schemas`)

Output of `verification-queue.ts`.

```ts
{
  modelId: string;
  displayName: string;
  reasons: Array<
    | { type: "stale"; lastVerifiedAt: string; daysOverThreshold: number }
    | { type: "missing_fields"; fields: string[] }
    | { type: "broken_source"; sourceUrl: string; lastCheckedAt: string }
  >;
}
```

A record can appear with more than one reason simultaneously (spec Edge Cases
doesn't forbid it; the UI groups by record, not by reason type).

## AuditTrailEntry (in-memory shape, `@windwise/schemas`)

Output of `audit-trail.ts`, ordered chronologically.

```ts
{
  actorUserId: string;
  actorDisplayName: string;
  action: "create" | "edit" | "status_transition" | "archive";
  at: string;
  diff: Array<{ field: string; before: unknown; after: unknown }>;
}
```

## State Transitions

```text
InstrumentModel.status:
  (new) --create (Editor+)--> draft
  draft --mark ready (Editor+)--> in_review
  in_review --approve (Reviewer+)--> published
  in_review --request changes (Reviewer+)--> draft
  published --archive (Reviewer+/Admin+)--> archived
  archived --restore (Admin+)--> draft      # explicit action only, never automatic (spec Edge Cases)

Every transition above:
  1. checked via can-transition.ts (research.md §2) against the actor's
     CURRENT role (re-read at call time, never cached — spec FR-012)
  2. blocked before it starts if targetStatus = 'published' and any
     required field is missing (spec FR-009)
  3. writes an AuditLog row in the same transaction (research.md §3)
```
