# Feature Specification: Recommendation Rules Authoring & Testing

**Feature Branch**: `009-recommendation-rules-authoring`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Manager dashboard rule authoring without
deployment — a structured builder for scoring rules, versioned rule sets, and a
Test Recommendation tool that shows per-rule score breakdown including excluded
candidates, distinguishing hard constraints from soft scoring modifiers."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Tuning recommendation behavior without a deploy (Priority: P1)

A manager notices recommendations are off (e.g., a marching-band visitor keeps
getting oboe suggestions) and wants to fix the underlying rule without involving
engineering or a code deploy.

**Why this priority**: This is the entire point of separating rule authoring
from code — it is the platform's central promise for staying tunable in
production.

**Independent Test**: Can be fully tested by creating a rule through the
structured builder, saving it to a draft rule set, and confirming it never takes
effect on live consumer recommendations until explicitly published.

**Acceptance Scenarios**:

1. **Given** a manager with rule-authoring permission, **When** they create or
   edit a rule through the structured builder, **Then** it is saved to a draft
   rule set and has no effect on live consumer recommendations.
2. **Given** a draft rule set, **When** the manager publishes it as a new
   version, **Then** it becomes the active rule set used for all subsequent live
   recommendations, and the previous version remains available for reference.
3. **Given** a published rule set is in effect, **When** a manager wants to
   revert a change, **Then** they can publish an earlier version again without
   reconstructing it by hand.

---

### User Story 2 - Debugging why a recommendation looks wrong (Priority: P1)

A manager enters a specific set of criteria into a testing tool and needs to see
not just the ranked result, but exactly which rules fired, by how much, and
which candidates were excluded and why.

**Why this priority**: Called out directly as "the primary debugging tool of the
whole platform" — without it, rule authoring is guesswork.

**Independent Test**: Can be fully tested by entering a known criteria set
against a known rule set and confirming the score breakdown matches the expected
per-rule contributions, including any exclusions.

**Acceptance Scenarios**:

1. **Given** a set of test criteria, **When** a manager runs a test
   recommendation, **Then** they see the ranked results plus, for each
   candidate, the individual contribution of every rule that affected its score.
2. **Given** a candidate that was excluded by a hard constraint, **When** the
   manager views the test result, **Then** that candidate is still shown (in the
   test tool only) along with which rule excluded it and why.
3. **Given** the same criteria run against two different rule set versions,
   **When** a manager compares the two test results, **Then** they can see how
   the ranking or exclusions differ between versions.

---

### User Story 3 - Keeping vetoes and scores from fighting each other (Priority: P1)

A manager authors a rule that an instrument is fundamentally unsuitable (e.g.,
too large for a young player) and needs certainty that this cannot be outweighed
by unrelated positive scoring elsewhere.

**Why this priority**: Identified as a concrete correctness gap in the original
design — without a real veto mechanism, unsuitable instruments can still surface
to consumers, which is a safety/trust problem, not a tuning nuance.

**Independent Test**: Can be fully tested by authoring a constraint rule that
excludes a candidate, pairing it with a large positive modifier rule on the same
candidate, and confirming the candidate is excluded from consumer results
regardless of the modifier's size.

**Acceptance Scenarios**:

1. **Given** a rule authored as a "constraint," **When** its condition matches a
   candidate, **Then** that candidate is removed from the results consumers see,
   regardless of any modifier score it would otherwise receive.
2. **Given** a rule authored as a "modifier," **When** its condition matches a
   candidate, **Then** it adjusts that candidate's score but never removes it
   from consideration on its own.
3. **Given** the rule builder, **When** a manager authors a new rule, **Then**
   they must explicitly choose "constraint" or "modifier" as its kind — there is
   no ambiguous or default-to-either option.

### Edge Cases

- What happens when a manager authors a rule condition deeper than the allowed
  nesting depth, or using an operator outside the fixed set? The builder must
  reject it at save time with a clear explanation, not allow it through and fail
  later.
