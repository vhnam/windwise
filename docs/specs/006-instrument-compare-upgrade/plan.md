# Implementation Plan: Instrument Compare & Upgrade Flows

**Branch**: `006-instrument-compare-upgrade` | **Date**: 2026-08-16 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/006-instrument-compare-upgrade/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Visitors choose an entry intent (discover / compare / upgrade) before the
existing guided consultation begins. The compare path resolves free-text model
mentions to catalog candidates, requires explicit confirmation, then produces a
structured side-by-side comparison scoped by what the visitor says they care
about. The upgrade path resolves a named current instrument, collects
reason/level/budget, and recommends within the same family at or above the
current tier — skipping family-selection scoring entirely. Both paths are new
entry points and question sequences into the same engine, schemas, and
persistence packages introduced by
[005](../005-guided-instrument-consultation/plan.md); this plan extends those
packages rather than duplicating them.

## Technical Context

**Language/Version**: TypeScript, Node.js >=22.18.0, React 19 (same as 005)

**Primary Dependencies**: Same stack as 005 — TanStack Start/Router/Query,
TanStack AI, Valibot, Drizzle ORM, `@windwise/ui`, `@windwise/query`. No new
runtime dependency is introduced; this feature adds new tool definitions, server
functions, and tables to the packages 005 creates (`@windwise/schemas`,
`@windwise/core`, `@windwise/db`, `@windwise/ai`).

**Storage**: PostgreSQL via `@windwise/db` (extends the schema from 005 — adds
`model_aliases` and `model_comparison_notes` per platform plan §3.5b)

**Testing**: `vp run -r test`; deterministic unit tests on
`resolveMention`/`compareModelsCore`/`suggestUpgrade` in `@windwise/core` (fuzzy
matching and comparison diffing are pure functions, same purity guarantee as
`recommend()`); contract tests on the four new tool schemas; an integration test
proving `compareModels` refuses any unconfirmed model ID server-side (spec
FR-010).

**Target Platform**: Web — same as 005, new routes in
`apps/consumer-application`

**Project Type**: Web application, same monorepo as 005 — no new app

**Performance Goals**: Inherits 005's engine/first-token targets;
`resolveMention` fuzzy matching adds no user-visible latency budget beyond the
existing chat first-token target since it runs as one more server-side tool call
in the same turn

**Constraints**: `compareModels` MUST reject any `modelIds` not previously
confirmed via `confirmMention` in the session (spec FR-010) — enforced
server-side per platform §5.3 guard #4, not left to the LLM to remember;
`resolveMention` MUST NOT auto-select a single candidate under any confidence
threshold (spec FR-002); playing-character claims in a comparison MUST originate
only from published `model_comparison_notes`, never LLM-generated (spec FR-005)

**Scale/Scope**: Model-alias coverage scoped to the same seed subset 005 uses (4
families / handful of models) per platform plan M4b exit criterion ("the Bach 37
vs YTR-8335 scenario resolves... and renders a correct side-by-side"); broader
alias coverage grows with catalog content over time

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality** — PASS. `resolveMention`, `compareModelsCore`, and
  `suggestUpgrade` are added to `@windwise/core` alongside `recommend()`,
  keeping exactly one engine package rather than a second comparison-logic
  implementation living in the app. The intent-branching question and
  confirmation UI reuse `@windwise/ui` wizard components from 005 rather than a
  new component tree.
- **II. Testing Standards** — PASS. Golden-file tests cover fuzzy-match ranking
  determinism (same candidate mention always resolves to the same ranked list
  for a fixed catalog snapshot, matching TR-2). An integration test crosses the
  `ai` ↔ `db` boundary to verify the confirmation gate: calling `compareModels`
  with an unconfirmed ID must fail regardless of what the LLM "intends," which
  is exactly the kind of cross-boundary contract the constitution requires a
  test for rather than an assumption.
- **III. UX Consistency** — PASS. The three-way intent choice
  (discover/compare/upgrade) is one shared entry component; "no match found" and
  "unconfirmed reference" are new empty/error states designed once and reused
  wherever a mention fails to resolve, consistent with 005's empty-state pattern
  (spec FR-013 there, edge cases here).
- **IV. Performance Requirements** — PASS. No new dependency; `model_aliases`
  fuzzy lookup is a bounded, indexed query against a small seed set, well within
  the existing engine/first-token budgets inherited from 005.
- **Additional Constraints — stack compatibility**: no change from 005's
  analysis. This feature does not introduce any new PowerSync usage either; the
  same flagged-not-blocked note from 005 applies unchanged and is not
  re-litigated here.

**Post-Phase-1 re-check**: data-model.md and contracts/ confirm no new
constitution gate is introduced — `model_aliases` and `model_comparison_notes`
are additive tables read/written through the same `@windwise/db` query layer 005
established, and the confirmation gate is implemented as one shared server-side
check reused by both `compareModels` and `suggestUpgrade`, not two copies.

## Project Structure

### Documentation (this feature)

```text
docs/specs/006-instrument-compare-upgrade/
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
├── schemas/                      # EXTENDED (from 005)
│   └── src/
│       ├── mention.ts             # NEW — MentionInput, ConfirmInput, CompareInput shapes
│       └── comparison.ts          # NEW — ComparisonResult, UpgradeCriteria shapes
│
├── core/                          # EXTENDED (from 005)
│   └── src/
│       ├── resolve-mention.ts     # NEW — fuzzy match against aliases + display_name, deterministic ranking
│       ├── compare-models.ts      # NEW — compareModelsCore(): pure spec/price diff + note lookup
│       ├── suggest-upgrade.ts     # NEW — suggestUpgrade(): family/tier-constrained recommend(), skips Stage A
│       └── __tests__/             # golden-file tests for mention ranking + comparison diffing
│
├── db/                            # EXTENDED (from 005)
│   └── src/
│       ├── schema/
│       │   ├── model-aliases.ts          # NEW
│       │   └── model-comparison-notes.ts # NEW
│       └── queries/
│           ├── fuzzy-match-catalog.ts    # NEW
│           ├── pin-reference-model.ts    # NEW — records session-scoped confirmation
│           └── confirmed-model-ids.ts    # NEW — reads confirmation state for the gate
│
├── ai/                             # EXTENDED (from 005)
│   └── src/
│       └── tools.ts               # + resolveMention, confirmMention, compareModels, suggestUpgrade
│
├── query/                         # EXISTING — reused as-is
└── ui/                            # EXISTING — reused as-is (+ comparison table, intent-choice components)

apps/
└── consumer-application/          # EXISTING app, new routes/components added
    └── src/
        └── routes/
            ├── consult/
            │   └── intent.tsx      # NEW — discover/compare/upgrade entry choice
            ├── compare/            # NEW — mention → confirm → comparison UI
            └── upgrade/            # NEW — current-instrument → confirm → recommendation UI
```

**Structure Decision**: Extend the same four shared packages 005 created rather
than add new ones — `resolveMention`, `compareModelsCore`, and `suggestUpgrade`
belong next to `recommend()` in `@windwise/core` because they share its purity
and determinism contract (TR-1, TR-2) and, per the platform plan, are "new entry
points... into the existing engine, not a parallel system." Only
`apps/consumer-application` gains routes; no new app or package is introduced.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No new violations beyond the PowerSync note already tracked in 005's plan
(carried forward, not duplicated here).
