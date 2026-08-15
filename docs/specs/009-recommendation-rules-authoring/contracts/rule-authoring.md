# Contract: Rule Authoring Server Functions (`apps/manager-dashboard`)

Follows the same role-gated, audited-write pattern 008 established
(`can-transition.ts`-style check + same-transaction audit entry) — a rule set
publish is exactly the kind of "single field edit changes consumer-facing
advice" event 008's audit trail exists for, so `rule_sets`/`rules` writes flow
through 008's `writeAuditEntry`, not a separate logging mechanism.

## `saveDraftRule`

```ts
input: {
  ruleSetId: string        // must be status = 'draft'
  rule: {
    id?: string              // omit to create
    name: string
    kind: 'constraint' | 'modifier'
    target: 'family' | 'model' | 'brand'
    condition: Condition     // see data-model.md
    effect: Effect            // see data-model.md — must match kind
    reasonTemplateVi: string
    reasonTemplateEn: string
    priority: number
    enabled: boolean
  }
}
output: { ruleId: string } | { error: 'INVALID_AST'; issue: string } | { error: 'KIND_EFFECT_MISMATCH' }
```

Requires role `editor` or above (per 008's role model). Has no effect on live
consumer recommendations (spec FR-004).

## `publishRuleSet`

```ts
input: { ruleSetId: string; note?: string }
output:
  | { status: 'ok'; publishedVersion: number }
  | { error: 'VALIDATION_FAILED'; issues: Array<{ ruleId: string; issue: string }> }
```

Requires role `reviewer` or above. Runs the publish-time validation from
data-model.md before proceeding; on success, invalidates
`published-rule-set-cache.ts` (research.md §3) and demotes the previously
published `rule_set`.

## `rollbackToVersion`

```ts
input: {
  targetRuleSetId: string;
} // any prior published version
output: {
  status: "ok";
  newRuleSetId: string;
  publishedVersion: number;
}
```

Requires role `reviewer` or above. Implements the copy-then-publish mechanic
from research.md §5 — never re-activates the historical row directly.

## `runTestRecommendation`

```ts
input: { criteria: Criteria; ruleSetId: string }   // ruleSetId may be draft or published
output: { results: ScoreBreakdown[] }   // includes excluded candidates, see data-model.md
```

Readable by role `viewer` and above (this is the primary debugging tool —
platform plan frames it as broadly useful, not editor-restricted). Never writes
to `recommendation_runs`/`recommendation_items` (research.md §4) — fully
ephemeral.

## `compareTestRuns`

```ts
input: { criteria: Criteria; ruleSetIdA: string; ruleSetIdB: string }
output: {
  resultsA: ScoreBreakdown[]
  resultsB: ScoreBreakdown[]
  diff: Array<{ candidate: { familyId: string; modelId: string }; changedFrom: 'included' | 'excluded'; changedTo: 'included' | 'excluded' }>
}
```

Supports spec User Story 2's "compare the same criteria against two rule set
versions" scenario without a separate UI flow — reuses `runTestRecommendation`
internally for both sides.
