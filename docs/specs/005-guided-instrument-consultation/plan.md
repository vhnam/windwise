# Implementation Plan: Guided Instrument Consultation

**Branch**: `005-guided-instrument-consultation` | **Date**: 2026-08-16 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/005-guided-instrument-consultation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Visitors answer a short set of questions (level, purpose, budget required; age,
section preference, physical notes optional) via natural-language chat or a
plain multi-step form, and receive 2-3 explainable, ranked instrument
recommendations. The chat and form paths both call the same pure recommendation
engine so their output is byte-identical for identical answers — this is the
architectural guarantee the whole feature is built to prove. This is also the
platform's M0/M1 foundation slice: the shared engine, schema, and persistence
packages this feature introduces (`@windwise/schemas`, `@windwise/core`,
`@windwise/db`) do not yet exist in the monorepo and are scoped into this plan
because no separate foundation feature was specced.

## Technical Context

**Language/Version**: TypeScript, Node.js >=22.18.0, React 19 (matches existing
`apps/consumer-application`)

**Primary Dependencies**: TanStack Start (SSR + server functions), TanStack
Router (typed search params for shareable result URLs), TanStack Query, TanStack
AI (`@tanstack/ai-react` with the OpenAI/Gemini adapters already present in
`apps/consumer-application`), Valibot (schema source of truth), Drizzle ORM (new
— catalog/consultation persistence), `@windwise/ui` (ShadCN + Tailwind),
`@windwise/query`

**Storage**: PostgreSQL via a new `@windwise/db` package (Drizzle schema +
migrations). Catalog and consultation tables per the platform plan's §3 domain
map (`catalog`, `flow`, `consultation`, `ai` groups, scoped to what this feature
needs — see [data-model.md](./data-model.md))

**Testing**: `vp run -r test` (Vitest) across new packages; golden-file tests
for full engine runs in `@windwise/core`; contract tests on the `collectAnswers`
/ `recommendInstruments` tool schemas; Testing Library for the form-fallback
wizard

**Target Platform**: Web — SSR + browser client, Node server (TanStack Start
deployment target already configured in `apps/consumer-application`)

**Project Type**: Web application within an existing pnpm/Turborepo monorepo —
one app (`apps/consumer-application`), several shared packages

**Performance Goals**: Engine evaluation <50ms p95 (in-memory catalog cache);
first chat token <1.5s p95; full consultation <60s median end-to-end (targets
from the platform plan's NFR table, carried into spec 005's SC-001)

**Constraints**: LLM may only call `collectAnswers` and `recommendInstruments`
and rephrase results — it must never emit a model code, spec, or price not
present in a tool result (enforced by a post-generation output validator);
provider API keys stay server-side only; the form flow MUST remain fully
functional with the LLM provider down; consultations are anonymous — session
identifier only, no PII

**Scale/Scope**: v1 catalog target ~60-90 published models across ~14 families
(per platform plan §4.1); this feature's scope is the discover flow only —
compare/upgrade ([006](../006-instrument-compare-upgrade/spec.md)) and catalog
browsing ([007](../007-instrument-catalog-browsing/spec.md)) are separate
features that will share these same packages

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality** — PASS. Recommendation logic lives once in
  `@windwise/core` (pure TS, no React/TanStack/DB imports — enforced by an
  ESLint boundary rule per platform TR-1), consumed by both the chat tool and
  the form-fallback server function, so there is exactly one implementation, not
  two that could drift. `vp run -r build` and lint must be zero-error before
  merge, matching existing package conventions.
- **II. Testing Standards** — PASS. Golden-file tests on `@windwise/core` cover
  the golden path and edge cases (empty result, single-criterion match);
  contract tests on tool I/O schemas cover the `packages/schemas` ↔
  `packages/ai` boundary; an integration test verifies chat and form produce
  identical output for identical criteria, which is the cross-package-boundary
  case the constitution specifically calls out.
- **III. UX Consistency** — PASS. Both the chat wizard and the form wizard reuse
  `@windwise/ui` components and share loading/empty/error-state patterns; the
  "no instrument matches" edge case (spec FR-013) is one designed empty state,
  not two divergent ones per surface.
- **IV. Performance Requirements** — PASS, with a note. Drizzle is a new
  dependency added to a shared package (`@windwise/db`); it is justified by
  TR-2/TR-6 (determinism, version pinning) needing real relational storage
  rather than PowerSync's client-side sync model. This is additive to the
  existing stack, not a replacement of PowerSync in `apps/consumer-application`,
  which remains available for other use.
