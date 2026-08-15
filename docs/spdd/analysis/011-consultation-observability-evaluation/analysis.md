---
work_item: 011-consultation-observability-evaluation
sequence: 011
slug: consultation-observability-evaluation
---

# SPDD Analysis: Consultation Observability Evaluation

## Original Business Requirement

# Feature Specification: Consultation Observability & Evaluation Suites

**Feature Branch**: `011-consultation-observability-evaluation`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Manager dashboard observability into individual
consultations (search, replay, transcript, tool calls), platform-wide analytics
(volume, completion, drop-off, click-through), and evaluation suites that run
test scenarios against a chosen rule set and report pass/fail with regression
detection."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Investigating one consultation in detail (Priority: P1)

A manager gets a report that a specific visitor's recommendation seemed wrong
and needs to see exactly what happened in that consultation — what was asked,
what was answered, what was recommended, and which versions were in effect.

**Why this priority**: This is the concrete, ground-truth debugging path for
individual complaints and is the foundation the analytics and evaluation
features build trust on top of.

**Independent Test**: Can be fully tested by searching for a known consultation,
opening it, and confirming its criteria, recommendation result, versions used,
and full conversation transcript with tool calls are all visible.

**Acceptance Scenarios**:

1. **Given** a manager with observability access, **When** they search
   consultations (e.g., by date, session reference, or outcome), **Then**
   matching consultations are returned.
2. **Given** a specific consultation, **When** it is opened, **Then** the
   manager sees the criteria collected, the recommendation produced, and which
   rule set, question set, prompt version, engine version, and LLM model were
   used to produce it.
3. **Given** a specific consultation conducted via chat, **When** it is opened,
   **Then** the manager sees the full conversation transcript including every
   tool call made and its result.
4. **Given** a specific consultation, **When** the manager replays its stored
   criteria, **Then** they can see what the current published rule set would
   recommend for the same input, alongside the original result.

---

### User Story 2 - Understanding platform-wide behavior (Priority: P2)

A manager wants a regular view of how the consultation experience is performing
overall — how many people start, how many finish, where they drop off, and what
gets recommended most.

**Why this priority**: Aggregate visibility drives prioritization decisions
(e.g., which drop-off step to fix next) but depends on individual consultations
already being captured correctly (User Story 1), so it is appropriately second.

**Independent Test**: Can be fully tested by running a batch of test
consultations through different completion points and confirming the analytics
view reports accurate volume, completion rate, and drop-off by step for that
batch.

**Acceptance Scenarios**:

1. **Given** a range of completed and abandoned consultations, **When** the
   analytics view is opened, **Then** it reports total volume, completion rate,
   and the step where abandonment is most common.
2. **Given** a range of completed consultations, **When** the analytics view is
   opened, **Then** it reports the most-recommended families, the click-through
   rate on recommendations, and the rate at which visitors request "other
   options."

---

### User Story 3 - Catching a rule change that breaks a known-good scenario (Priority: P1)

A manager (or CI, on every rule/prompt change) needs a way to run a battery of
known scenarios with expected and forbidden outcomes against a candidate rule
set, and see immediately if anything that used to pass now fails.

**Why this priority**: This is the platform's regression safety net for
recommendation quality; without it, a well-intentioned rule tweak can silently
break previously-correct behavior for real user segments.

**Independent Test**: Can be fully tested by authoring an evaluation suite with
at least one case, running it against a rule set known to satisfy it, confirming
a pass, then running it against a rule set known to violate it and confirming a
fail with a clear diff.

**Acceptance Scenarios**:

1. **Given** an evaluation suite with test cases specifying criteria and
   expected/forbidden outcomes, **When** it is run against a chosen rule set,
   **Then** each case is reported as pass or fail.
2. **Given** a suite run that fails one or more cases that passed in a previous
   run against a different rule set version, **When** the results are viewed,
   **Then** those cases are flagged as regressions with a diff between expected
   and actual outcome.
3. **Given** an evaluation suite, **When** it is run in CI on a pull request,
   **Then** the run completes deterministically without invoking the
   conversational AI layer, using only the engine.
4. **Given** a separate class of evaluation involving the conversational AI
   layer, **When** it is run (nightly or on prompt change, on a sampled subset),
   **Then** its results are reported distinctly from the deterministic
   engine-only suite runs.

