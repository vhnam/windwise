---
work_item: 006-instrument-compare-upgrade
sequence: 006
slug: instrument-compare-upgrade
---

# Instrument Compare & Upgrade Flows

## Requirements

Give an experienced visitor two new, guarded entry points into 005's guided
consultation engine — a compare flow that resolves free-text mentions of named
instrument models to confirmed catalog references and renders a structured,
priority-scoped side-by-side comparison, and an upgrade flow that resolves a
visitor's stated current instrument to a confirmed family/tier and produces a
same-family, same-or-higher-tier recommendation by skipping straight past the
engine's family-selection stage — both sitting behind an upfront, sticky
discover/compare/upgrade intent choice, both refusing to act on any model
reference the visitor has not explicitly confirmed in the current session, and
both reusing 005's session model, catalog, and recommendation engine and 008's
catalog data rather than duplicating any of them.

## Entities

```mermaid
classDiagram
direction TB

class ConsultationSession {
    +uuid id
    +Intent intent
    +uuid[] referenceModelIds
    +createdAt timestamp
}

class Intent {
    <<enumeration>>
    discover
    compare
    upgrade
}

class ModelMention {
    +string rawText
    +MentionCandidate[] candidates
}

class MentionCandidate {
    +uuid modelId
    +string displayName
    +number confidence
    +string matchedAlias
}

class ModelAlias {
    +uuid id
    +uuid modelId
    +string alias
    +Locale locale
}

class ConfirmedReference {
    +uuid sessionId
    +uuid modelId
    +timestamp confirmedAt
}

class ComparisonResult {
    +ComparedModel[] models
    +ComparisonNoteView[] notes
    +ComparisonAspect[] highlightedAspects
}

class ComparedModel {
    +uuid modelId
    +Specs specs
    +Tier tier
    +PricePoint price
}

class ComparisonPriority {
    +ComparisonAspect aspect
}

class ComparisonAspect {
    <<enumeration>>
    tone
    weight_response
    projection
    budget
}

class ModelComparisonNote {
    +uuid id
    +uuid modelAId
    +uuid modelBId
    +NoteAspect aspect
    +string noteVi
    +string noteEn
    +uuid sourceId
    +string author
    +string reviewedBy
    +timestamp publishedAt
}

class NoteAspect {
    <<enumeration>>
    tone
    weight_response
    projection
    general
}

class UpgradeCriteria {
    +uuid currentModelId
    +string reason
    +Level currentLevel
    +Budget upgradeBudget
}

class FamilyTierFloor {
    +Family family
    +Tier minTier
    +boolean currentIsRecommendable
}

class UpgradeRecommendation {
    +RecommendationItem[] items
    +FamilyTierFloor floor
    +boolean hasQualifyingCandidate
}

class InstrumentModel {
    +uuid id
    +Family family
    +Tier tier
    +string displayName
    +boolean discontinued
}

class RecommendationItem {
    +uuid modelId
    +number score
}

ConsultationSession "1" --> "1" Intent : has
ConsultationSession "1" --> "0..*" ConfirmedReference : accumulates
ModelMention "1" --> "0..*" MentionCandidate : ranks
MentionCandidate "0..*" --> "1" ModelAlias : matched via
MentionCandidate "0..1" ..> "0..1" ConfirmedReference : becomes upon confirm
ConfirmedReference "1" --> "1" InstrumentModel : references
ComparisonResult "1" --> "2..*" ComparedModel : contains
ComparedModel "1" --> "1" InstrumentModel : reflects
ComparisonResult "1" --> "0..*" ModelComparisonNote : displays
ComparisonPriority "1" --> "0..*" ComparisonAspect : states
ComparisonResult "0..1" ..> "0..*" ComparisonAspect : highlights per priority
UpgradeCriteria "1" --> "1" ConfirmedReference : anchored by
UpgradeCriteria "1" ..> "1" FamilyTierFloor : derives
UpgradeRecommendation "1" --> "1" FamilyTierFloor : bounded by
UpgradeRecommendation "1" --> "0..*" RecommendationItem : contains
RecommendationItem "1" --> "1" InstrumentModel : identifies
```