- **Additional Constraints — stack compatibility**: the constitution names
  `pnpm workspaces, Vite, TypeScript, PowerSync` as the fixed stack. This
  feature does not route catalog or consultation data through PowerSync — it
  uses TanStack Start server functions against PostgreSQL directly, per platform
  plan TR-4 ("server-side tools only"). PowerSync's offline-sync model is not a
  stated requirement anywhere in spec 005 (catalog data is read-mostly and
  SSR'd, not offline-edited by consumers). This is flagged, not blocked: it is
  an _addition_ to the stack (Postgres/Drizzle) rather than an incompatibility,
  but the user should confirm this reading before Phase 1 design proceeds — see
  Complexity Tracking.

**Post-Phase-1 re-check**: data-model.md and contracts/ confirm the design stays
within the four gates above — no new violations introduced during design (e.g.,
no direct DB access from `apps/consumer-application` outside generated server
functions; form and chat paths share one query layer). The single flagged item
(PowerSync scope boundary) is unchanged and still requires user confirmation,
tracked in Complexity Tracking below.

## Project Structure

### Documentation (this feature)

```text
docs/specs/005-guided-instrument-consultation/
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
├── schemas/                      # NEW — Valibot domain schemas (single source of truth)
│   └── src/
│       ├── criteria.ts           # level / purpose / budget / age / section / physical-notes
│       ├── catalog.ts            # instrument/family/pricing shapes consumed by core
│       └── recommendation.ts     # RecommendationResult, reasons, score breakdown
│
├── core/                         # NEW — pure recommendation engine (TR-1: no React/TanStack/DB imports)
│   └── src/
│       ├── recommend.ts          # recommend(criteria, catalog, ruleSet) -> RecommendationResult
│       ├── rules/                # constraint + modifier interpreter (v0: hardcoded rule set)
│       └── __tests__/            # golden-file tests per rule kind + full-run scenarios
│
├── db/                           # NEW — Drizzle schema, migrations, query modules
│   └── src/
│       ├── schema/                # catalog + flow + consultation tables (scoped to this feature)
│       └── queries/               # getSessionState, saveAnswers, persistRun
│
├── ai/                           # NEW — TanStack AI tool definitions + prompt loader
│   └── src/
│       ├── tools.ts               # collectAnswers, recommendInstruments (server-side gate)
│       └── output-validator.ts    # scans assistant text for un-sourced catalog tokens
│
├── query/                        # EXISTING — reused as-is
└── ui/                           # EXISTING — reused as-is (form wizard + result components)

apps/
└── consumer-application/         # EXISTING app, new routes/components added
    └── src/
        ├── routes/
        │   ├── consult/           # chat entry point (TanStack AI useChat)
        │   ├── form/               # non-AI multi-step fallback wizard
        │   └── result/$runId.tsx  # shareable, pinned recommendation result page
        └── lib/
            └── consultation-store.ts  # Zustand: current step, uncommitted answers only
```

**Structure Decision**: Extend the existing pnpm/Turborepo monorepo rather than
introduce a new app. Four new shared packages (`schemas`, `core`, `db`, `ai`)
are created because they are consumed by both `apps/consumer-application` and,
in later features, `apps/manager-dashboard` (the Test Recommendation tool in
[009](../009-recommendation-rules-authoring/spec.md) reuses `@windwise/core`
directly) — putting this logic in the app would force a duplicate implementation
the moment the manager dashboard needs it, which the constitution's Code Quality
principle explicitly prohibits. Only `apps/consumer-application` gains new
routes for this feature; the manager app is untouched here.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                                                                                                                  | Why Needed                                                                                                                                                                                                                                                                                                                                                                                                      | Simpler Alternative Rejected Because                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New `@windwise/db` package (PostgreSQL + Drizzle) alongside the existing PowerSync scaffold in `apps/consumer-application` | Consultation runs must be durably, relationally versioned (TR-6: every run pins `rule_set_id`, `question_set_id`, `prompt_version_id`, `engine_version`, `llm_model`) and shared read-side catalog data must be queryable from server functions in both apps. PowerSync's client-side SQLite sync model is built for offline-editable local state, not server-authoritative, cross-app catalog/versioning data. | Reusing PowerSync for this would mean syncing the entire catalog and every consultation run to each visitor's browser as a local SQLite replica, which conflicts with FR-012 (anonymous, minimal data footprint) and offers no benefit here since consumers never edit this data offline. |
| [e.g., Repository pattern]                                                                                                 | [specific problem]                                                                                                                                                                                                                                                                                                                                                                                              | [why direct DB access insufficient]                                                                                                                                                                                                                                                       |