### Edge Cases

- What happens when a manager searches for a consultation using criteria that
  match none? The search must say so plainly rather than showing a misleading
  empty state indistinguishable from "loading."
- How does the system handle replaying a consultation whose original rule set
  version has since been deleted or is otherwise unavailable? The historical
  result must still be viewable from its stored snapshot even if live replay
  against that exact version is not possible.
- What happens when an evaluation case's expected outcome becomes permanently
  unsatisfiable after a deliberate, intentional catalog or policy change? The
  system must let a manager acknowledge and update the case rather than leaving
  it perpetually red with no path forward.
- What happens when analytics are requested for a date range with zero
  consultations? The view must show a clear empty state with zero values, not an
  error.
- How does the system handle an evaluation suite whose test-case set itself
  changes between two runs being compared? The regression comparison must make
  clear which cases are new, removed, or genuinely regressed, rather than
  conflating all three.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow searching consultations by attributes such as
  date range, session reference, and outcome.
- **FR-002**: System MUST show, for any consultation, the criteria collected and
  the recommendation produced, alongside the exact rule set, question set,
  prompt version, engine version, and LLM model that produced it.
- **FR-003**: System MUST show the full conversation transcript, including every
  tool call and its result, for any chat-based consultation.
- **FR-004**: System MUST allow replaying a stored consultation's criteria
  against the currently published rule set for comparison against the original
  result.
- **FR-005**: System MUST report platform-wide volume, completion rate, and the
  step at which abandonment most commonly occurs, over a selectable date range.
- **FR-006**: System MUST report the most-recommended families, the
  click-through rate on recommendations, and the "show other options" rate, over
  a selectable date range.
- **FR-007**: System MUST support authoring evaluation suites composed of cases,
  each specifying input criteria and expected/forbidden outcomes.
- **FR-008**: System MUST run an evaluation suite against a chosen rule set
  (and, for conversational suites, prompt version) and report each case as pass
  or fail.
- **FR-009**: System MUST flag, in a suite run's results, any case that passed
  in a prior comparable run but fails in the current one, as a regression,
  distinct from newly added or removed cases.
- **FR-010**: System MUST support running the deterministic (engine-only)
  evaluation suite without invoking the conversational AI layer, suitable for
  execution on every pull request.
- **FR-011**: System MUST support running a separate conversational evaluation
  suite that does invoke the AI layer, on a sampled subset, reported distinctly
  from deterministic suite results.
- **FR-012**: System MUST version evaluation datasets so that a pass rate
  reported at one time remains comparable to, or clearly distinguishable from, a
  pass rate computed against a changed test-case set later.

### Key Entities

- **Consultation Record**: The full stored history of one consultation —
  criteria, recommendation, versions used, and (if applicable) transcript with
  tool calls.
- **Analytics Summary**: Aggregated metrics over a date range — volume,
  completion rate, drop-off step, recommended-family distribution,
  click-through, and "other options" rate.
- **Evaluation Suite**: A named, versioned collection of evaluation cases.
- **Evaluation Case**: A single scenario with input criteria and
  expected/forbidden outcomes, optionally weighted.
- **Evaluation Run**: One execution of a suite against a specific rule set (and
  prompt version, for conversational suites), producing per-case pass/fail
  results and a regression comparison against a prior run.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A manager can go from a reported bad recommendation to seeing its
  full criteria, versions, and (if chat-based) transcript in under two minutes.
- **SC-002**: The deterministic evaluation suite runs to completion on every
  pull request touching rules, fast enough to gate merges without becoming a
  bottleneck.
- **SC-003**: 100% of evaluation runs that introduce a regression against a
  previously passing case are flagged as such — zero silent regressions.
- **SC-004**: Analytics figures (volume, completion rate) computed for a fixed
  historical date range remain stable and reproducible across repeated views.
- **SC-005**: Recommendation Accuracy, Constraint Violations, Invalid Tool
  Calls, and Hallucinated Catalog Data are each computed using the defined
  formula and reported per evaluation run, with the latter two metrics treated
  as pass/fail correctness gates (target zero) rather than gradually-improved
  quality scores.

## Assumptions

