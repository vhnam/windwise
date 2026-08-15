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
