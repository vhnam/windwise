# Phase 0 Research: Recommendation Rules Authoring & Testing

## 1. AST validation approach

**Decision**: A recursive Valibot schema (`ast-schema.ts`) validates the
condition AST on every save — fixed operator set (`all`, `any`, `not`, `eq`,
`neq`, `lt`, `lte`, `gt`, `gte`, `in`, `between`), max nesting depth 2, enforced
structurally by the schema (not by a separate runtime check after parsing).

**Rationale**: Platform TR-7 is explicit and non-negotiable: never `eval`, never
`new Function`, never a stored expression string, because manager-authored
content is a code-injection surface. A closed-operator AST validated by schema
(not parsed as code) makes "arbitrary code execution via a rule" structurally
impossible rather than merely discouraged. Using Valibot specifically (not a
hand-rolled validator) keeps this consistent with platform TR-5's
single-schema-source principle, the same tool 005/006 already use for
`@windwise/schemas`.

**Alternatives considered**: A small custom DSL parser — rejected, adds a parser
to maintain for no benefit over a schema-validated JSON structure; the platform
plan explicitly frames the AST as "a fixed, closed operator set," which a JSON
shape expresses directly. Sandboxed `eval` (e.g., a VM context) — rejected
outright by TR-7; sandboxing mistakes are a known class of security bugs and the
fixed-AST approach avoids the entire category.

## 2. Constraint vs. modifier evaluation order

**Decision**: The interpreter evaluates all `constraint` rules for a candidate
first; if any exclude/require condition matches against it, the candidate is
removed from the result set before any `modifier` rule ever runs against it.
`modifier` rules only ever execute against candidates that survived every
constraint.

**Rationale**: This is the direct fix for the bug platform plan §1.3 names
explicitly — mixing constraint and modifier into one score means a `-50`
constraint attempt can lose to a `+80` modifier elsewhere and still surface.
Evaluating constraints to completion first, as a separate pass, makes
veto-then-score the only possible code path, not an emergent property of
tie-breaking or scoring math that could shift under future rule changes.

**Alternatives considered**: Single-pass evaluation with constraint effects
modeled as a very large negative score — explicitly the pattern platform plan
§1.3 identifies as broken; not a real alternative, included here only to record
why it's rejected.

## 3. Rule set caching and invalidation

**Decision**: `published-rule-set-cache.ts` holds the current published
`rule_set` (and its rules) in memory, populated on server start and refreshed
only when a publish action completes (research.md, tied to Complexity Tracking's
justified violation in plan.md). `recommend()` receives the cached rule set as a
parameter — it does not fetch it itself, preserving TR-1's purity requirement
(no DB import inside `@windwise/core`).

**Rationale**: The <50ms p95 engine latency target is now on the critical path
for every consumer consultation once rules move from 005's hardcoded array to a
DB-backed set; a per-call DB round-trip would jeopardize that target for no
benefit, since rule sets change only on an explicit, infrequent publish action.

**Alternatives considered**: Time-based cache expiry (e.g., re-fetch every 60s)
— rejected; it reintroduces a staleness window with no corresponding benefit,
since publish is the only event that should ever change what's active, and a
time-based approach would let a brand-new publish take up to 60s to take effect,
which conflicts with 010's expectation that a rollback "takes effect for new
consultations immediately" (010 spec SC-003 — that spec's rollback action is a
sibling concept this cache's invalidation must also satisfy for rule sets
specifically).

## 4. Test Recommendation's excluded-candidate visibility

**Decision**: `score-breakdown.ts` computes and returns `excluded_by` for every
candidate a constraint rule removed, but this field is only present in the Test
Recommendation server function's response shape — the consumer-facing
`recommendInstruments`/`getRecommendation` response shapes from 005/006 are
never given this field (their `publicView` mapping already omits it per 005's
contract).

**Rationale**: Spec FR-009 requires excluded candidates visible in the test tool
specifically, and explicitly requires they never reach consumers. Keeping this
as two distinct response shapes (internal debug-view vs. consumer publicView)
rather than one shape with a role-based field filter makes "consumers can never
see this" a type-level guarantee rather than a runtime check that could be
forgotten at a new call site.

**Alternatives considered**: One shared response shape with `excluded_by`
stripped based on caller role at the API boundary — rejected; a single shape
invites a future caller to forget the stripping step, whereas two distinct types
make the omission structural.

## 5. Rollback mechanics

**Decision**: "Publish a previous version" (spec FR-005/SC-004) is implemented
as: create a new `rule_set` row whose `rules` are a copy of the target
historical version's rules, then publish that new row. History is never mutated
or re-pointed — every `rule_set` row, once created, keeps its own immutable
version identity forever (needed for TR-6's "every live recommendation can be
traced back to the exact rule set version that produced it," which
[011](../011-consultation-observability-evaluation/spec.md) depends on).

**Rationale**: If rollback instead re-activated the _same_ historical row, old
`recommendation_runs.rule_set_id` references would become ambiguous about which
point in time they actually reflect once that row is "re-published" with a new
`published_at`. Copy-then-publish keeps every version's history linear and every
past run's version reference unambiguous.

**Alternatives considered**: Mutating the historical row's status back to
`published` in place — rejected, breaks the invariant that a
`recommendation_run.rule_set_id` pin always identifies one specific,
never-mutated set of rules (TR-6), which is foundational to 011's
observability/replay feature.
