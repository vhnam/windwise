# Implementation Plan: Consultation Question Flow & Prompt Version Management

**Branch**: `010-consultation-flow-configuration` | **Date**: 2026-08-16 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/010-consultation-flow-configuration/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Managers edit the consultation question flow (add/reorder/conditionally show
questions, map options to domain values) and manage AI prompt versions (draft →
experimental → published, with rollback) through `apps/manager-dashboard`,
without any code change or deploy. This is the same "author in a draft, publish
to activate, roll back instantly" pattern 009 established for rule sets, applied
to two more version-pinned entities platform TR-6 already names: `question_sets`
and `prompt_versions`. 005's minimal single-row question set (its data-model.md
"QuestionSet / Question (minimal v0)") is promoted here into the full versioned,
manager-editable entity, mirroring how 009 promoted 005's hardcoded rule set.

## Technical Context

**Language/Version**: TypeScript, Node.js >=22.18.0, React 19

**Primary Dependencies**: Same dashboard stack as 008/009 (TanStack Start server
functions, TanStack Query, `@windwise/ui`, Zustand for the rule/ question
builder's unsaved-draft editor state only); Valibot (same recursive-AST-style
validation for a question's `visible_when` condition, reusing the exact schema
shape 009 built for rule conditions — see research.md §1); Drizzle ORM.
`@tanstack/ai` is read by this feature only insofar as prompt content is what a
`PromptVersion` stores — no new AI library dependency, since
experimental-version testing (spec User Story 3) calls the existing chat tool
infrastructure from 005, not a new one.

**Storage**: PostgreSQL via `@windwise/db` — promotes 005's single-row
`question_sets`/`questions`/`question_options` into fully versioned,
manager-writable tables (platform §3.6); new `prompt_versions` table (platform
§3.6, already referenced by `recommendation_runs.prompt_ version_id` per 005's
TR-6 pin, but not previously populated by anything other than a single seed
row).

