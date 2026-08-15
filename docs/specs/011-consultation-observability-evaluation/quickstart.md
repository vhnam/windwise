# Quickstart: Consultation Observability & Evaluation Suites

Validation guide. See [data-model.md](./data-model.md) and
[contracts/eval-and-observability.md](./contracts/eval-and-observability.md) for
referenced shapes. Depends on 005/006's consultation data, 009's rule sets,
010's question sets/prompt versions.

## Prerequisites

- A completed chat-based consultation and a completed form-based consultation in
  the seeded data (to exercise both `transcript: present` and `transcript: null`
  cases)
- At least one abandoned (in-progress, never completed) session
- `packages/eval`'s CLI runnable locally (`npx windwise-eval --help`)

## Scenario 1 — Investigating one consultation end to end

1. `searchConsultations` by date range.
2. **Expect**: both the completed and abandoned sessions appear.
3. `getConsultationDetail` on the chat-based session.
4. **Expect**: `criteria`, `recommendation`, full `versions` pin, and a non-null
   `transcript` including tool calls (spec FR-001/FR-002/FR-003).
5. Repeat for the form-based session.
6. **Expect**: same fields present except `transcript: null`.

## Scenario 2 — Analytics over a fixed range

1. `getAnalyticsSummary` for the range covering the seeded sessions.
2. **Expect**: `volume` and `completionRate` reflect the seeded mix; the
   abandoned session's last-answered question appears in `dropOffByStep` (spec
   FR-005/FR-006).
3. Re-run the same query.
4. **Expect**: identical output — reproducible for a fixed historical range
   (spec SC-004).

## Scenario 3 — Zero-consultation range is a clear empty state

1. `getAnalyticsSummary` for a date range with no seeded activity.
2. **Expect**: zero-valued fields, not an error (spec Edge Cases).

## Scenario 4 — Deterministic suite runs without touching the AI layer

1. Author an `EvalSuite` with `kind: 'deterministic'` and at least one case per
   `scenario_type` (discover, compare, upgrade — spec Edge Cases).
2. Run
   `npx windwise-eval run --suite=<id> --rule-set=<published-rule-set-id> --question-set=<published-question-set-id>`
   with no LLM provider credentials configured in the environment.
3. **Expect**: the run completes successfully regardless — proves no AI call is
   attempted (spec FR-010, research.md §2).

## Scenario 5 — Regression is flagged distinctly from new/removed cases

1. Run the suite from Scenario 4 against the current published rule set — note
   `runId` as baseline.
2. Add one new case to the suite (don't touch existing cases).
3. Publish a rule change ([009](../009-recommendation-rules-authoring/spec.md))
   that breaks one previously-passing case.
4. Re-run the suite against the new rule set.
5. `compareEvalRuns(baselineRunId, newRunId)`.
6. **Expect**: the newly added case is classified `new`, the broken case is
   classified `regressed`, and every other unchanged-and-passing case is
   `stable-pass` — no conflation between the three (spec FR-009, research.md
   §3).

## Scenario 6 — CI gate fails on a real regression

1. Run the CLI with `--compare-to=<baselineRunId>` against the rule-broken state
   from Scenario 5.
2. **Expect**: non-zero exit code (spec SC-002's "fast enough to gate merges"
   implies a real pass/fail signal, not just a report).

## Scenario 7 — Metrics distinguish invariants from quality scores

1. Inspect the `metrics` field of any completed run.
2. **Expect**: `constraintViolations` and `hallucinatedCatalogData` are tagged
   `type: 'invariant'`; the other three are `type: 'quality'` (spec SC-005,
   research.md §4).
3. Engineer a case where a constraint-violating candidate would need to slip
   through (should be impossible per 009's guarantees) — if it ever is non-zero,
   it must render as a failing gate, not a quality score to "improve later."

## Scenario 8 — Conversational suite is reported distinctly

1. Run a small `kind: 'conversational'` suite via `runConversationalSuite` with
   `sampleRate` less than 1.0.
2. **Expect**: its `EvalRun.kind` and reported results are visually and
   structurally distinct from the deterministic suite's results in the dashboard
   (spec FR-011).

## Success criteria mapped

| Quickstart scenario | Spec success criterion                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------- |
| 1                   | SC-001 (investigate a bad recommendation in under 2 minutes)                              |
| 4, 6                | SC-002 (CI-gating, no LLM dependency)                                                     |
| 5, 6                | SC-003 (100% of regressions flagged)                                                      |
| 2                   | SC-004 (reproducible analytics for a fixed range)                                         |
| 7                   | SC-005 (metrics computed per platform §5.7 formula, invariants vs. quality distinguished) |