## Approach

1. **Three guarded entry points, one engine**: Compare and upgrade are new
   branches into 005's single consultation engine, not a second recommendation
   system. `ConsultationSession.intent` (`discover | compare | upgrade`) is set
   once at session creation and never changes mid-session — no free-text
   inference switches a session's intent after the fact, matching 005's session
   bootstrap shape.

2. **Deterministic mention resolution, never LLM guessing**: `resolveMention()`
   in `@windwise/core` performs deterministic fuzzy matching against
   `model_aliases` and catalog `display_name`, returning a ranked
   `MentionCandidate[]`. It never collapses to a single auto-selected match
   regardless of confidence — the LLM tool layer only calls this function and
   surfaces its ranked output; it does not itself decide which model was meant.

3. **One shared, server-side confirmation gate**: Confirmation is recorded via
   `pinReferenceModel()` writing a `ConfirmedReference` row, and read via one
   shared `confirmed-model-ids.ts` query. Both `compareModels` and
   `suggestUpgrade` call this same query before doing anything else — the check
   is never duplicated per flow, and it is never inferred from conversational
   state ("the LLM believes X was confirmed" is not a valid confirmation
   source).

4. **Upgrade reuses discover's scoring path, skips only Stage A**:
   `suggestUpgrade()` derives a `FamilyTierFloor` from the confirmed current
   instrument (family + tier), then calls the same `recommend()` scoring
   pipeline 005's discover flow uses, entering directly at the tier-constrained
   candidate-selection stage. Family-selection scoring (Stage A) is skipped
   entirely — never re-implemented, never re-derived by a second scorer. The
   discontinued current instrument is resolved and used to derive the floor but
   is excluded from the returned candidate set.

5. **Comparison notes are looked up, never generated**: `compareModelsCore()`
   performs a pure diff of `instrument_models` + `price_points` for the
   confirmed models, then looks up published `model_comparison_notes` rows for
   the pair. A missing note for an aspect is an omission in the `notes` array —
   the function never fabricates note content, and this behavior is not
   configurable.

6. **Priority reorders, never filters**: A visitor's stated `ComparisonPriority`
   only changes `ComparisonResult.highlightedAspects`; it is derived data laid
   on top of a comparison that always includes every confirmed model's full
   specs/tier/price. No aspect or model row is ever dropped because of a stated
   priority. For 3+-model comparisons, the same rule applies — priority scoping
   affects which rows are emphasized, not how many models appear.

7. **Two new UI flows compose 004's shared primitives**: The intent-choice
   screen, mention-candidate picker, confirmation step, comparison table, and
   upgrade result view are built from `@windwise/ui` primitives (`Card`, `Tabs`,
   `Dialog` for confirmation, `Table`/`Card` for comparison rows, `Skeleton` for
   loading, `Notice`/`Toast` for the "no match" / "no qualifying candidate"
   empty states) — no one-off controls forked in the app, consistent with 004's
   FR-006 boundary.

## Structure

### Type Relationships

- `MentionCandidate[]` (in-memory, `@windwise/schemas`) is the output shape of
  `resolveMention()`; it is never persisted.
- `ConfirmedReference` (persisted, `@windwise/db`) is the only durable record
  that a `MentionCandidate` became trusted; it is written once per
  `(session_id, model_id)` pair and never updated.
- `ComparisonResult` and `UpgradeCriteria`/`UpgradeRecommendation` (in-memory,
  `@windwise/schemas`) are pure function outputs of `compareModelsCore()` and
  `suggestUpgrade()` respectively — both reuse 005's `Criteria.level` and
  `Criteria.budget` enums rather than defining parallel ones.
