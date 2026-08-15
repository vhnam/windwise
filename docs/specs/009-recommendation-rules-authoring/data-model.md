# Phase 1 Data Model: Recommendation Rules Authoring & Testing

Promotes 005's minimal single-row rule set (005 data-model.md "RuleSet / Rule
(minimal v0)") into the full versioned entity described here. Same shape 005
anticipated; this feature is the first to make it manager-editable and
multi-version.

## RuleSet (`@windwise/db`)

| Field                          | Type                       | Notes                                                              |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `id`                           | uuid                       |                                                                    |
| `version`                      | int                        | monotonic per rule set lineage                                     |
| `status`                       | enum: `draft \| published` | exactly one row has `status = published` at any time (spec FR-006) |
| `engine_version`               | text                       | recorded per platform TR-6                                         |
| `published_at`, `published_by` | timestamp, uuid            | null while draft                                                   |
| `note`                         | text                       | free-text changelog entry                                          |

## Rule (`@windwise/db`)

| Field                                      | Type                             | Notes                                                                                   |
| ------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------- |
| `id`                                       | uuid                             |                                                                                         |
| `rule_set_id`                              | uuid (fk)                        |                                                                                         |
| `name`                                     | text                             |                                                                                         |
| `kind`                                     | enum: `constraint \| modifier`   | no default — must be explicit (spec FR-002)                                             |
| `target`                                   | enum: `family \| model \| brand` | validated against catalog existence at publish time (spec FR-011)                       |
| `condition`                                | jsonb                            | AST — see Condition AST below                                                           |
| `effect`                                   | jsonb                            | see Effect below                                                                        |
| `reason_template_vi`, `reason_template_en` | text                             | placeholders validated against `condition`'s referenced criteria fields at publish time |
| `priority`                                 | int                              | evaluation order within same kind                                                       |
| `enabled`                                  | boolean                          |                                                                                         |

### Condition AST (fixed shape, validated by `ast-schema.ts`)

```ts
type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { eq: [field: string, value: unknown] }
  | { neq: [field: string, value: unknown] }
  | { lt: [field: string, value: unknown] }
  | { lte: [field: string, value: unknown] }
  | { gt: [field: string, value: unknown] }
  | { gte: [field: string, value: unknown] }
  | { in: [field: string, values: unknown[]] }
  | { between: [field: string, min: unknown, max: unknown] };
```

Max nesting depth 2 (an `all`/`any`/`not` may contain leaf conditions or one
further level of `all`/`any`/`not`, no deeper) — enforced by the Valibot schema
itself, not a post-hoc check (research.md §1).

### Effect (discriminated union)

```ts
type Effect =
  | { type: "score"; delta: number } // modifier only
  | { type: "exclude"; reason_key: string } // constraint only
  | { type: "require"; reason_key: string }; // constraint only
```

`ast-schema.ts` rejects a `constraint`-kind rule with a `score` effect and a
`modifier`-kind rule with `exclude`/`require`, keeping the kind/effect pairing
structurally consistent, not just conventionally.

## ScoreBreakdown (in-memory shape, `@windwise/schemas`, internal-only)

Output of `score-breakdown.ts`, used only by the Test Recommendation tool
(research.md §4) — never part of a consumer-facing response type.

```ts
{
  candidate: { familyId: string; modelId: string }
  survived: boolean
  appliedRules: Array<{ ruleId: string; ruleName: string; kind: 'constraint' | 'modifier'; effect: Effect; matched: boolean }>
  finalScore: number | null           // null if survived = false
  excludedBy: { ruleId: string; ruleName: string; reasonKey: string } | null
}
```

## TestRecommendationRun (in-memory, not persisted)

Distinct from the consumer-facing `RecommendationRun` (005 data-model.md) — a
Test Recommendation invocation is ephemeral and never written to
`recommendation_runs`/`recommendation_items` (research.md §4's type-level
separation).

```ts
{
  criteria: Criteria                    // same shape as 005's Criteria
  ruleSetId: string                     // any version, draft or published
  results: ScoreBreakdown[]             // includes excluded candidates
}
```

## State Transitions

```text
RuleSet.status:
  (new / edit) --always--> draft
  draft --publish (research.md §5: create-then-publish for rollback)--> published
    # publishing a new row automatically demotes the previously-published
    # row's status; DB constraint (partial unique index on status='published')
    # guarantees exactly one published row at all times (spec FR-006)

Rule: no independent lifecycle — belongs to its RuleSet's draft/published
  state; editing a rule always happens through its owning draft RuleSet.

published-rule-set-cache: invalidated exactly once per successful
  RuleSet publish action (research.md §3) — no other trigger.
```

## Publish-Time Validation (spec FR-011)

Before a `RuleSet` transitions draft → published:

1. Every `rule.target` (`family`/`model`/`brand` reference embedded in
   `condition`, where applicable) resolves to an existing catalog row.
2. Every `{field}` placeholder in `reason_template_vi`/`_en` corresponds to a
   field actually referenced by that rule's `condition`.
3. Every `Rule.condition` passes `ast-schema.ts` (redundant with save-time
   validation, but re-checked at publish since rules may have been edited across
   multiple saves).

Failing any check blocks publish and returns which rule(s) and which specific
issue caused the block — not a generic failure.
