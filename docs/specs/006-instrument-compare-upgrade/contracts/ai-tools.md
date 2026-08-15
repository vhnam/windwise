# Contract: Compare & Upgrade AI Tools (`@windwise/ai`)

Extends the tool set defined in
[005's ai-tools contract](../../005-guided-instrument-consultation/contracts/ai-tools.md).
All four tools below are server-only (TR-4); schemas derive from
`@windwise/schemas` (research.md, 005 §1).

## `resolveMention`

```ts
input: {
  text: string;
}

output: {
  candidates: Array<{
    modelId: string;
    displayName: string;
    confidence: number; // 0-1, deterministic (research.md §1)
    matchedAlias: string;
  }>;
}
```

**Guarantee**: never returns a single auto-picked model; always returns the full
ranked candidate list, even when the top candidate has high confidence (spec
FR-002).

## `confirmMention`

```ts
input: {
  sessionId: string;
  candidateModelId: string;
}

output: {
  confirmed: true;
}
```

**Guarantee**: requires the visitor to have taken an explicit action against a
candidate previously returned by `resolveMention` in the same session — persists
to `ConfirmedReference` (data-model.md). This is the only way a model ID becomes
eligible for `compareModels`/`suggestUpgrade`.

## `compareModels`

```ts
input: { modelIds: string[]; focus?: ('tone' | 'weight_response' | 'projection' | 'budget')[] }

output:
  | ComparisonResult              // see data-model.md
  | { error: 'UNCONFIRMED_MODEL'; unconfirmedIds: string[] }
```

**Guarantee**: server refuses (returns `UNCONFIRMED_MODEL`, never partially
compares) unless every ID in `modelIds` is present in the session's
`ConfirmedReference` set (spec FR-010, platform §5.3 guard #4). This check runs
before any catalog read, not after.

## `suggestUpgrade`

```ts
input: {
  currentModelId: string
  reason: string
  currentLevel: Criteria['level']
  upgradeBudget: Criteria['budget']
}

output:
  | { runId: string; items: RecommendationItem[] }   // same item shape as 005's recommendInstruments
  | { error: 'UNCONFIRMED_MODEL' }
  | { error: 'NO_UPGRADE_AVAILABLE'; reason: string } // e.g. already top tier in family
```

**Guarantees**:

- Refuses with `UNCONFIRMED_MODEL` unless `currentModelId` is a confirmed
  reference for the session (same shared check as `compareModels`, research.md
  §2).
- Constrains all returned `items` to the same `family_id` as `currentModelId`'s
  family, at or above its `level_tier` (spec FR-009).
- Skips Stage A (family scoring) entirely per research.md §3 — this is not
  observable in the output shape, but is asserted in the golden-file tests
  referenced in plan.md's Testing section.
- Returns `NO_UPGRADE_AVAILABLE` rather than a lateral/downgrade suggestion when
  no qualifying candidate exists (spec Edge Cases).