- `ConsultationSession.intent` and `reference_model_ids` extend 005's session
  row; they are not a new session table.

### Dependencies

1. `apps/consumer-application` depends on `@windwise/schemas`, `@windwise/core`,
   `@windwise/db` (indirectly, via server functions), `@windwise/ai`,
   `@windwise/ui`, `@windwise/query` — all `workspace:*`, none new to the
   workspace graph.
2. `@windwise/core`'s new modules (`resolve-mention.ts`, `compare-models.ts`,
   `suggest-upgrade.ts`) depend on `@windwise/db` query functions and on 005's
   existing `recommend()` / scoring stages in the same package — they must not
   reimplement family/tier scoring.
3. `@windwise/db`'s new schema files (`model-aliases.ts`,
   `model-comparison-notes.ts`) depend on 005's `instrument_models` and
   `price_points` tables via foreign keys; new query files
   (`fuzzy-match-catalog.ts`, `pin-reference-model.ts`,
   `confirmed-model-ids.ts`) are additive to 005's query layer.
4. `@windwise/ai`'s `tools.ts` gains four new tool definitions
   (`resolveMention`, `confirmMention`, `compareModels`, `suggestUpgrade`) that
   call into `@windwise/core`; the LLM layer must not perform resolution or
   scoring itself (AGENTS.md §10).
5. This feature depends on 005 (guided-instrument-consultation, unbuilt as of
   this analysis) and 008 (catalog-management-workflow) landing first — 006
   extends packages 005 creates and cannot be implemented independently of them.
6. `packages/ui` gains no new domain components; it stays domain-free per
   AGENTS.md §9 — comparison table and intent-choice screens live in
   `apps/consumer-application`, composed from existing `@windwise/ui`
   primitives.

### Layered Architecture

1. **Schema layer** (`@windwise/schemas`): `mention.ts`, `comparison.ts` —
   Valibot shapes for tool inputs/outputs; no persistence, no side effects.
2. **Engine layer** (`@windwise/core`): pure, deterministic functions
   (`resolveMention`, `compareModelsCore`, `suggestUpgrade`) alongside 005's
   `recommend()` — same purity/determinism contract, golden-file tested.
3. **Persistence layer** (`@windwise/db`): Drizzle schema + query functions;
   owns the confirmation gate's source of truth (`confirmed-model-ids.ts`).
4. **Tool layer** (`@windwise/ai`): exposes the engine functions as LLM tool
   calls; enforces the confirmation gate server-side before invoking
   `compareModelsCore`/`suggestUpgrade`, independent of LLM-claimed state.
5. **Route/UI layer** (`apps/consumer-application`): intent choice, mention →
   confirm → result screens; composes `@windwise/ui` primitives; renders the "no
   match," "unconfirmed reference refused," and "no qualifying candidate" states
   as new empty/error states following 005's empty-state pattern.

## Operations

### Create Schema - `packages/schemas/src/mention.ts`

1. Responsibility: Define input/output Valibot shapes for mention resolution and
   confirmation (spec FR-002, FR-003).
2. Exports:
   - `MentionInput = v.object({ sessionId: v.string([v.uuid()]), rawText: v.string([v.minLength(1)]) })`
   - `MentionCandidateSchema = v.object({ modelId: v.string([v.uuid()]), displayName: v.string(), confidence: v.number([v.minValue(0), v.maxValue(1)]), matchedAlias: v.string() })`
   - `ConfirmInput = v.object({ sessionId: v.string([v.uuid()]), modelId: v.string([v.uuid()]) })`
3. Constraints: no default export; reuse 005's `v.string([v.uuid()])` pattern if
   already established there rather than inventing a new uuid validator.

### Create Schema - `packages/schemas/src/comparison.ts`

1. Responsibility: Define shapes for `CompareInput`, `ComparisonResult`,
   `UpgradeCriteria` (spec FR-004, FR-006, FR-008).
