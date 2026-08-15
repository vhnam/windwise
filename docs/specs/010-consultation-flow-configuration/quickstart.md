# Quickstart: Consultation Question Flow & Prompt Version Management

Validation guide. See [data-model.md](./data-model.md) and
[contracts/flow-and-prompt-authoring.md](./contracts/flow-and-prompt-authoring.md)
for referenced shapes. Builds on 005's seeded question set, 008's roles, and
009's AST validator/rule set.

## Prerequisites

- `apps/manager-dashboard` running with Editor and Reviewer test users
- 005's seeded consumer flow reachable for live end-to-end checks
- At least one enabled rule (from 009) referencing a specific `domain_path`
  (e.g., `purpose.jazz`)

## Scenario 1 — Adding and conditionally showing a question

1. As Editor, `saveDraftQuestion` adding a new optional question with a
   `visibleWhen` condition referencing an existing question's key (e.g., only
   show if `level = beginner`).
2. `previewQuestionSet` the draft.
3. **Expect**: the walkthrough shows the new question only when the simulated
   `level` answer is `beginner`, hidden otherwise (spec FR-002).
4. **Expect**: no record from this preview appears anywhere in consumer-facing
   analytics data (spec FR-010).

## Scenario 2 — In-progress sessions keep their pinned version

1. Start a live consultation session (do not complete it) — note its
   `question_set_id`.
2. As Reviewer, `publishQuestionSet` a new version with a different question
   order.
3. Continue the original, still-open session.
4. **Expect**: it continues using the question set version it started with,
   unaffected by the new publish (spec FR-004, SC-002 — this is a zero-tolerance
   invariant per the spec, verify across multiple concurrently in-progress
   sessions, not just one).
5. Start a brand-new session.
6. **Expect**: it uses the newly published version.

## Scenario 3 — Option mapping produces the right domain value

1. Confirm a question option maps to `domain_path = 'purpose.jazz'`.
2. Complete a live consultation selecting that option.
3. **Expect**: the resulting `Criteria.purpose` is exactly `jazz` (spec FR-003).

## Scenario 4 — Removing a rule-referenced option warns first

1. Attempt `removeQuestionOption` on the option from Scenario 3 (without
   `confirmed: true`).
2. **Expect**: `{ warning: 'RULE_DEPENDENCY', affectedRuleIds: [...] }` — not
   silently allowed, not hard-blocked (spec FR-009).
3. Retry with `confirmed: true`.
4. **Expect**: removal proceeds.

## Scenario 5 — Prompt draft/experimental/published lifecycle

1. As Editor, `saveDraftPromptVersion` a new system prompt variant.
2. Use it in the playground; confirm it has no effect on live chat traffic (spec
   FR-005).
3. `markExperimental`.
4. `replayConsultation` a past session against it.
5. **Expect**: the original session's stored rows are unchanged before and after
   the replay (spec FR-011) — assert via `getAuditTrail` (008's contract)
   showing no new entries for that session's entities.
6. As Reviewer, `publishPromptVersion`.
7. Start a new live chat consultation.
8. **Expect**: it uses the newly published prompt content.

## Scenario 6 — Prompt rollback is a single action

1. From a state where a problematic prompt version is live, as Reviewer
   `rollbackPromptVersion` targeting the prior published version.
2. Start a new live chat consultation immediately after.
3. **Expect**: it reflects the rolled-back content with no reconstruction step
   required (spec FR-006, SC-003).

## Scenario 7 — Publish-time validation catches a dangling reference

1. Author a question with `visibleWhen` referencing a question key, then
   (test-only) remove that referenced question from the same draft.
2. Attempt `publishQuestionSet`.
3. **Expect**: `{ error: 'VALIDATION_FAILED', issues: [...] }` naming the
   dangling reference (spec FR-008).

## Success criteria mapped

| Quickstart scenario | Spec success criterion                                 |
| ------------------- | ------------------------------------------------------ |
| 1, 5, 6             | SC-001 (publish without code deployment)               |
| 2                   | SC-002 (zero sessions switching versions mid-flow)     |
| 6                   | SC-003 (single-action rollback, immediate effect)      |
| 7                   | SC-004 (zero published sets with dangling references)  |
| 1, 5 (step 4-5)     | SC-005 (preview/replay leave zero analytics footprint) |
