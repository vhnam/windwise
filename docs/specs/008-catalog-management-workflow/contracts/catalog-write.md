# Contract: Catalog Write Server Functions (`apps/manager-dashboard`)

TanStack Start server functions. Every function below calls `can-transition.ts`
before mutating and `writeAuditEntry` within the same transaction as the
mutation (research.md §2-3) — these guarantees are stated once here rather than
repeated per function.

## `createInstrumentRecord`

```ts
input: {
  brandId: string;
  familyId: string;
  modelCode: string;
  displayName: string; /* other draft-eligible fields */
}
output: {
  modelId: string;
  status: "draft";
}
```

Requires role `editor` or above.

## `editInstrumentRecord`

```ts
input: { modelId: string; expectedVersion: string; changes: Partial<InstrumentModelFields> }
output: { status: 'ok' } | { error: 'CONFLICT'; currentVersion: string }
```

Requires role `editor` or above. `CONFLICT` is returned (not a silent overwrite)
when `expectedVersion` doesn't match the stored version (research.md §5, spec
Edge Cases).

## `transitionStatus`

```ts
input: { modelId: string; targetStatus: 'in_review' | 'published' | 'draft' | 'archived' }
output:
  | { status: 'ok'; newStatus: string }
  | { error: 'FORBIDDEN' }                                   // role can't perform this transition
  | { error: 'MISSING_REQUIRED_FIELDS'; fields: string[] }   // only possible when targetStatus = 'published'
```

Requires the role appropriate to the transition per data-model.md's State
Transitions table (e.g., `reviewer` or above to reach `published`).

## `getVerificationQueue`

```ts
input: { staleDaysThreshold?: number }   // defaults to 180 (spec FR-003)
output: { items: VerificationQueueItem[] }   // see data-model.md
```

Readable by any role `viewer` and above.

## `getAuditTrail`

```ts
input: { entity: string; entityId: string }
output: { entries: AuditTrailEntry[] }   // chronological, see data-model.md
```

Readable by any role `viewer` and above.

## `updateMemberRole`

```ts
input: { organizationId: string; userId: string; role: 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer' }
output: { status: 'ok' } | { error: 'FORBIDDEN' }
```

Requires role `owner` or `admin`. Takes effect immediately — the next action by
the affected user is checked against this new role, per FR-012; there is no
session-cached role to invalidate separately.