2. Exports:
   - `CompareInput = v.object({ sessionId: v.string([v.uuid()]), modelIds: v.array(v.string([v.uuid()]), [v.minLength(2)]), priority: v.optional(ComparisonAspectEnum) })`
   - `ComparisonAspectEnum = v.picklist(['tone', 'weight_response', 'projection', 'budget'])`
   - `ComparisonResultSchema` mirrors data-model.md's `ComparisonResult` shape
     (`models`, `notes`, `highlightedAspects`)
   - `UpgradeCriteriaSchema = v.object({ sessionId: v.string([v.uuid()]), currentModelId: v.string([v.uuid()]), reason: v.string(), currentLevel: /* reuse 005's Criteria.level enum */, upgradeBudget: /* reuse 005's Criteria.budget enum */ })`
3. Constraints: `currentLevel`/`upgradeBudget` MUST import and reuse 005's
   `Criteria` enums, not redeclare parallel ones (research.md decision).

### Create Db Schema - `packages/db/src/schema/model-aliases.ts`

1. Responsibility: Persist alias strings per model (data-model.md `ModelAlias`).
2. Definition: Drizzle
   `pgTable('model_aliases', { id: uuid().primaryKey().defaultRandom(), modelId: uuid('model_id').notNull().references(() => instrumentModels.id), alias: text().notNull(), locale: text().notNull() })`
   with a unique index on `(alias, locale)`.
3. Constraints: `modelId` FK to 005's `instrument_models` table; do not
   duplicate the FK target as a new models table.

### Create Db Schema - `packages/db/src/schema/model-comparison-notes.ts`

1. Responsibility: Persist reviewed playing-character notes (data-model.md
   `ModelComparisonNote`; spec FR-005).
2. Definition: Drizzle `pgTable('model_comparison_notes', ...)` with
   `modelAId`/`modelBId` uuid FKs, `aspect` as a pgEnum
   (`tone | weight_response | projection | general`), `noteVi`/`noteEn` text,
   `sourceId` FK to `sources`, `author`/`reviewedBy` text, `publishedAt`
   nullable timestamp.
3. Constraints: writes MUST normalize `(modelAId, modelBId)` lesser-id-first
   (per data-model.md) so lookups are a single unordered-pair query; enforce via
   a check constraint or write-path normalization helper, not query-time `OR`.

### Create Db Query - `packages/db/src/queries/fuzzy-match-catalog.ts`

1. Responsibility: Deterministic similarity lookup against `model_aliases` +
   `instrument_models.display_name` for a given raw text (spec FR-002).
2. Signature:
   `async function fuzzyMatchCatalog(db: Database, rawText: string): Promise<RawCandidateRow[]>`.
3. Logic: normalize `rawText` (lowercase, trim, strip punctuation) the same way
   aliases are seeded; run a bounded similarity query (e.g. trigram/`pg_trgm` or
   an indexed `ILIKE`+Levenshtein scoring depending on what 005's db setup
   already provides); return rows with a raw similarity score, unranked.
4. Constraints: pure query function, no side effects; must produce the same
   ranked order for the same input against a fixed catalog snapshot (determinism
   requirement, plan.md TR-2).

### Create Db Query - `packages/db/src/queries/pin-reference-model.ts`

1. Responsibility: Record a session-scoped confirmation (data-model.md
   `ConfirmedReference`; spec FR-003).
2. Signature:
   `async function pinReferenceModel(db: Database, sessionId: string, modelId: string): Promise<void>`.
3. Logic: `INSERT ... ON CONFLICT (session_id, model_id) DO NOTHING` —
   confirming twice is idempotent, never an error.