- What happens when two published rule sets could theoretically both be "active"
  at once? The system must guarantee exactly one published rule set is live for
  consumer recommendations at any time.
- How does the system handle a test recommendation run against criteria that
  match zero rules at all? It must show the unmodified baseline ranking rather
  than erroring.
- What happens when a manager tries to publish a rule set that references a
  target (family/model/brand) that no longer exists in the catalog? The publish
  must be blocked with a clear error identifying the missing reference.
- What happens when a rule's reason template references a placeholder that isn't
  present in the matched criteria? Publish-time validation must catch this
  rather than surfacing a broken message to consumers later.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a structured rule builder that does not
  require writing free-form code or expressions.
- **FR-002**: System MUST require every rule to be authored as one of two
  distinct kinds — constraint (hard exclude/require) or modifier (soft score
  adjustment) — with no rule ambiguous between the two.
- **FR-003**: System MUST evaluate rule conditions using a fixed, closed set of
  operators (equals, not-equals, less-than, less-than-or-equal, greater-than,
  greater-than-or-equal, in, between, and/or/not) with a maximum nesting depth,
  validated on save.
- **FR-004**: System MUST save rule edits to a draft rule set that has no effect
  on live consumer recommendations until explicitly published.
- **FR-005**: System MUST version rule sets, keeping prior published versions
  retrievable and re-publishable.
- **FR-006**: System MUST guarantee exactly one published rule set is active for
  live consumer recommendations at any given time.
- **FR-007**: System MUST provide a Test Recommendation tool accepting arbitrary
  criteria and returning ranked results using any selected rule set version
  (draft or published).
- **FR-008**: System MUST show, for each candidate in a test result, the
  per-rule contribution to its score.
- **FR-009**: System MUST show, in the test tool only, candidates excluded by a
  constraint rule, along with which rule excluded them and why; excluded
  candidates MUST NOT be returned to consumer-facing results.
- **FR-010**: System MUST guarantee that a candidate matching an active
  exclusion constraint is removed from consumer results regardless of any
  modifier score it would otherwise accumulate.
- **FR-011**: System MUST block publishing a rule set that references a catalog
  target no longer present, or a reason template referencing an undefined
  placeholder.
- **FR-012**: System MUST record, on every live recommendation, which rule set
  version was used, enabling later reconstruction of why a recommendation
  happened.

### Key Entities

- **Rule**: A single condition-and-effect definition, authored as either a
  constraint or a modifier, targeting a family, model, or brand.
- **Rule Set**: A versioned, ordered collection of rules with a lifecycle
  (draft, published) and a publish history.
- **Score Breakdown**: The per-rule contribution detail attached to a candidate
  in a test (or historical) recommendation run.
- **Test Recommendation Run**: An ad hoc, non-persisted-to-consumers evaluation
  of criteria against a chosen rule set version, used for debugging.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A manager can change recommendation behavior (author, test, and
  publish a rule) without any code deployment, start to finish.
- **SC-002**: 100% of consumer-facing recommendation results are free of any
  candidate matching an active constraint rule — zero constraint violations, a
  correctness invariant not a quality target.
- **SC-003**: A manager can identify, via the Test Recommendation tool, the
  exact rule responsible for an unexpected exclusion or ranking in under two
  minutes.
- **SC-004**: Reverting to a previous rule set version takes a single publish
  action, with no manual reconstruction of prior rules.
- **SC-005**: Every live recommendation can be traced back to the exact rule set
  version that produced it, verified for 100% of sampled runs.

## Assumptions

- This feature builds on a populated catalog (see
  [008-catalog-management-workflow](../008-catalog-management-workflow/spec.md))
  but does not itself manage catalog content.
- Rule evaluation is deterministic: identical criteria, catalog snapshot, and
  rule set always produce identical output — this determinism is assumed as a
  platform-level guarantee this feature relies on, not something it
  re-specifies.
- The consumer-facing recommendation experience that consumes published rule
  sets is specified separately (see
  [005-guided-instrument-consultation](../005-guided-instrument-consultation/spec.md)).
