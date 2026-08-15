# Quickstart: Recommendation Rules Authoring & Testing

Validation guide. See [data-model.md](./data-model.md) and
[contracts/rule-authoring.md](./contracts/rule-authoring.md) for referenced
shapes. Builds on 008's role/audit infrastructure and 005's seeded catalog.

## Prerequisites

- `apps/manager-dashboard` running with a Reviewer-role test user
- A seeded catalog including at least one instrument young enough to trigger an
  age-based exclusion (per platform §4.4's known constraints) and one that would
  otherwise score highly on a purpose-match modifier

## Scenario 1 — Draft rule has no live effect

1. As Editor, `saveDraftRule` adding a new constraint rule to the current draft
   rule set.
2. Run a live (consumer-facing) recommendation with criteria that would trigger
   the new rule.
3. **Expect**: the new rule has no effect — the live result is unchanged (spec
   FR-004), since only the currently published rule set is active.

## Scenario 2 — Publish activates the rule; rollback reverts it

1. As Reviewer, `publishRuleSet` the draft from Scenario 1.
2. Repeat the same live recommendation from step 2 above.
3. **Expect**: the new rule now takes effect (spec FR-004/FR-005).
4. As Reviewer, `rollbackToVersion` targeting the prior published version.
5. Repeat the live recommendation again.
6. **Expect**: behavior matches the pre-Scenario-1 result — a single action, no
   manual reconstruction (spec SC-004).

## Scenario 3 — Constraint always outscores modifier (the core invariant)

1. Author two rules in a draft rule set targeting the same candidate: a
   `constraint` rule with an `exclude` effect, and a `modifier` rule with a
   large positive `score` delta.
2. `publishRuleSet`.
3. Run a recommendation with criteria matching both rules' conditions.
4. **Expect**: the candidate does not appear in the live result at all — the
   constraint wins regardless of the modifier's size (spec FR-010, SC-002 —
   verify across the full sampled matrix, not just this one case, since SC-002
   is a zero-tolerance correctness invariant).

## Scenario 4 — Test Recommendation shows the full breakdown

1. As Viewer (or above), `runTestRecommendation` with the same criteria as
   Scenario 3, against the published rule set.
2. **Expect**: the excluded candidate appears in `results` with
   `survived: false` and a populated `excludedBy`; a non-excluded candidate
   shows every `appliedRules` entry that contributed to its `finalScore` (spec
   FR-008/FR-009).
3. Confirm the excluded candidate is absent from the equivalent consumer-facing
   `recommendInstruments`/`getRecommendation` response for the same criteria
   (from 005/006's contracts) — verifies research.md §4's type-level separation
   holds.

## Scenario 5 — Comparing two rule set versions

1. `compareTestRuns` with the pre- and post-Scenario-2 rule set IDs for the same
   criteria.
2. **Expect**: `diff` correctly identifies the candidate that changed from
   `included` to `excluded` (spec User Story 2, scenario 3).

## Scenario 6 — Publish-time validation blocks bad references

1. Author a rule targeting a `model` ID, then (test-only) remove/archive that
   model from the catalog.
2. Attempt `publishRuleSet`.
3. **Expect**: `{ error: 'VALIDATION_FAILED', issues: [...] }` naming the
   missing reference — publish does not proceed (spec FR-011).

## Scenario 7 — Malformed AST is rejected at save, not at run time

1. Attempt `saveDraftRule` with a condition nested three levels deep, or using
   an operator outside the fixed set (e.g., a raw string expression).
2. **Expect**: `{ error: 'INVALID_AST', issue: ... }` — rejected immediately,
   never persisted (spec Edge Cases, platform TR-7).

## Success criteria mapped

| Quickstart scenario | Spec success criterion                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, 2                | SC-001 (behavior change with zero code deploy)                                                                                                                                      |
| 3                   | SC-002 (zero constraint violations — correctness invariant)                                                                                                                         |
| 4                   | SC-003 (locate the responsible rule quickly)                                                                                                                                        |
| 2 (rollback)        | SC-004 (single-action rollback)                                                                                                                                                     |
| all                 | SC-005 (every live run traceable to its rule set version — verified via the `rule_set_id` pin, not separately re-tested here since it's covered by 005/011's version-pinning tests) |