4. Constraints: never updates an existing row (data-model.md: "created only via
   confirmMention; never updated, only read").

### Create Db Query - `packages/db/src/queries/confirmed-model-ids.ts`

1. Responsibility: The single shared read used by both `compareModels` and
   `suggestUpgrade` to answer "has this model been confirmed in this session"
   (research.md §2; spec FR-010).
2. Signature:
   `async function confirmedModelIds(db: Database, sessionId: string): Promise<Set<string>>`.
3. Logic: `SELECT model_id FROM confirmed_references WHERE session_id = $1`,
   returned as a `Set` for O(1) membership checks by callers.
4. Constraints: this is the only place either flow may check confirmation state
   — no caller may re-derive it from session/tool-call state.

### Create Core Function - `packages/core/src/resolve-mention.ts`

1. Responsibility: Deterministic, ranked mention resolution (spec FR-002).
2. Signature:
   `function resolveMention(rawCandidates: RawCandidateRow[]): MentionCandidate[]`.
3. Logic: score/normalize confidence to `0..1`, sort descending by confidence,
   dedupe by `modelId` keeping the highest-scoring alias match, cap the returned
   list (e.g. top 5) so the visitor is never shown an unbounded candidate list.
   Never collapses to a single result regardless of the top score's margin over
   the rest.
4. Constraints: pure function — no db/network access; `fuzzy-match-catalog.ts`
   supplies the raw rows. Golden-file tested for determinism (plan.md TR-2).

### Create Core Function - `packages/core/src/compare-models.ts`

1. Responsibility: Pure spec/price diff plus note lookup (spec FR-004, FR-005,
   FR-006).
2. Signature:
   `function compareModelsCore(models: InstrumentModel[], prices: PricePoint[], notes: ModelComparisonNote[], priority?: ComparisonAspect): ComparisonResult`.
3. Logic:
   - Build `ComparedModel[]` directly from the passed `models`/`prices` — no row
     is ever omitted regardless of `priority`.
   - Filter `notes` to only `publishedAt IS NOT NULL` entries touching the
     compared model pair(s); map to `{ aspect, noteVi, noteEn }`; empty array
     when none exist — never synthesize a note.
   - Derive `highlightedAspects` from `priority` (if given) — a lookup table
     mapping stated priority to the aspects it emphasizes; if no priority was
     given, `highlightedAspects` is empty and all rows render with equal weight
     (spec US2 acceptance scenario default).
4. Constraints: pure function, no db access — caller passes in already-fetched
   rows. MUST NOT throw or drop a model for lacking a note.

### Create Core Function - `packages/core/src/suggest-upgrade.ts`

1. Responsibility: Family/tier-constrained recommendation skipping Stage A (spec
   FR-007, FR-009, FR-011).
2. Signature:
   `function suggestUpgrade(currentModel: InstrumentModel, criteria: UpgradeCriteria, catalog: InstrumentModel[], prices: PricePoint[]): UpgradeRecommendation`.
3. Logic:
   - Derive `FamilyTierFloor` from `currentModel.family`/`currentModel.tier`;
     set `currentIsRecommendable = !currentModel.discontinued`.
   - Filter `catalog` to `family === floor.family && tier >= floor.minTier`,
     excluding `currentModel.id` itself always (whether discontinued or not).
   - Call into 005's existing scoring pipeline (`recommend()`'s post-Stage-A
     entry point) against the filtered candidate set and
     `criteria.currentLevel`/`criteria.upgradeBudget` — do not re-derive family
     scoring.
   - Set `hasQualifyingCandidate = items.length > 0`; when `false`, return an
     empty `items` array rather than relaxing the floor or returning lower-tier
     candidates (spec FR-011).
4. Constraints: MUST NOT call any family-selection scoring stage; MUST NOT
   return a candidate outside `floor.family`/`floor.minTier` under any
   circumstance, including when `hasQualifyingCandidate` is false.

### Update Ai Tool - `packages/ai/src/tools.ts`

1. Responsibility: Expose `resolveMention`, `confirmMention`, `compareModels`,
   `suggestUpgrade` as LLM-callable tools, enforcing the confirmation gate
   server-side (spec FR-003, FR-010; plan.md constraint).