**Testing**: `vp run -r test`; unit tests on `visible_when` AST validation
(reuses 009's `ast-schema.ts` pattern, see research.md §1) and on question-set
publish-time validation (no dangling `visible_when` reference — spec FR-008);
integration test proving a session pinned to question set version N is
unaffected when version N+1 is published mid-session (spec FR-004, the core
correctness invariant of this feature, mirroring 009's "constraint always
outscores modifier" as the load-bearing test); replay integration test proving
replaying a past consultation against an experimental prompt version does not
mutate the original stored consultation (spec FR-011).

**Target Platform**: Web — `apps/manager-dashboard` (authoring, preview, replay
UIs); `apps/consumer-application`'s existing chat/form flow now reads the
published `question_set`/`prompt_version` instead of 005's single seeded row,
same "swap the source, not the interpreter" pattern 009 used for rules.

**Project Type**: Web application, same monorepo — extends
`apps/manager-dashboard`, `@windwise/db`; `@windwise/ai` gains no new runtime
dependency, only reads a DB-backed prompt instead of a hardcoded string.

**Performance Goals**: No new engine-latency-critical path — unlike 009,
question set/prompt lookups happen once per consultation session start (question
set) or once per chat turn (prompt version), not once per ranking computation,
so this plan does not need 009's aggressive in-memory-cache treatment; a
straightforward cached-with-invalidation-on- publish read (same invalidation
_trigger_, lighter _cost_, as 009's pattern) is sufficient.

**Constraints**: A consultation session's `question_set_id` MUST remain whatever
it was pinned to at creation, permanently, even across later publishes of a new
version (spec FR-004, correctness invariant, SC-002 target: zero sessions
switching versions mid-flow — same zero-tolerance framing as 009's SC-002); a
prompt rollback MUST take effect for new consultations immediately, with no
reconstruction step (spec FR-006, SC-003); publish-time validation MUST block a
question set whose `visible_when` references a removed question, and MUST warn
(not silently allow) removing an option whose domain-value mapping an active
rule references (spec FR-008/FR-009 — this is a direct dependency on 009's
`rules` table, see research.md §3); replay/preview actions MUST NOT create any
record visible in consumer-facing analytics (spec FR-010/FR-011, SC-005)

**Scale/Scope**: Question set size scoped to the ~6 criteria fields 005
established (level, purpose, budget, age, section_preference, physical_notes)
plus room for managers to add more over time; prompt version history grows
unboundedly but each version is a small text document, not a scale concern.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality** — PASS. Question `visible_when` validation reuses 009's
  condition-AST schema and validator rather than a second implementation of
  "closed operator set, depth-limited" logic — same duplication-avoidance
  reasoning 009 itself used against a from-scratch DSL.
  Version-pinning-on-creation, never-updated-after logic is one shared pattern
  applied to two entities (`question_set_id` on session creation,
  `prompt_version_id` on run creation), not two divergent pinning
  implementations.
- **II. Testing Standards** — PASS. The version-pin-survives-republish invariant
  (spec FR-004/SC-002) is tested as an integration case crossing the `db` ↔
  session-lifecycle boundary, matching the constitution's requirement that
  cross-package-boundary behavior be verified by tests. Replay-without-mutation
  (spec FR-011) is tested by asserting the original consultation's stored rows
  are byte-identical before and after a replay call.
- **III. UX Consistency** — PASS. The question-flow builder and prompt version
  manager reuse `apps/manager-dashboard`'s established draft/publish/rollback UI
  pattern from 009 (same list-view, diff-view, and publish-action affordances),
  rather than inventing a third authoring UI paradigm within the same app.
- **IV. Performance Requirements** — PASS. No new dependency; the lighter-weight
  cache described above is justified by the lower call frequency compared to
  009's per-recommendation rule set reads, so no additional Complexity Tracking
  entry is needed here (009's cache justification does not need to be re-argued
  at this smaller scale, but is reused as the same mechanism).
- **Additional Constraints — stack compatibility**: unchanged; no new
  dependency, no PowerSync involvement.

**Post-Phase-1 re-check**: data-model.md and contracts/ confirm the version-pin
pattern is applied consistently to both `question_sets` and `prompt_versions`,
and that `visible_when` validation is a call into 009's existing AST validator
rather than a parallel implementation. No new constitution risk identified.

## Project Structure

### Documentation (this feature)

```text
docs/specs/010-consultation-flow-configuration/
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
└── db/                              # EXTENDED (from 005/008/009)
    └── src/
        ├── schema/
        │   ├── question-sets.ts      # PROMOTED from 005's minimal seed table
        │   ├── questions.ts          # PROMOTED
        │   ├── question-options.ts   # PROMOTED
        │   └── prompt-versions.ts    # NEW (table existed conceptually per TR-6, unpopulated until now)
        └── queries/
            ├── question-set-write.ts   # NEW — draft/publish, reuses can-transition.ts role pattern from 008
            ├── prompt-version-write.ts # NEW — draft/experimental/published/rollback
            └── replay-consultation.ts  # NEW — read-only simulation, never writes to consultation tables

apps/
└── manager-dashboard/               # EXTENDED (from 008/009)
    └── src/
        └── routes/
            ├── question-flow/
            │   ├── index.tsx          # NEW — question list, reorder, visible_when editor (reuses 009's AST editor component)
            │   └── preview.tsx        # NEW — simulated visitor walkthrough
            └── prompts/
                ├── index.tsx          # NEW — version list, draft/experimental/published states
                ├── playground.tsx     # NEW — experimental prompt testing (platform §5.4's "prompt playground")
                └── replay.tsx         # NEW — replay a past consultation against an experimental version
```

**Structure Decision**: Extend `@windwise/db` and `apps/manager-dashboard` only
— no new package. The `visible_when` AST editor UI component is reused from
009's rule-condition builder rather than rebuilt, since both are the same
closed-operator-AST concept applied to a different domain (rule conditions vs.
question visibility conditions).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No new violations. This feature reuses 009's AST validation and caching patterns
rather than introducing new complexity.
