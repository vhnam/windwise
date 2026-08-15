# Implementation Plan: Consultation Observability & Evaluation Suites

**Branch**: `011-consultation-observability-evaluation` | **Date**: 2026-08-16 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/011-consultation-observability-evaluation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Managers search and inspect individual consultations (criteria, recommendation,
exact version pins, full transcript with tool calls), view platform-wide
analytics (volume, completion, drop-off, click-through), and author/run
evaluation suites — a deterministic engine-only suite runnable in CI on every
PR, and a sampled conversational suite involving the AI layer, run nightly or on
prompt change. This is the platform's regression safety net and the
read/analysis layer over every version- pinned entity 005/006/009/010 already
write (`recommendation_runs`, `conversation_logs`, `rule_sets`, `question_sets`,
`prompt_versions`) — it introduces a new `@windwise/eval` package (the only
feature in this batch to warrant one, since it is explicitly meant to run
standalone in CI, not only inside `apps/manager-dashboard`) plus dashboard UI
for search/analytics/eval authoring.

## Technical Context

**Language/Version**: TypeScript, Node.js >=22.18.0, React 19 (dashboard UI);
the CI-facing eval runner is a plain Node CLI, no browser runtime required

**Primary Dependencies**: `@windwise/core` (the eval runner calls `recommend()`
directly for deterministic suites — same purity guarantee 005 established, no
HTTP hop needed); `@windwise/db` (read path over
`recommendation_runs`/`conversation_logs`/version-pin tables); TanStack Start
server functions + TanStack Query for the dashboard's search/ analytics UI;
Valibot (eval case schema — expected/forbidden outcome shapes); no new AI
dependency for the deterministic suite (it never invokes the LLM per spec
FR-010); the conversational suite reuses `@windwise/ai`'s existing tool/chat
infrastructure from 005/006, sampled per platform §2.3, not a new AI
integration.

**Storage**: PostgreSQL via `@windwise/db` — new `eval_suites`, `eval_cases`,
`eval_runs`, `eval_results` tables (platform §3.6); this feature is read-only
against every other table it surfaces (consultation, recommendation, version-pin
tables from 005/006/009/010) — it does not mutate them.