2. Additions (alongside 005's existing tool definitions):
   - `resolveMention(input: MentionInput)`: calls `fuzzyMatchCatalog` then
     `resolveMention()` core function; returns `MentionCandidate[]`. Never
     auto-confirms.
   - `confirmMention(input: ConfirmInput)`: calls `pinReferenceModel`; returns
     `{ confirmed: true, modelId }`.
   - `compareModels(input: CompareInput)`: first calls
     `confirmedModelIds(sessionId)`; if any `input.modelIds` entry is absent
     from that set, throws/returns a structured refusal
     (`{ error: 'unconfirmed_reference', modelId }`) and does not proceed.
     Otherwise fetches models/prices/notes and calls `compareModelsCore`.
   - `suggestUpgrade(input: UpgradeCriteriaSchema)`: same confirmation-gate
     check on `currentModelId` first; on pass, fetches catalog/prices and calls
     `suggestUpgrade` core function.
3. Constraints: the confirmation-gate check MUST be the same
   `confirmed-model-ids.ts` call in both `compareModels` and `suggestUpgrade` —
   no duplicated inline query. The LLM must never be trusted to have "already
   confirmed" a model; this check runs unconditionally on every call.

### Create Route - `apps/consumer-application/src/routes/consult/intent.tsx`

1. Responsibility: Upfront discover/compare/upgrade entry choice (spec FR-001).
2. Logic: renders three options (via `@windwise/ui` `Card`/`Tabs`); selecting
   one creates/updates the session's `intent` field once via a server function,
   then navigates into the matching flow (`discover` → existing 005 route
   unchanged; `compare` → `/compare`; `upgrade` → `/upgrade`).
3. Constraints: intent, once set, is not editable from this screen again in the
   same session; selecting "discover" must not alter any 005 route or component.

### Create Route - `apps/consumer-application/src/routes/compare/*`

1. Responsibility: Mention entry → candidate confirmation → comparison rendering
   (spec US2, FR-002–FR-006).
2. Components:
   - Mention input (free text) calling the `resolveMention` tool; renders
     `MentionCandidate[]` as a selectable list (never auto-picks the top result
     even at high confidence).
   - Confirmation step: visitor selects one candidate per mention; calls
     `confirmMention`; only after confirmation does the "add another model /
     compare now" action become available.
   - Comparison view: calls `compareModels` with all confirmed IDs for this
     session plus the visitor's stated `priority` (asked as a follow-up question
     after first render); renders `ComparisonResult` as a table (`@windwise/ui`
     `Table`/`Card`) with `highlightedAspects` visually emphasized (e.g.
     bold/border), not filtered out.
   - No-match state: when `resolveMention` returns zero candidates, render a
     `Notice`/empty state offering "fall back to discover" (links to
     `/consult/intent` with discover pre-selected).
3. Constraints: the UI must never call `compareModels` with a model ID that has
   not passed through the confirmation step in this same session; rely on the
   route/component state machine, not on remembering LLM conversational claims.

### Create Route - `apps/consumer-application/src/routes/upgrade/*`

1. Responsibility: Current-instrument entry → confirmation → reason/level/
   budget collection → upgrade recommendation (spec US3, FR-007–FR-011).
2. Components:
   - Current-instrument mention input, reusing the same resolve/confirm
     components as `/compare` (shared, not forked).
   - Reason/level/budget form (3 fields) submitted only after the current
     instrument is confirmed; calls `suggestUpgrade` tool.
   - Result view: when `hasQualifyingCandidate` is true, renders ranked
     `RecommendationItem[]` using the same recommendation card pattern 005's
     discover flow uses; when false, renders a clear "no qualifying candidate
     within your family/tier" message (`Notice`) — never a lateral/downgrade
     suggestion, never an empty-looking silent result.
3. Constraints: must not present the family-selection questions from 005's
   discover flow at any point in this route — Stage A is skipped both in logic
   and in UI (no family question is ever asked here).

