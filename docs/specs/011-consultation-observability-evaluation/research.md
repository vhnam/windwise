# Phase 0 Research: Consultation Observability & Evaluation Suites

## 1. Why a new package instead of extending an existing one

**Decision**: `packages/eval` is a new package, exposing both a library API
(`run-deterministic-suite.ts` etc.) called from `apps/manager-dashboard` server
functions and a CLI entry point (`cli.ts`) invoked directly by CI — one
implementation, two callers, per platform §5.1's explicit repository layout and
§2.3's requirement that engine eval run in CI on every PR.

**Rationale**: See plan.md's Complexity Tracking — this is the one architectural
boundary in the whole spec batch not already covered by an existing package's
stated purpose (`core` = pure recommendation, `db` = persistence, `ai` = LLM
tool wiring, `schemas` = shared shapes). A CI job running
`apps/manager-dashboard`'s React/TanStack Start server would be both wasteful
and architecturally backwards — eval should not depend on the dashboard; the
dashboard depends on eval, matching how CI depends on it too.

**Alternatives considered**: A GitHub Action that calls a manager-dashboard API
endpoint over HTTP — rejected; requires a running deployed dashboard instance as
a CI dependency, adds network flakiness to a PR gate, and inverts the intended
dependency direction (dashboard should be a consumer of eval, not the other way
around).

## 2. Deterministic suite's isolation from the AI layer

**Decision**: `run-deterministic-suite.ts` imports only from `@windwise/core`,
`@windwise/db`, and `@windwise/schemas`. It has no `@windwise/ai` import at all
— not merely "doesn't call it," but structurally cannot, enforced the same way
TR-1 enforces `@windwise/core`'s purity (an ESLint boundary rule, per plan.md's
Constitution Check).

**Rationale**: Spec FR-010 requires this suite to run "without invoking the
conversational AI layer" — making the exclusion a build-time boundary rather
than a runtime `if` check makes "the deterministic suite accidentally calls an
LLM" impossible to introduce by accident in a future change, mirroring how TR-1
protects `@windwise/core`'s purity today.

**Alternatives considered**: A single suite runner with an `aiEnabled: boolean`
flag gating LLM calls — rejected; a flag can be flipped incorrectly or defaulted
wrong, whereas a missing import is caught at compile/lint time, a stronger
guarantee for a target platform §5.7 marks as zero-tolerance-adjacent (fast,
free, deterministic CI gating depends on this staying true).

## 3. Regression comparison semantics

**Decision**: `compare-runs.ts` classifies each case ID present in either of two
runs into exactly one of: `new` (in current run's case set, not in prior),
`removed` (in prior, not in current), `regressed` (in both, passed in prior,
fails in current), `fixed` (in both, failed in prior, passes in current),
`stable-pass`/`stable-fail` (unchanged). Only `regressed` cases are surfaced as
the failure signal spec FR-009 requires; `new`/`removed` are reported but never
conflated with a regression.

**Rationale**: Spec Edge Cases explicitly calls out the exact failure mode this
prevents — a naive "compare pass counts" comparison would treat a newly added
failing case identically to a genuine regression, which spec FR-009/SC-003
requires to be distinguishable ("flagged as such, distinct from newly added or
removed cases").

**Alternatives considered**: Comparing aggregate pass-rate percentages only —
rejected; a suite that adds five new hard cases and loses zero existing ones
would show a dropping percentage indistinguishable from an actual regression,
which is precisely the ambiguity spec FR-009 is written to prevent.

## 4. Metric formulas — implementing platform §5.7 exactly

**Decision**: `metrics.ts` implements the five formulas from platform plan §5.7
verbatim (Recommendation Accuracy, Constraint Violations, Invalid Tool Calls,
Hallucinated Catalog Data, Completion Rate), and tags Constraint Violations and
Hallucinated Catalog Data as `type: 'invariant'` (target: exactly zero, a
build-breaking correctness gate) versus the other three as `type: 'quality'`
(tracked over time, not pass/fail).

**Rationale**: Spec SC-005 and platform §5.7's closing line ("treat a non-zero
value as a bug, not a number to improve gradually") require this distinction to
be visible in how results are reported, not just computed — a dashboard or CI
report that shows all five metrics as equivalent percentages would obscure
exactly the distinction the platform plan insists on.

**Alternatives considered**: Reporting all five as undifferentiated dashboard
metrics — rejected, directly contradicts platform §5.7's explicit instruction.

## 5. Consultation search and analytics query boundary

**Decision**: `search-consultations.ts` and `analytics-summary.ts` are read-only
queries over tables 005/006/009/010 already write (`consultation_sessions`,
`consultation_answers`, `recommendation_runs`, `recommendation_items`,
`conversation_logs`) — this feature adds no new write path to any of them, and
no new fields to them either; it is purely an aggregation/presentation layer.

**Rationale**: Spec 011 is explicitly scoped as "read-and-analyze only" per its
own Assumptions section — conversation logs and tool-call records already exist
as a byproduct of the conversational assistant's operation (005's `@windwise/ai`
tool infrastructure), and this feature surfaces rather than redefines them.

**Alternatives considered**: Denormalizing consultation data into a separate
analytics-optimized table (a typical data-warehousing pattern) — rejected as
premature for v1's stated scale (a handful of families, a modest catalog, no
stated high-volume traffic target yet); a direct query over the operational
tables is sufficient and avoids a sync/consistency problem between two copies of
the same data.