- This feature is read-and-analyze only with respect to rule sets, question
  sets, and prompt versions — authoring them is covered in
  [009-recommendation-rules-authoring](../009-recommendation-rules-authoring/spec.md)
  and
  [010-consultation-flow-configuration](../010-consultation-flow-configuration/spec.md).
- Conversation logs and tool-call records already exist as a byproduct of the
  conversational assistant's operation; this feature surfaces and analyzes them
  rather than defining how they are captured.
- Cost/token metrics (tokens in/out, cost, latency) are shown as part of the
  transcript view but detailed cost-management tooling (budgets, alerts) is out
  of scope for this feature.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **App** (`apps/manager-dashboard`): the only app this feature's UI lands in —
  a TanStack Start unit already used by prior batches (008-010) for staff-facing
  list/detail/draft-publish surfaces; observability search, analytics, and
  evaluation authoring extend the same app rather than introducing a new one.
- **Shared Package convention** (`packages/*` with `workspace:*` references and
  `exports`-based boundaries): the established pattern this feature's
  plan.md/research.md follow when proposing a new `packages/eval` package — no
  shared packages currently named `db`, `core`, `ai`, `schemas`, or `eval` exist
  yet in the repo (only `ui`, `query`, `vite-config` are built), so this
  feature's supporting infrastructure (recommendation engine, persistence layer,
  AI tool wiring) is itself still conceptual, planned by upstream specs
  005/006/009/010 rather than already implemented.
- **Workspace Validation Run** (`vp run ready`): the existing top-level
  check/test/build gate this feature's plan proposes extending with a new CI job
  (`engine-eval.yml`) that runs the deterministic evaluation suite on every pull
  request — the natural integration point already established by 001's bootstrap
  work.
- **Version-pinned recommendation artifacts** (rule set, question set, prompt
  version, engine version, LLM model): named and planned in 009 (rules
  authoring) and 010 (consultation flow configuration) as the entities a
  consultation records a snapshot of at the time it ran; this feature is the
  first to require _reading and displaying_ that pinning together in one place
  (a consultation detail view) rather than only producing it.

#### New Concepts Required

- **Consultation Record / Consultation Search**: a manager-facing view over
  stored consultation history (criteria, recommendation, version pins,
  transcript) — does not exist yet in any form; depends on 005's
  guided-consultation flow and 006's compare/upgrade flow already persisting
  session, answer, and recommendation-run data for this feature to read.
- **Conversation Transcript with Tool Calls**: a structured, chronological view
  of a chat-based consultation's messages and every tool invocation and result —
  relates to 005's conversational assistant infrastructure as a byproduct this
  feature surfaces rather than originates; the assumption section is explicit
  that capture itself is out of scope here.
- **Consultation Replay**: taking a stored consultation's criteria and
  re-running it against the currently published rule set to compare against the
  original result — a new capability that reuses the same recommendation
  computation 005/006/009 already define, applied to historical input rather
  than a live session.