### Create Tests - `packages/core/src/__tests__/resolve-mention.test.ts`, `compare-models.test.ts`, `suggest-upgrade.test.ts`

1. Responsibility: Golden-file determinism and business-rule tests (plan.md
   Testing section; spec FR-002, FR-005, FR-009, FR-011).
2. Cases:
   - `resolveMention`: same raw candidates → same ranked output across runs
     (determinism); never returns a single-item list collapsed from ambiguous
     input without preserving all plausible candidates.
   - `compareModelsCore`: model pair with a published note renders it; model
     pair with no note yields an empty `notes` array, never a placeholder
     string; `priority` changes `highlightedAspects` but never removes a
     `ComparedModel` or a spec/tier/price field.
   - `suggestUpgrade`: candidate outside family or below tier is never returned;
     discontinued current instrument is excluded from candidates but still used
     to derive the floor; empty catalog match yields
     `hasQualifyingCandidate: false` with an empty `items` array, not a thrown
     error.
3. Constraints: `import { describe, expect, it } from 'vite-plus/test'`; no
   network/db access — all inputs are in-memory fixtures.

### Create Test - `packages/ai/src/__tests__/confirmation-gate.test.ts`

1. Responsibility: Integration test proving the server-side confirmation gate
   (spec FR-010; SC-002; plan.md Testing section).
2. Case: calling `compareModels` (and separately `suggestUpgrade`) with a
   `modelId` not present in `confirmed_references` for the session MUST fail
   with a structured refusal, regardless of any conversational/LLM-supplied
   claim of prior confirmation.
3. Constraints: crosses the `ai` ↔ `db` boundary per plan.md's Constitution
   Check II — exercised against a real (test) db connection, not mocked past the
   gate.

### Create Changeset - `.changeset/compare-upgrade-flows.md`

1. Responsibility: Record shipped behavior per AGENTS.md §7 (Changesets).
2. Content: `minor` for `@windwise/schemas`, `@windwise/core`, `@windwise/db`,
   `@windwise/ai` (new public exports/tables/tool definitions); `minor` for
   `@windwise/consumer-application` (new routes).
3. Constraints: one changeset file listing all affected packages per AGENTS.md
   §7 convention; do not add `Co-authored-by`.

### Verify - workspace quality gate

1. Responsibility: Constitution I/II compliance (AGENTS.md §11).
2. Steps: `vp run -r test` (unit + golden-file + integration tests above);
   `vp check` (format/lint/typecheck); `vp run ready` as the final gate.
3. Constraints: do not merge with a failing confirmation-gate integration test
   or a failing determinism golden-file test — these two are the safety-
   critical checks for this feature (SC-002, TR-2).

## Norms

1. **Imports**: apps and packages import shared code via `workspace:*` package
   names (`@windwise/schemas`, `@windwise/core`, `@windwise/db`, `@windwise/ai`,
   `@windwise/ui`, `@windwise/query`) — never relative `../../packages/...`
   paths across package boundaries. Within a package, follow that package's
   existing `#/` alias convention where established (matches `packages/ui`'s
   pattern).
2. **Tests**: `vite-plus/test`
   (`import { describe, expect, it } from 'vite-plus/test'`). Pure-function
   tests live under each package's `src/__tests__/`; UI component/route tests,
   if added, follow `packages/ui/src/tests/` conventions (`happy-dom` +
   `@testing-library/react` as devDependencies only where needed).
3. **Package boundaries**: `packages/ui` stays domain-free — no
   `ComparisonTable`, `IntentChoice`, or instrument-specific component is added
   there; those live in `apps/consumer-application`. `packages/core` holds all
   deterministic engine logic (resolution, diffing, scoring) — the `ai` tool
   layer and app routes never reimplement scoring or matching inline.
4. **Changesets**: one `.changeset/*.md` per work item covering every package
   whose public API or shipped behavior changed (AGENTS.md §7); `minor` for new
   exports/tables/routes, `patch` for behavior-only fixes with no new surface.
   Skip changesets for docs/specs-only edits.
