# Phase 0 Research: Instrument Compare & Upgrade Flows

## 1. Fuzzy mention resolution algorithm

**Decision**: Match free text against `model_aliases.alias` and
`instrument_models.display_name` using a deterministic string-similarity ranking
(e.g., normalized trigram/edit-distance score with fixed tie-breaking by
`model_id`), implemented in `@windwise/core` as `resolveMention()`. No LLM-based
entity resolution.

**Rationale**: TR-2 (determinism) applies to this function exactly as it does to
`recommend()` — spec FR-002 requires `resolveMention` to always return ranked
candidates, never a single silent pick, and a similarity-scored, deterministic
algorithm is what makes "same mention → same candidates" provable and testable
via golden files, same pattern as 005's engine tests.

**Alternatives considered**:

- Ask the LLM to identify the model directly — rejected: platform plan §5.3
  guard #1 requires the sufficiency/correctness check to live in code, not in
  what the model "decides"; an LLM-only resolution would make wrong matches (the
  exact "resolving '37' to the wrong Bach bore size" risk called out in
  spec 006) untestable and non-deterministic.
- Full-text search engine (e.g., Postgres `pg_trgm` extension) — accepted as the
  _implementation_ of the similarity scoring (see data-model.md), not a
  different architecture; still deterministic and still lives behind
  `resolveMention()`'s pure interface from the caller's point of view.

## 2. Session-scoped confirmation state

**Decision**: `confirmMention` persists a `(session_id, model_id)` pair to a new
`confirmed_references` table (or a `confirmed_model_ids` array on
`consultation_sessions` — see data-model.md for the chosen shape).
`compareModels` and `suggestUpgrade` both read this same state via one shared
`confirmed-model-ids.ts` query before proceeding, and reject with
`UNCONFIRMED_MODEL` if any referenced ID is absent.

**Rationale**: Spec FR-003/FR-010 and platform §5.3 guard #4 require the refusal
to be server-side and shared — if `compareModels` and `suggestUpgrade` each
implemented their own confirmation check, they could drift (e.g., one
accidentally trusting a client-supplied "already confirmed" flag). One query,
two callers, matches the constitution's Code Quality principle on duplication.

**Alternatives considered**: Trusting a confirmed flag passed as tool input —
rejected outright, this is precisely what "never left to the LLM to remember"
(platform §5.3) is warning against; tool input is attacker/model-controlled, not
a trust boundary.

## 3. Upgrade flow's Stage A skip

**Decision**: `suggestUpgrade(currentModelId, criteria)` calls into
`@windwise/core`'s Stage B logic directly (model selection within a fixed
family/tier floor), bypassing Stage A (family scoring) entirely, by reusing the
same "skip Stage A when family is already decided" branch that 005's
`section_preference = <specific family>` path already establishes. This is
implemented as one shared internal code path with two callers (`recommend()`
when `section_preference` names a family, and `suggestUpgrade()` always), not a
second implementation.

**Rationale**: Spec FR-009 requires this skip; platform plan §3.5 already
anticipated the same skip condition for discovery. Reusing rather than
reimplementing keeps the constraint/modifier interpreter and family-tier logic
in exactly one place, consistent with 005's research.md §2 decision to build the
interpreter to its final shape from day one.

**Alternatives considered**: A fully separate `suggestUpgrade` scoring path —
rejected, duplicates Stage B logic that must stay in sync with `recommend()`'s
tier/budget/discontinued constraints (spec FR-009's "at or above current tier"
is exactly a Stage B concern).

## 4. Comparison note sourcing boundary

**Decision**: `compareModelsCore()` performs the spec/price diff purely from
`instrument_models` + `price_points` (deterministic, always available), and
separately looks up any `model_comparison_notes` row for the normalized
`(model_a_id, model_b_id)` pair. If no note exists for an aspect, that aspect
section is simply omitted from the response — the function never synthesizes a
character claim.

**Rationale**: Spec FR-005 is explicit that a generated character claim with no
backing row is not permitted. Keeping the "no note found" case a plain omission
(not an error, not a placeholder) keeps the comparison function total and
predictable, matching TR-2's determinism guarantee.

**Alternatives considered**: Falling back to an LLM-generated character summary
when no note exists — explicitly rejected by the spec itself (FR-005); not a
real option here.

## 5. Intent branching placement

**Decision**: The discover/compare/upgrade choice is a new first step ahead of
005's existing question flow, implemented as its own route
(`consult/intent.tsx`) and stored as `consultation_sessions.intent` at session
creation (schema already anticipated in 005's data-model.md). Selecting
"discover" routes directly into 005's unchanged flow.

**Rationale**: Spec 006 User Story 1 requires all three options presented up
front; platform plan BR-C8 frames these as "new entry points... not a parallel
system." Storing intent at session creation (not inferred later) keeps
`recommendation_runs`/analytics able to segment by intent from day one, useful
to [011](../011-consultation-observability-evaluation/spec.md) without extra
migration work later.

**Alternatives considered**: Inferring intent from conversation content on the
discover flow (e.g., detecting a model name mentioned mid-chat) — rejected for
v1 scope; spec 006 explicitly frames this as an upfront choice, and inferring it
later reintroduces exactly the kind of implicit, unconfirmed guess FR-002/FR-003
are designed to prevent.