- **Analytics Summary**: aggregate, date-ranged metrics (volume, completion
  rate, drop-off step, most-recommended families, click-through rate, "other
  options" rate) computed over consultation and recommendation history — a new
  read/aggregation concept with no existing counterpart; depends on
  abandonment/drop-off and click-through events being recorded somewhere in the
  consultation flow (010's scope), which this feature assumes rather than
  defines.
- **Evaluation Suite / Evaluation Case / Evaluation Run**: a named, versioned
  collection of test scenarios (each with input criteria and expected/forbidden
  outcomes) that can be executed against a chosen rule set (and, for
  conversational suites, prompt version) to produce pass/fail results — an
  entirely new domain absent from the codebase; relates to the rule sets and
  question sets 009 defines as the thing being tested, and to 005/006's
  recommendation computation as the thing being invoked.
- **Regression Comparison**: classification of an evaluation case, across two
  runs, as new, removed, regressed, fixed, or stable — a new analytical concept
  specific to evaluation runs, distinct from and more precise than a simple
  pass-count delta.
- **Deterministic vs. Conversational Evaluation**: two structurally distinct
  evaluation execution modes — one that must never invoke the AI layer (for
  CI/PR gating) and one that deliberately does (for prompt/conversational
  quality, sampled), reported distinctly rather than merged into one pass rate.
  This split is new; nothing in the codebase today evaluates recommendation
  quality at all.
- **Evaluation Metrics** (Recommendation Accuracy, Constraint Violations,
  Invalid Tool Calls, Hallucinated Catalog Data, Completion Rate): a new set of
  computed measures attached to an evaluation run, with two of the five treated
  as strict pass/fail correctness gates (target zero) rather than
  gradually-tracked quality scores — a distinction this feature must make
  visible wherever results are reported, not just compute internally.

#### Key Business Rules

- **No AI invocation in the deterministic path** (governs Evaluation Run,
  Deterministic vs. Conversational Evaluation): the engine-only suite must be
  executable without any dependency on the conversational AI layer, so it can
  run in CI on every pull request without cost, latency, or non-determinism
  (FR-010).
- **Regression must never be silently absorbed into "new" or "removed"**
  (governs Regression Comparison, Evaluation Run): a case that passed before and
  fails now must always be reported as a regression, even when the case set has
  also changed between the two runs being compared (FR-009, SC-003).
- **Correctness gates are not quality scores** (governs Evaluation Metrics):
  Constraint Violations and Hallucinated Catalog Data must be presented and
  treated as zero-tolerance pass/fail gates, not as numbers that are acceptable
  to trend upward or downward gradually (SC-005).
- **Historical fidelity survives version deletion** (governs Consultation
  Record, Consultation Replay): a consultation's original recorded result must
  remain viewable from its own stored snapshot even if the exact rule set
  version it used is later deleted or otherwise unavailable for live replay
  (Edge Cases).
- **Read-only with respect to upstream authoring domains** (governs all new
  concepts relative to existing ones): this feature never mutates rule sets,
  question sets, prompt versions, or the consultation data it surfaces — it is
  strictly an observation and evaluation layer on top of what 005/006/009/010
  produce (Assumptions).

## Strategic Approach

#### Solution Direction

This is new construction on top of a mostly-still-conceptual foundation: the
recommendation engine, persistence layer, and AI tool wiring this feature
depends on (`@windwise/core`, `@windwise/db`, `@windwise/ai`) are not yet built
in the repository — only `packages/ui`, `packages/query`, and
`packages/vite-config` currently exist. The direction is to treat 011 as
strictly downstream of 005/006/009/010: it reads consultation, recommendation,
and version-pin data those features are responsible for persisting, and adds no
new capability to originate or mutate that data. Concretely this means three
additive surfaces inside `apps/manager-dashboard` (consultation search/detail,
platform analytics, evaluation suite authoring/runs) plus one new capability
that must run independently of the dashboard entirely — a CI-invokable
deterministic evaluation runner — because a PR-gating check cannot depend on a
running dashboard instance.

#### Key Design Decisions

- **Evaluation logic lives in its own package, not inside the dashboard app or
  the recommendation engine package**: the deterministic suite must run
  headlessly in CI on every pull request, which a React/TanStack Start app
  cannot do without a deployed instance, and folding it into the recommendation
  engine package would mix pure computation with suite-running/reporting/CLI
  concerns → recommend keeping evaluation orchestration as its own boundary,
  consumed as a library by both CI and the dashboard.
- **Deterministic suites must be structurally incapable of invoking the AI
  layer, not just configured not to**: a runtime flag (e.g., "AI disabled") can
  be misconfigured or defaulted wrong, whereas removing the dependency entirely
  makes the violation unrepresentable → recommend enforcing this as an
  architectural/dependency-boundary rule rather than a runtime conditional,
  since FR-010's "suitable for execution on every pull request" only holds if
  this guarantee cannot silently break.
- **Regression comparison must classify cases (new/removed/regressed/
  fixed/stable), not just compare aggregate pass rates**: an aggregate
  percentage cannot distinguish "we added five new hard cases" from "we broke
  five existing ones," which the spec's own Edge Cases section calls out as a
  real ambiguity → recommend per-case classification as the unit of regression
  reporting, with only the "regressed" classification surfaced as the actionable
  failure signal.
- **Evaluation metrics must visually/structurally separate correctness gates
  from quality scores**: presenting all five metrics (Recommendation Accuracy,
  Constraint Violations, Invalid Tool Calls, Hallucinated Catalog Data,
  Completion Rate) as equivalent percentages would obscure that two of them are
  zero-tolerance bugs, not gradually-improved numbers → recommend a reporting
  distinction (e.g., a gate/invariant category vs. a tracked-quality category)
  that carries through wherever a run's results are shown, per SC-005's explicit
  framing.
- **Consultation search and analytics read directly from the existing
  operational tables, not a separate denormalized analytics store**: given the
  platform's current scale (a modest catalog, no stated high-volume traffic
  target), a direct read avoids a sync/consistency problem between two copies of
  the same data → recommend deferring any analytics-optimized storage until
  volume actually demands it.

#### Alternatives Considered

- **Invoke the CI evaluation gate via an HTTP call to a deployed manager
  dashboard instance**: rejected — makes a PR-gating check depend on a live
  deployed service as a CI dependency, adds network flakiness, and inverts the
  intended dependency direction (the dashboard should consume the evaluation
  capability, not host it for CI to call).
- **A single evaluation runner with a runtime "AI enabled" flag** instead of two
  structurally separate execution modes: rejected — a flag that can be flipped
  or defaulted incorrectly is a weaker guarantee than a runner that has no path
  to the AI layer at all, for a check whose entire value (fast, free,
  deterministic CI gating) depends on that guarantee holding every time.
- **Compare evaluation runs by aggregate pass-rate percentage only**: rejected —
  cannot distinguish a genuine regression from the effect of adding new cases or
  removing old ones, which is precisely the confusion the spec's Edge Cases
  section requires the system to avoid.
- **Report all evaluation metrics as undifferentiated dashboard numbers**:
  rejected — directly conflicts with SC-005's requirement that certain metrics
  be treated as pass/fail correctness gates rather than gradually-improved
  scores.
- **Pre-aggregate analytics into a dedicated warehouse-style table**: rejected
  for now — premature at the platform's current stated scale, and introduces a
  two-copies-of-the-same-data consistency problem without a demonstrated need.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **"Search consultations by attributes such as date range, session reference,
  and outcome" (FR-001) does not enumerate the full attribute set**: unclear
  whether managers also need to search by intent (discover/compare/upgrade),
  recommended family, or manager-assigned tags — needs clarification on the
  minimum searchable attribute set before search UI scope is finalized.
- **"Under two minutes" (SC-001) has no defined starting point**: unclear
  whether the two-minute budget starts from "manager receives the report"
  (includes finding the right consultation) or from "manager begins searching" —
  affects whether search relevance/speed or detail-view completeness is the
  binding constraint.
- **"Sampled subset" for conversational evaluation (FR-011) has no defined
  sampling rate or selection strategy**: unclear whether sampling is random,
  criteria-stratified, or fixed-size — needs a concrete policy before the
  conversational suite's coverage claims can be made meaningfully.
- **"Comparable run" for regression purposes (FR-009) is undefined**: unclear
  what makes two evaluation runs "comparable" for regression detection — same
  suite version only, or also same/different rule set version, same/different
  prompt version — this materially changes what counts as a regression versus an
  expected change.

#### Edge Cases

- **Consultation replay against a deleted rule set version**: the spec's own
  edge case requires the original result to remain viewable from a stored
  snapshot even when live replay isn't possible — this depends on consultation
  records capturing a complete enough snapshot (not just a version reference) to
  render historically, which is a persistence responsibility owned by upstream
  features (005/006/009/010), not this one; a gap here would surface only when a
  version is actually deleted.
- **Evaluation case with a permanently unsatisfiable expected outcome after an
  intentional catalog/policy change**: the spec requires a path for a manager to
  acknowledge and update the case rather than it staying perpetually red — this
  implies an evaluation case needs its own review/ acknowledgment state, a
  lifecycle concept not otherwise described anywhere else in the spec's Key
  Entities.
- **Analytics requested for a date range with zero consultations**: must render
  a clear empty state with zero values rather than an error — straightforward,
  but worth explicit attention since a naive aggregation query returning
  `null`/`NaN` for an empty range is a common failure mode.
- **Evaluation case set changing between two compared runs**: the regression
  comparison must distinguish new/removed/genuinely-regressed cases rather than
  conflating them — a real risk if case identity isn't stable across suite edits
  (e.g., a case's identity must survive a wording edit to its criteria, or it
  will misreport as "removed + new" instead of "same case, changed").
- **Consultation search returning zero matches**: must say so plainly, distinct
  from a loading state — a UI-state edge case rather than a data one, but
  explicitly called out because a misleading empty state directly undermines the
  "manager needs ground truth fast" goal of User Story 1.

#### Technical Risks

- **This feature's entire foundation is unbuilt**: `@windwise/core`,
  `@windwise/db`, and `@windwise/ai` — the packages this feature's own plan.md
  assumes as read dependencies — do not exist in the repository yet, and neither
  do the consultation/recommendation-run/conversation-log tables this feature
  reads. Risk: 011 cannot be implemented or even meaningfully tested in
  isolation until 005/006/009/010 (or at least their persistence layers) land;
  sequencing this after those features is not optional, it's a hard dependency.
- **Deterministic-suite AI-isolation guarantee is only as strong as its
  enforcement mechanism**: if the "no AI import" boundary is not mechanically
  enforced (e.g., via a lint/dependency-boundary rule) but only followed by
  convention, a future change could quietly reintroduce an AI dependency into
  the deterministic path, silently breaking FR-010's CI-gating guarantee and its
  associated cost/speed assumptions.
- **Analytics correctness depends on drop-off and click-through events actually
  being recorded upstream**: this feature assumes the consultation flow (010's
  scope) records step-level abandonment and recommendation click-through
  somewhere queryable; if that instrumentation doesn't exist or is incomplete
  when 011 is built, FR-005/FR-006 cannot be satisfied by a read-only layer no
  matter how the query is written.
- **Direct reads over operational tables may not scale indefinitely**: the
  strategic decision to avoid a separate analytics store is reasonable at
  current scale, but if consultation volume grows substantially, date-ranged
  aggregation queries over live operational tables risk becoming slow or
  contending with write traffic — worth revisiting if/when volume changes
  materially from what's assumed today.

#### Acceptance Criteria Coverage

| AC#   | Description                                                                                                                         | Addressable? | Gaps/Notes                                                                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1-1 | Manager searches consultations (date, session reference, outcome) and matching consultations are returned                           | Yes          | Depends on consultation persistence existing (005/006); exact searchable attribute set needs clarification (see Ambiguities)                                    |
| US1-2 | Opening a consultation shows criteria, recommendation, and exact rule set/question set/prompt version/engine version/LLM model used | Yes          | Depends on consultation records capturing a complete version-pin snapshot at run time, an upstream (009/010) responsibility                                     |
| US1-3 | Chat-based consultation shows full transcript including every tool call and result                                                  | Yes          | Depends on conversation logs already existing as a byproduct of 005's AI tool infrastructure, per this feature's own Assumptions                                |
| US1-4 | Replaying stored criteria shows what the current published rule set would recommend, alongside the original                         | Yes          | Straightforward reuse of the recommendation engine once it exists; no new computation logic needed                                                              |
| US2-1 | Analytics view reports total volume, completion rate, and most common abandonment step for a range                                  | Yes          | Depends on step-level abandonment being recorded upstream (010's scope) — a real dependency, not just a query concern                                           |
| US2-2 | Analytics view reports most-recommended families, click-through rate, and "other options" rate                                      | Yes          | Depends on click-through and "other options" interactions being recorded upstream; not yet confirmed as captured by any prior spec                              |
| US3-1 | Evaluation suite with cases run against a chosen rule set reports each case pass/fail                                               | Yes          | New domain end-to-end; no existing precedent in the codebase, all supporting infrastructure to be built                                                         |
| US3-2 | Suite run flags cases that passed previously but now fail as regressions, with a diff                                               | Yes          | Requires a well-defined "comparable run" (see Ambiguities) and stable case identity across suite edits (see Edge Cases)                                         |
| US3-3 | Evaluation suite runs deterministically in CI without invoking the AI layer                                                         | Yes          | Requires mechanical (not conventional) enforcement of the no-AI-dependency boundary to hold reliably over time                                                  |
| US3-4 | Conversational evaluation suite runs on a sampled subset and reports distinctly from deterministic results                          | Partial      | Addressable in principle, but sampling rate/strategy is unspecified (see Ambiguities), which affects what "distinct, sampled" results actually mean in practice |

</content>
