# Implementation Plan: Recommendation Rules Authoring & Testing

**Branch**: `009-recommendation-rules-authoring` | **Date**: 2026-08-16 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/009-recommendation-rules-authoring/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Managers author scoring rules (constraint or modifier kind, fixed operator set,
depth-limited condition AST) through a structured builder in
`apps/manager-dashboard`, save them to a draft `rule_set`, and publish a new
version without any code deploy. The engine in `@windwise/core` (currently
running 005's hardcoded v0 rule set per its research.md §2) switches to reading
the published `rule_set` from `@windwise/db` instead. A Test Recommendation tool
runs arbitrary criteria against any rule set version and shows the full per-rule
score breakdown, including candidates a constraint excluded — the primary
debugging tool the platform plan calls out by name. This is the feature that
makes the constraint/modifier interpreter shape 005 built toward (rather than
reimplemented) actually data-driven.

## Technical Context

**Language/Version**: TypeScript, Node.js >=22.18.0, React 19

**Primary Dependencies**: Same as 008 for the dashboard side (TanStack Start
server functions, TanStack Query, `@windwise/ui`); `@windwise/core` (the
interpreter this feature makes DB-backed instead of hardcoded); Valibot
(recursive schema for AST validation on save, per platform TR-7); Drizzle ORM.
No new AI/LLM dependency — rule authoring and testing are fully deterministic,
non-conversational.

**Storage**: PostgreSQL via `@windwise/db` — new `rule_sets` and `rules` tables
(platform §3.4), read by `@windwise/core`'s `recommend()` in place of the v0
hardcoded set 005 shipped.

**Testing**: `vp run -r test`; unit tests on the AST validator (fixed operator
set, max depth 2, rejects anything else — platform TR-7); golden file tests
proving a rule authored as `constraint` always vetoes regardless of any
`modifier` score on the same candidate (the exact bug platform plan §1.3 calls
out); integration test proving exactly one `rule_set` is ever
`status = 'published'` at a time.

**Target Platform**: Web — `apps/manager-dashboard` (rule builder, Test
Recommendation tool) and `@windwise/core` (interpreter, now reading from DB); no
consumer-app UI changes, though consumer recommendations now depend on this
feature's published rule set instead of 005's hardcoded one.

**Project Type**: Web application, same monorepo — extends
`apps/manager-dashboard`, `@windwise/core`, `@windwise/db`

**Performance Goals**: Inherits 005's engine target (<50ms p95 for a full run,
in-memory catalog cache, platform NFR table) — this is the most safety-critical
performance number in the plan, since the rule interpreter now runs on every
consumer consultation, not just this feature's own testing UI.

**Constraints**: Never `eval`, never `new Function`, never a stored expression
string (platform TR-7 — manager-authored content is a code-injection surface,
this is a hard security constraint, not a style preference); a candidate
matching an active constraint rule MUST be absent from consumer results
regardless of modifier score (spec FR-010, correctness invariant, SC-002 target:
zero); exactly one `rule_set` MUST be published at any time (spec FR-006);
publish MUST be blocked if a rule targets a catalog entity that no longer
exists, or a reason template references an undefined placeholder (spec FR-011)

**Scale/Scope**: Rule count scoped to what's needed for the ~14-family,
60-90-model v1 catalog — the known constraints enumerated in platform §4.4 (age
exclusions, braces softening, purpose boosts, beginner-excludes-
professional-tier) are the initial seed rule set content, not unbounded
custom-rule volume; max AST nesting depth 2 keeps any single rule bounded
regardless of catalog scale

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality** — PASS. The interpreter (the code that evaluates a rule's
  condition/effect) lives once in `@windwise/core`, unchanged in shape from
  005's v0 build-to-final-contract decision (005 research.md §2) — this feature
  swaps the rule _source_ (hardcoded array → DB read) without touching
  interpreter logic, exactly the "one implementation, not two that could drift"
  pattern the constitution requires.
