# Phase 0 Research: Guided Instrument Consultation

## 1. Valibot → JSON Schema for TanStack AI tool definitions

**Decision**: Derive tool schemas via `@valibot/to-json-schema` from the same
Valibot schemas defined in `@windwise/schemas`, feeding the resulting JSON
Schema into `toolDefinition({ schema: ... })`. Do not introduce Zod.

**Rationale**: Platform TR-5 requires domain shapes to be declared once and
derived everywhere (DB types, API contracts, form validation, LLM tool schemas).
`apps/consumer-application` already depends on `valibot` and `@tanstack/ai*`, so
no new schema library is needed if the conversion holds for the shapes this
feature actually needs: a flat criteria object (`level`, `purpose`, `budget`,
optional `age`/`section_preference`/ `physical_notes`) and a
recommendation-result object. Both are simple, non-recursive shapes — the case
the platform plan's spike was most worried about (lossy conversion) is the
rule-condition AST, which is out of scope for this feature (see
[009](../009-recommendation-rules-authoring/spec.md)).

**Alternatives considered**:

- Zod for tool schemas, Valibot for forms — rejected for this feature because it
  would mean two schema definitions for the same criteria shape, directly
  against TR-5 and against the "single implementation" reading of the
  constitution's Code Quality principle. Revisit only if the conversion is
  proven lossy in practice.
- Hand-written JSON Schema for tools — rejected, duplicates the Valibot schema
  and drifts silently.

## 2. Recommendation engine rule set for v0

**Decision**: Ship `@windwise/core` v0 with a small hardcoded rule set (not yet
DB-backed) encoding the known constraints from platform plan §4.4: age/size
exclusions, braces softening brass, purpose-based family boosts, and the
"beginner excludes professional tier regardless of budget" rule. Structure it
internally using the same constraint/modifier split defined in
[009](../009-recommendation-rules-authoring/spec.md) so the later move to a
DB-backed, manager-editable rule set is a swap of the rule _source_, not a
rewrite of the _interpreter_.

**Rationale**: This feature's spec (FR-004, FR-013) requires correct,
explainable ranking now; the rule-authoring UI and versioned `rule_sets` table
are a separate feature. Building the interpreter to the final
constraint/modifier contract from day one avoids a rework when 009 lands.

**Alternatives considered**:

- Defer all rule logic until 009 ships — rejected, this feature cannot produce
  sensible recommendations without it and the platform plan's own M0 exit
  criterion is "recommend(criteria) returns sensible ranked output."
- Free-form scoring without the constraint/modifier distinction — rejected,
  reproduces the exact bug the platform plan calls out (§1.3): a `-50` penalty
  can still lose to a `+80` and surface an unsuitable instrument.

## 3. Chat/form parity verification strategy

**Decision**: Both the chat tool (`recommendInstruments`) and the form-fallback
server function call the same `@windwise/core` `recommend()` export with the
same `@windwise/db` catalog read. Parity is verified by an integration test that
runs a fixed matrix of criteria through both entry points and asserts identical
`RecommendationResult` (excluding run-specific fields like `id`/`created_at`).

**Rationale**: Directly required by spec 005 SC-004 and platform plan TR-2
(determinism). Testing this at the integration level (not just unit level on
`core`) is what the constitution's Testing Standards principle calls for at a
package boundary.

**Alternatives considered**: Trusting unit tests on `core` alone — rejected,
does not catch a bug where the chat tool or form handler pass criteria through
inconsistently (e.g., different budget-band parsing) before calling `core`.

## 4. Session/version pinning at creation

**Decision**: `consultation_sessions.question_set_id` and, per run,
`recommendation_runs.{rule_set_id, question_set_id, prompt_version_id, engine_version, llm_model}`
are written once at session/run creation and never updated, even if a newer
version is later published. `@windwise/db` exposes `getSessionState` reading the
pinned `question_set_id`, not "the current published one."

**Rationale**: Required by platform TR-6 and spec 005 FR-011 (shareable result
must render the same result later, independent of catalog changes). Since 010's
question-set/prompt versioning tables do not exist yet, this feature creates
minimal single-row "version 1" seeds for `question_sets` and `prompt_versions`
sufficient to pin against — full authoring UI is out of scope here.

**Alternatives considered**: Resolving "current" question set/prompt at read
time — rejected outright, this is the exact bug platform plan §1.3 flags ("if a
question set is republished mid-consultation, the session must keep the version
it started with").

## 5. Output validator for anti-hallucination guarantee

**Decision**: Implement `output-validator.ts` in `@windwise/ai` as a
post-generation text scan: extract catalog-shaped tokens (model codes matching
known `brand_id + model_code` patterns, and numeric price-like tokens) from the
assistant's rendered text, and reject/regenerate once if any token is absent
from the tool result just returned, falling back to a templated response on a
second failure.

**Rationale**: Platform plan TR-3 and spec 005's implicit trust requirement
(FR-005, FR-009, FR-010) — the LLM must never fabricate a model code, spec, or
price. A prompt instruction alone is "a suggestion, not a guarantee" per
platform plan §5.3.

**Alternatives considered**: Prompt-only enforcement — explicitly rejected by
the platform plan itself as insufficient. Full grammar-constrained decoding —
rejected as unnecessary complexity for the size of this feature's output surface
(a handful of structured fields inserted into a templated explanation).

## 6. PowerSync scope boundary

**Decision**: This feature does not use `@powersync/*` for catalog/consultation
data. The existing PowerSync scaffold in `apps/consumer-application` is left
untouched and unused by any code this feature introduces.

**Rationale**: See Constitution Check in [plan.md](./plan.md) — PowerSync's
offline-first client sync model has no stated requirement in spec 005, and
introducing it would conflict with the anonymous/minimal-data posture in FR-012.
This decision should be confirmed with the user/project owner since the
constitution names PowerSync as part of the fixed stack; flagged rather than
silently overridden.

**Alternatives considered**: Route consultation state through PowerSync for
offline resilience — rejected for v1; no requirement in spec 005 calls for
offline consultation completion, only for LLM-provider-down resilience (FR-007),
which the form fallback already satisfies without offline sync.