**Testing**: `vp run -r test`; unit tests on the deterministic eval runner's
pass/fail/regression comparison logic (golden-file style, mirrors 005's own
testing approach for the engine it's now testing); a meta-test proving the eval
runner itself never calls any AI provider for a deterministic suite (spec
FR-010, a correctness invariant the same way 009's constraint-veto and 010's
version-pin invariants were tested).

**Target Platform**: `@windwise/eval` runs both as a CI job (GitHub Actions or
equivalent, invoked headlessly) and as a library called from
`apps/manager-dashboard` server functions for on-demand/nightly runs — one
implementation, two invocation contexts, per platform §2.3's explicit
requirement that engine eval run "in CI on every PR."

**Project Type**: Web application + CLI, same monorepo — this is the first
feature in this batch to add a new top-level package (`packages/eval`) rather
than only extending existing ones, because platform §5.1's repository layout
already reserves `packages/eval/` for exactly this ("CLI eval runner, used by CI
and the dashboard").

**Performance Goals**: Deterministic suite MUST run "fast enough to gate merges
without becoming a bottleneck" (spec SC-002) — since it only calls
`@windwise/core`'s `recommend()` per case with no I/O beyond an
in-memory/fixture catalog snapshot, this is expected to be sub-second per case,
well within a PR-gating budget even at hundreds of cases. The conversational
suite has no such constraint (nightly/sampled, per platform §2.3) and is
explicitly allowed to be slow and costly.

**Constraints**: The deterministic suite MUST NOT invoke the conversational AI
layer under any circumstance (spec FR-010, platform §2.3's "no reason not to"
framing depends on it staying fast and free); a regression MUST be flagged for
100% of cases that passed in a prior comparable run and fail now (spec FR-009,
SC-003, zero-tolerance, same framing as 009's SC-002 and 010's SC-002);
Hallucinated Catalog Data and Constraint Violations are correctness gates
targeting exactly zero (platform §5.7), not gradually-improved quality scores —
this distinction must be visible in how results are reported, not just computed;
eval datasets MUST be versioned so a pass rate remains comparable across a
changing test-case set (spec FR-012)

**Scale/Scope**: Deterministic suite scoped to cover discover, compare, and
upgrade scenarios (spec Edge Cases explicitly calls out including
compare/upgrade, not just discover) against the catalog/rule seed data
005/006/009 establish; conversational suite scoped to a sampled subset per
platform §2.3, not full coverage.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality** — PASS. The eval runner calls `@windwise/core`'s
  `recommend()`/`resolveMention()`/`compareModelsCore()`/`suggestUpgrade()`
  directly rather than reimplementing scoring logic to "simulate" what the
  engine would do — there is exactly one place recommendation logic lives
  (005/006/009's packages), and this feature only orchestrates calling it
  against many cases and diffing the output.
- **II. Testing Standards** — PASS, and notably this feature _is_ largely a
  testing tool itself; its own correctness (does the regression comparison
  correctly distinguish new/removed/regressed cases per spec Edge Cases) is
  verified by unit tests with fixture eval-run pairs, since a testing tool with
  an untested comparison algorithm would undermine the trust the whole feature
  exists to build.
- **III. UX Consistency** — PASS. The consultation search/detail view and
  eval-suite authoring UI reuse `apps/manager-dashboard`'s established
  list/detail/draft-publish patterns from 008/009/010 rather than a visually
  distinct "observability" sub-app.
- **IV. Performance Requirements** — PASS. The deterministic suite's speed
  requirement (SC-002) is itself a stated performance goal above, treated as a
  first-class constraint, not an afterthought; the new `packages/eval`
  dependency is justified by its dual CI/dashboard invocation requirement
  (research.md §1) rather than being introduced speculatively.
- **Additional Constraints — stack compatibility**: unchanged; no new runtime
  dependency beyond what CI tooling requires (a Node-runnable CLI, already
  implied by the existing pnpm/Turborepo/Vite toolchain), no PowerSync
  involvement.

**Post-Phase-1 re-check**: data-model.md and contracts/ confirm `@windwise/eval`
stays a thin orchestration layer over `@windwise/core` and `@windwise/db` reads
— it introduces no scoring logic of its own. No new constitution risk
identified.

## Project Structure

### Documentation (this feature)

```text
docs/specs/011-consultation-observability-evaluation/
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
├── eval/                            # NEW — per platform §5.1's reserved layout
│   └── src/
│       ├── run-deterministic-suite.ts   # calls @windwise/core directly, no I/O beyond fixtures
│       ├── run-conversational-suite.ts  # calls @windwise/ai's chat infra, sampled
│       ├── compare-runs.ts              # regression/new/removed diff logic (unit-tested per Constitution Check)
│       ├── metrics.ts                   # platform §5.7 formulas: accuracy, constraint violations, invalid tool calls, hallucinated data, completion rate
│       └── cli.ts                       # `npx windwise-eval run --suite=<id> --rule-set=<id>` — the CI entry point
│
└── db/                               # EXTENDED (from 005/006/008/009/010)
    └── src/
        ├── schema/
        │   ├── eval-suites.ts          # NEW
        │   ├── eval-cases.ts           # NEW
        │   ├── eval-runs.ts            # NEW
        │   └── eval-results.ts         # NEW
        └── queries/
            ├── search-consultations.ts  # NEW — read across consultation_sessions/recommendation_runs/conversation_logs
            └── analytics-summary.ts     # NEW — volume/completion/drop-off/click-through aggregation

apps/
└── manager-dashboard/                # EXTENDED (from 008/009/010)
    └── src/
        └── routes/
            ├── consultations/
            │   ├── index.tsx           # NEW — search
            │   └── $sessionId.tsx      # NEW — detail: criteria, versions, transcript, tool calls
            ├── analytics/
            │   └── index.tsx           # NEW — volume/completion/drop-off/click-through
            └── evaluation/
                ├── suites.tsx           # NEW — suite/case authoring
                └── runs/
                    └── $runId.tsx       # NEW — pass/fail results, regression view

.github/
└── workflows/
    └── engine-eval.yml                # NEW — runs packages/eval's deterministic suite on every PR
```

**Structure Decision**: This is the one feature in the batch that introduces a
new top-level package (`packages/eval`), because platform plan §5.1 already
reserves this exact location for "CLI eval runner, used by CI and the dashboard"
— a capability that must run headlessly outside `apps/manager-dashboard`'s React
runtime, which none of 008-010's dashboard-only work required.
`apps/manager-dashboard` gains routes that call into this package as a library,
not a duplicate implementation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                                                                                                      | Why Needed                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Simpler Alternative Rejected Because                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New top-level `packages/eval` rather than folding eval logic into `@windwise/core` or `apps/manager-dashboard` | Platform TR/§2.3 requires the deterministic suite to run in CI "on every PR" as a headless process with no browser/React runtime and no dashboard dependency — `apps/manager-dashboard` code cannot run in that context. Folding it into `@windwise/core` would violate TR-1 (core stays pure recommendation logic only, no suite-running/CLI/reporting concerns) and would force every `@windwise/core` consumer to carry eval-orchestration weight it doesn't need. | A single package was considered (avoid a 5th package), but `@windwise/core` staying free of CLI/reporting/CI-invocation concerns is exactly the boundary rule TR-1 already established and 005-010 have consistently respected — eval orchestration is a distinct concern from recommendation computation, matching how the platform plan's own repository layout (§5.1) already separates them. |