- **II. Testing Standards** — PASS. The constraint-cannot-be-outscored invariant
  (spec FR-010, SC-002) is tested as a golden-file case, not assumed from code
  review alone, since it is explicitly named as a correctness invariant rather
  than a quality target. AST validation (fixed operator set, depth limit) is
  unit tested against both valid and deliberately malformed input, since it is
  the platform's stated defense against a code-injection surface (TR-7) — a
  security-relevant boundary the constitution's Testing Standards principle
  requires be verified by tests, not assumed.
- **III. UX Consistency** — PASS. The rule builder and Test Recommendation tool
  reuse `apps/manager-dashboard`'s dashboard theme and CRUD/ optimistic-update
  patterns established in 008, rather than introducing a visually distinct
  "rules" sub-app.
- **IV. Performance Requirements** — PASS, with an explicit note: this is the
  first feature where a dashboard-authored change (a published rule set)
  directly affects the <50ms p95 engine latency target that consumer traffic
  depends on. The plan requires the in-memory catalog/rule-set cache (platform
  NFR table) to be invalidated only on publish, not re-read from DB per
  consultation request, and this cache-invalidation behavior should be
  benchmarked before this feature ships per the constitution's requirement that
  performance-sensitive changes include a before/after measurement.
- **Additional Constraints — stack compatibility**: unchanged; no new
  dependency, no PowerSync involvement.

**Post-Phase-1 re-check**: data-model.md and contracts/ confirm the
interpreter/cache boundary holds — `@windwise/core`'s `recommend()` signature is
unchanged from 005 (`recommend(criteria, catalog, ruleSet)`); only how `ruleSet`
is sourced changes. No new constitution risk surfaced during design beyond the
performance-benchmark note already flagged above.

## Project Structure

### Documentation (this feature)

```text
docs/specs/009-recommendation-rules-authoring/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/
├── core/                          # EXTENDED (from 005/006)
│   └── src/
│       ├── rules/
│       │   ├── ast-schema.ts       # NEW — Valibot recursive schema, fixed operator set, depth <= 2 (TR-7)
│       │   ├── interpreter.ts      # PROMOTED from 005's hardcoded v0 — unchanged evaluation logic
│       │   └── score-breakdown.ts  # NEW — per-rule contribution + excluded_by detail for Test Recommendation
│       └── __tests__/
│           └── constraint-veto.golden.test.ts   # NEW — the "-50 vs +80" correctness invariant
│
└── db/                            # EXTENDED
    └── src/
        ├── schema/
        │   ├── rule-sets.ts        # NEW
        │   └── rules.ts            # NEW
        └── queries/
            ├── rule-set-write.ts   # NEW — draft/publish, reuses can-transition.ts pattern from 008
            └── published-rule-set-cache.ts   # NEW — in-memory cache, invalidated on publish only

apps/
└── manager-dashboard/             # EXTENDED (from 008)
    └── src/
        └── routes/
            ├── rules/
            │   ├── index.tsx        # NEW — rule set list, versions, publish/rollback
            │   └── builder.tsx      # NEW — structured rule builder (condition AST editor)
            └── test-recommendation.tsx   # NEW — criteria input, ranked result + score breakdown + excluded_by
```

**Structure Decision**: Extend `@windwise/core` (interpreter/AST/score breakdown
— shared logic, same package as `recommend()`) and `@windwise/db` (storage),
plus `apps/manager-dashboard` (authoring UI, already stood up by 008). No new
package: rule evaluation belongs with the engine it's part of, not split into a
separate "rules" package, since 005 already built the interpreter inside
`@windwise/core` anticipating this.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                                                                                                              | Why Needed                                                                                                                                                                                                              | Simpler Alternative Rejected Because                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| In-memory published-rule-set cache with explicit invalidation, rather than reading from DB on every `recommend()` call | The <50ms p95 engine latency target (inherited from 005, now load-bearing for consumer traffic on every consultation) cannot tolerate a DB round-trip per recommendation once rules are DB-backed instead of hardcoded. | Reading the rule set from DB on every call was considered simplest, but a single Test Recommendation session or traffic spike would multiply DB load linearly with consultation volume for data that changes only on an explicit publish action — the cache's invalidation trigger (publish) is a single, well-defined event, not a source of staleness risk. |