5. **Error handling**: server-side confirmation-gate failures and "no qualifying
   candidate" outcomes are structured return values / typed errors from tool
   functions (`{ error: 'unconfirmed_reference', modelId }`,
   `{ hasQualifyingCandidate: false, items: [] }`), not thrown exceptions
   surfaced raw to the visitor — routes render them as `Notice`/empty states,
   consistent with 005's empty-state pattern (plan.md Constitution Check III).
6. **Recommendation boundary (AGENTS.md §10)**: the LLM tool layer in
   `@windwise/ai` never invents model names, prices, specs, scores, or catalog
   facts — every fact rendered in a comparison or upgrade result traces back to
   `@windwise/core`/`@windwise/db` data.
7. **Determinism**: `resolveMention`, `compareModelsCore`, and `suggestUpgrade`
   are pure functions with no hidden randomness or wall-clock dependence,
   golden-file tested exactly like 005's `recommend()`.

## Safeguards

1. **Functional**: Do not build a second recommendation/scoring system, a second
   confirmation-check implementation, or an LLM-driven entity resolver. Do not
   add a fourth intent beyond discover/compare/upgrade. Do not let `intent`
   change after session creation.
2. **Performance**: `resolveMention`'s fuzzy match must stay within a single
   bounded, indexed query against the seed-scale `model_aliases` table — no new
   runtime dependency, no unbounded scan, and no added latency budget beyond one
   more server-side tool call per turn (plan.md Performance Goals).
3. **Security**: Confirmation state (`ConfirmedReference`) is checked
   server-side on every `compareModels`/`suggestUpgrade` call — never trusted
   from client-supplied or LLM-conversational state. No visitor can compare or
   get an upgrade recommendation for a model they have not explicitly confirmed
   in their own session.
4. **Integration**: This feature must not begin implementation ahead of 005
   (engine, catalog, session model) and 008 (catalog data) — both are currently
   unbuilt; 006 extends their packages and cannot be sequenced independently.
   `packages/ui` must not gain any new domain-specific component. Apps must not
   import `shadcn`/`@base-ui/react` directly.
5. **Business rules**: Never auto-select a mention match. Never proceed on an
   unconfirmed reference. Never fabricate a playing-character note. Priority
   reorders comparison rows, never hides a spec/tier/price row or drops a model.
   Upgrade candidates must stay within the same family and at-or-above tier with
   zero exceptions; when none qualify, say so rather than relaxing the floor or
   returning a lateral/lower-tier suggestion.
6. **Technical constraints**: Extend `@windwise/schemas`/`core`/`db`/`ai`
   exactly as 005 establishes them — do not create a new package for
   comparison/upgrade logic. `resolveMention`, `compareModelsCore`, and
   `suggestUpgrade` must remain pure functions (no db/network access inside
   them); all I/O happens in the `db`/`ai` layers that call them.
7. **Data constraints**: `ModelAlias` unique on `(alias, locale)`.
   `ConfirmedReference` unique on `(session_id, model_id)`, insert-only, never
   updated. `ModelComparisonNote` pairs normalized lesser-id-first on write;
   only rows with a non-null `published_at` are ever returned to a comparison.
8. **API constraints**: The four new tool schemas
   (`resolveMention`/`confirmMention`/`compareModels`/`suggestUpgrade`) are the
   only new public surface in `@windwise/ai`; do not rename or alter 005's
   existing tool signatures as part of this work. `CompareInput.modelIds`
   requires `minLength(2)`.
9. **Verification gate**: `vp run -r test` and `vp check` must pass, with
   particular attention to the confirmation-gate integration test (FR-010,
   SC-002) and the mention/comparison/upgrade golden-file determinism tests
   (TR-2) — these are the two safety-critical suites for this feature.
   `vp run ready` is the final workspace gate before this work item is
   considered done.
