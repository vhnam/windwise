# Feature Specification: Consultation Question Flow & Prompt Version Management

**Feature Branch**: `010-consultation-flow-configuration`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Manager dashboard configuration of the
consultation question flow (add/reorder/conditionally show questions, mapped to
domain values) and of AI prompt versions (draft/experimental/ published, with
rollback), both without touching chatbot code."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Changing what visitors are asked (Priority: P1)

A manager wants to add a new question, reorder existing ones, or make a question
conditionally appear only for certain earlier answers — without asking
engineering to change chatbot code.

**Why this priority**: This is the mechanism that keeps the question flow
adaptable as the business learns what matters, matching the platform's promise
that non-engineers can operate it.

**Independent Test**: Can be fully tested by adding a new question to a draft
question set, reordering it, and confirming it appears correctly in that
position when the question set is published and used in a new consultation.

**Acceptance Scenarios**:

1. **Given** a manager with question-flow permission, **When** they add, remove,
   or reorder a question in a draft question set, **Then** the change has no
   effect on any consultation already in progress.
2. **Given** a question configured with a "visible when" condition, **When** a
   visitor's earlier answers satisfy that condition, **Then** the question is
   shown; **When** they don't, **Then** it is skipped.
3. **Given** a question, **When** a manager maps one of its options to a domain
   value (e.g., "Jazz" → `purpose.jazz`), **Then** selecting that option in a
   consultation produces exactly that structured criteria value.
4. **Given** a draft question set with changes, **When** a manager publishes it,
   **Then** new consultations use the updated flow while consultations already
   in progress continue on the question set version they started with.

---

### User Story 2 - Managing AI prompt versions safely (Priority: P1)

A manager wants to try a new phrasing or instruction for the conversational
assistant, test it without affecting live consumers, and roll back quickly if it
performs worse.

**Why this priority**: Prompt changes directly affect consumer-facing
conversation quality; safe experimentation and fast rollback are essential given
how easily a prompt change can regress behavior.

**Independent Test**: Can be fully tested by creating a new prompt version in
"experimental" status, using it in a controlled test, then rolling back to the
previously published version and confirming live traffic reflects the rollback.

**Acceptance Scenarios**:

1. **Given** a manager, **When** they create a new prompt version, **Then** it
   starts in "draft" status and has no effect on live consumer conversations.
2. **Given** a draft prompt version, **When** a manager marks it "experimental,"
   **Then** it becomes usable for controlled testing (e.g., via the prompt
   playground or a sampled evaluation) without serving all live traffic.
3. **Given** an experimental prompt version, **When** a manager publishes it,
   **Then** it becomes the version used for new live consultations.
4. **Given** a published prompt version causing problems, **When** a manager
   rolls back, **Then** the previously published version becomes active again
   immediately, without needing to recreate it.

---

### User Story 3 - Trying out a change before committing to it (Priority: P2)

A manager wants to see how a draft question set or prompt version would behave
before publishing it to real visitors.

**Why this priority**: Reduces the risk of publishing a flow or prompt change
that turns out to behave badly, but the core authoring/publish loop in User
Stories 1-2 delivers value even at a slower, more cautious pace without this.

**Independent Test**: Can be fully tested by replaying a past consultation's
answers against a draft question set or experimental prompt version and
confirming the replay does not alter the original stored consultation.

**Acceptance Scenarios**:

1. **Given** a draft question set, **When** a manager previews it, **Then** they
   can walk through the flow as a visitor would, including conditional question
   visibility, without creating a real consumer-facing session.
2. **Given** an experimental prompt version, **When** a manager replays a past
   real consultation's transcript against it, **Then** they can compare the
   experimental response to what was originally said, and the original stored
   consultation is left unmodified.

### Edge Cases

- What happens when a visitor is mid-consultation and the question set they
  started with is republished with different questions? Their session must
  continue on the pinned version they started with, not switch mid-flow.
- What happens when a manager deletes a question that has a domain-value mapping
  already relied upon by an active rule set? The system must warn before
  allowing the removal, since it could break rule matching.
- What happens when a "visible when" condition for a question references another
  question that has since been removed? Publish-time validation must catch this
  rather than producing a broken flow live.
- How does the system handle rolling back a prompt version that was itself
  rolled back from (i.e., rollback of a rollback)? It must behave as a normal
  publish of that earlier version, with full history preserved.
- What happens when two managers edit the same draft question set or prompt
  version concurrently? Conflicting saves must not silently overwrite one
  another without at least a conflict signal.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow adding, removing, and reordering questions
  within a draft question set without requiring a code change.
- **FR-002**: System MUST support conditional visibility on a question,
  evaluated against previously answered questions in the same session.
- **FR-003**: System MUST allow mapping each question option to a structured
  domain value, and MUST produce exactly that value when the option is selected.
- **FR-004**: System MUST version question sets, and MUST pin each consultation
  session to the question set version active at the moment it started,
  unaffected by later publishes.
- **FR-005**: System MUST support a prompt version lifecycle of draft →
  experimental → published, with published prompt versions usable by new live
  consultations and non-published versions excluded from live traffic.
- **FR-006**: System MUST allow rolling back to any previously published prompt
  version, making it active again without requiring it to be recreated.
- **FR-007**: System MUST retain the full history of prompt versions and
  question set versions, including which was active for any given past
  consultation.
- **FR-008**: System MUST validate, before publishing a question set, that every
  "visible when" condition references an existing question — blocking publish
  otherwise.
- **FR-009**: System MUST warn a manager before removing a question option whose
  domain-value mapping is referenced by an active rule.
- **FR-010**: System MUST allow previewing a draft question set as a simulated
  visitor flow without creating a real consumer-facing consultation session.
- **FR-011**: System MUST allow replaying a past consultation's transcript
  against an experimental prompt version for comparison, without modifying the
  original stored consultation.

### Key Entities

- **Question Set**: A versioned, ordered collection of questions with
  conditional visibility rules and option-to-domain-value mappings.
- **Question**: A single prompt shown to a visitor, with its type, required
  flag, and mapped options.
- **Prompt Version**: A versioned piece of AI system-prompt content moving
  through draft → experimental → published states, with rollback support.
- **Replay**: A non-persisting simulation of a past consultation or a preview
  walkthrough, used to evaluate a draft/experimental version before publish.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A manager can publish a question flow or prompt change without any
  code deployment, start to finish.
- **SC-002**: 100% of consultation sessions retain the question set version they
  were pinned to at creation, even when that question set is later republished —
  zero sessions switching versions mid-flow.
- **SC-003**: Rolling back a prompt version takes a single action and takes
  effect for new consultations immediately.
- **SC-004**: Zero published question sets contain a "visible when" condition
  referencing a non-existent question, enforced at publish time.
- **SC-005**: A manager can preview a draft question flow end-to-end without
  creating any record visible in consumer-facing analytics.

## Assumptions

- This feature governs configuration of the flow and prompts; the AI tool
  execution, output validation, and cost-control guards it feeds into are
  assumed to exist as part of the conversational assistant infrastructure and
  are not re-specified here.
- Domain-value mappings target the same structured criteria vocabulary used by
  [009-recommendation-rules-authoring](../009-recommendation-rules-authoring/spec.md)
  and consumed by
  [005-guided-instrument-consultation](../005-guided-instrument-consultation/spec.md).
- Evaluation-suite-based testing of prompts and question flows against
  historical scenarios is covered separately in
  [011-consultation-observability-evaluation](../011-consultation-observability-evaluation/spec.md).
