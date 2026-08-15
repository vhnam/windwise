---
work_item: 010-consultation-flow-configuration
sequence: 010
slug: consultation-flow-configuration
---

# SPDD Analysis: Consultation Flow Configuration

## Original Business Requirement

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

## Domain Concept Identification

#### Existing Concepts (from codebase)

- Monorepo shape: `apps/manager-dashboard` (TanStack Start dashboard app) and
  `apps/consumer-application` (visitor-facing app) already exist as siblings
  under the same workspace, each with `src/routes`, `src/lib`,
  `src/integrations` — this feature's manager-facing authoring screens and the
  consumer app's flow consumption both extend already-scaffolded apps, not new
  ones. `packages/ui` and `packages/query` are the shared primitives/data layers
  referenced by plan.md as reuse targets.
- Question Set / Question (minimal v0): plan.md and data-model.md describe 005's
  spec as having already established a single-row, hardcoded
  `QuestionSet`/`Question` shape consumed by the consultation flow. No
  `packages/db` directory exists yet in the repository, so this minimal shape is
  documented intent from 005's own data-model rather than code found on disk —
  005 has not been implemented yet either. This feature's job is to promote that
  documented minimal shape into a fully versioned, manager-writable set of
  tables.
- Rule Set draft/publish/rollback pattern (from 009): data-model.md and plan.md
  repeatedly point to 009-recommendation-rules-authoring as the precedent this
  feature mirrors — a `status: draft | published` table with exactly one
  published row at a time, a condition-AST (`ast-schema.ts`) validator for
  closed-operator, depth-limited conditions, and a `can-transition.ts`-style
  role/status guard pattern from 008. None of these files exist in the
  repository yet (`packages/db`, `ast-schema.ts`, `can-transition.ts` were not
  found on disk), meaning 009 and 008 are themselves still at the spec/plan
  stage — this feature's plan explicitly assumes their eventual output as a
  dependency to reuse rather than duplicate.
- Consultation Session and Recommendation Run (from 005): data-model.md states
  `consultation_sessions.question_set_id` and
  `recommendation_runs.prompt_version_id` are already named in 005's data-model
  (per "platform TR-6") as pin points this feature must respect and populate
  meaningfully, rather than fields it introduces.
- Structured Criteria vocabulary (from 005/009): the domain-value mapping target
  (e.g. `purpose.jazz`) is the same `Criteria` field vocabulary 005 defines and
  009's rule conditions consume — a shared taxonomy this feature's
  `QuestionOption.domain_path` must stay compatible with, not a new one it can
  define independently.

#### New Concepts Required

- Question Set (versioned): promotes the existing minimal single-row concept
  into a first-class, manager-authored, versioned entity with
  `draft`/`published` status, exactly one published version active at a time —
  the object of User Story 1 and FR-001/FR-004.
- Question (with conditional visibility): a single flow step belonging to a
  question set, carrying type, required flag, bilingual prompt/help text, and a
  `visible_when` condition referencing another question in the same set — the
  mechanism behind FR-002 and Edge Case "removed question referenced by a
  visible_when."
- Question Option (with domain-value mapping): a selectable answer on a
  question, each option carrying a mapping to a structured domain value
  (`domain_path`) written into `Criteria` when selected — the object of FR-003
  and FR-009's removal-warning rule.
- Prompt Version: a versioned unit of AI system-prompt content moving through
  `draft → experimental → published`, with rollback creating a new published row
  from prior content rather than mutating history — the object of User Story 2
  and FR-005/FR-006/FR-007.
- Replay / Preview: a non-persisting simulation — either a manager walking
  through a draft question set as a hypothetical visitor, or replaying a stored
  past consultation's transcript against an experimental prompt version — that
  must never write to consumer-facing tables or appear in consumer analytics
  (FR-010, FR-011, SC-005).
- Publish-time validation for question sets: a gate that blocks a
  draft-to-published transition when any `visible_when` condition references a
  question not present in that same set — new concept requested by
  FR-008/SC-004, distinct from 009's rule-condition validator though
  structurally identical to it.
- Domain-value-in-use warning: a check performed before a manager removes a
  question option, surfacing whether any currently active rule (from 009's rule
  set) references that option's domain value — new cross-feature concept
  requested by FR-009 and the corresponding Edge Case.

#### Key Business Rules

- Version pinning at creation, immutable thereafter: `question_set_id` on a
  consultation session and `prompt_version_id` on a recommendation run are each
  written once and never updated, regardless of later publishes — governs
  Question Set and Prompt Version (FR-004, FR-006, SC-002).
- Exactly one published version at a time per lifecycle object: a Question Set
  has exactly one `published` row; a Prompt Version's `key` has exactly one
  `published` row — governs both Question Set and Prompt Version lifecycles,
  mirroring 009's rule-set invariant.
- Rollback is a forward publish of prior content, not a state reversal: a Prompt
  Version rollback must create/activate a new published entry derived from the
  earlier version's content while preserving all prior history rows intact —
  governs Prompt Version (FR-006, FR-007, and the "rollback of a rollback" edge
  case).
- Publish-time referential integrity for conditional visibility: a Question Set
  cannot transition to `published` while any question's `visible_when`
  references a question key absent from the same set — governs Question and
  Question Set together (FR-008, SC-004).
- Non-blocking but explicit warning on cross-feature-referenced deletion: a
  Question Option whose `domain_path` is used by an active rule may still be
  removed, but only after the manager is explicitly warned — governs Question
  Option in relation to 009's Rule concept (FR-009).
- Replay and preview are strictly read-only against real data and produce no
  persisted or analytics-visible side effect: governs Replay/Preview in relation
  to Consultation Session and Prompt Version (FR-010, FR-011, SC-005).
- Concurrent edits to the same draft must surface a conflict rather than
  silently overwrite: governs both Question Set and Prompt Version drafts during
  authoring (Edge Case on concurrent manager edits).

## Strategic Approach

#### Solution Direction

- Treat this feature as a direct structural repeat of the draft → publish →
  rollback pattern 009 already establishes for rule sets, applied to two
  additional version-pinned entities (`question_sets`, `prompt_versions`) that
  005's own data-model already anticipated but left unpopulated beyond a single
  seed row. The manager-facing authoring, preview, and playground screens live
  in `apps/manager-dashboard`, alongside 008/009's existing authoring surfaces;
  the consumer-facing flow in `apps/consumer-application` changes only in what
  it reads (a published, manager-authored row instead of a hardcoded seed), not
  in how it reads it.
- Data flow direction: manager authors a draft (question set or prompt version)
  → publish-time validation runs → publish demotes the prior published row and
  activates the new one → new consultation sessions/runs read the currently
  published row and pin their own foreign key to it permanently at creation time
  → preview/replay reuse the same read paths in a non-persisting mode that never
  touches consumer-facing tables.

#### Key Design Decisions

- Reuse 009's condition-AST validator for `visible_when` versus building a
  second, question-specific conditional-visibility DSL → reuse is recommended:
  both are "reference an earlier answer, closed operator set, depth-limited"
  concepts: 009's rule condition and this feature's question-visibility
  condition are the same shape applied to two different evaluation contexts, and
  a second implementation would duplicate validation logic and risk the two
  drifting apart.
- Model prompt rollback as "publish a new row derived from old content" versus
  "revert/mutate the existing published row in place" → the forward-publish
  approach is recommended: it preserves full history (a named requirement,
  FR-007) and keeps "which version was active for a given past consultation"
  answerable by simple foreign-key lookup, at the cost of prompt-version rows
  accumulating over time (accepted as a non-concern per plan.md's scale
  assessment).
- Cache strategy for reading the currently-published question set/prompt version
  versus a plain per-request DB read → a lighter cached-with-
  invalidation-on-publish approach is recommended over 009's more aggressive
  in-memory caching, because this feature's read frequency (once per session
  start, once per chat turn) is far lower than 009's
  per-recommendation-computation frequency — matching cost to actual load rather
  than reusing a heavier pattern wholesale.
- Where to enforce the domain-value-in-use warning (FR-009) versus a hard block
  → a warning-with-explicit-confirmation is recommended over a hard block, since
  the spec explicitly frames this as advisory ("must warn before allowing the
  removal") rather than prohibitive — a hard block would over-constrain managers
  in cases where the rule reference is itself being retired in the same session.
- Whether replay/preview share the same persistence-free execution path or are
  built as two separate simulation mechanisms → a single shared, non-persisting
  simulation concept (differentiated only by whether it walks a hypothetical
  visitor path or replays a stored transcript) is recommended, since both must
  satisfy the identical constraint of never writing to consumer-facing tables or
  analytics.

#### Alternatives Considered

- A dedicated new package for question-flow/prompt authoring, separate from
  `@windwise/db` and `apps/manager-dashboard` → rejected: no new cross-cutting
  concern is introduced that isn't already served by extending the existing db
  package and dashboard app, and a new package would fragment the
  draft/publish/rollback pattern across more places than necessary.
- Hard-blocking removal of a question option whose domain value is
  rule-referenced (instead of warning) → rejected: the spec explicitly requires
  only a warning, and a hard block would force managers into an awkward two-step
  "edit the rule first, then the question" sequence even when that dependency is
  intentionally being removed together.
- In-place mutation of the published prompt version row on rollback → rejected:
  it would erase the very history FR-007 requires retaining, and would make
  "which prompt version served consultation X" ambiguous for any consultation
  whose run pointed at a version subsequently overwritten.

## Risk & Gap Analysis

#### Requirement Ambiguities

- "Question-flow permission" (User Story 1's Given clause) is referenced but no
  permission/role model is defined in this spec — it's unclear whether this
  reuses an existing manager-dashboard role system (e.g. from 008) or is a new
  permission this feature must introduce.
- The exact meaning of "controlled testing" for an experimental prompt version
  (User Story 2, Acceptance Scenario 2) — "prompt playground" and "sampled
  evaluation" are both mentioned as examples, but the spec doesn't state which
  is in scope for this feature versus deferred to
  011-consultation-observability-evaluation's evaluation suites.
- "Conflict signal" for concurrent draft edits (Edge Case) is left unspecified
  in mechanism — whether this means optimistic-concurrency version checks, a
  lock, or a merge UI is not stated, only that silent overwrite must not happen.
- The scope boundary between this feature's "replay" (FR-011) and
  011-consultation-observability-evaluation's "evaluation-suite-based testing"
  is stated as an assumption but not sharply defined — a single ad hoc replay
  versus a batch of evaluation-suite replays could plausibly overlap in
  implementation.

#### Edge Cases

- A question set publish where a `visible_when` condition references a question
  that exists but was itself never visible (nested/chained conditional
  visibility) — the spec addresses referencing a _removed_ question but not
  multi-level visibility chains, which could produce visitor-facing dead ends if
  not considered.
- A prompt version rollback target that is the currently active published
  version (rolling back to itself) — not explicitly addressed; likely a no-op
  but worth confirming during design.
- A question option's domain value being referenced by a rule in a currently
  _draft_ (not yet published) rule set — FR-009 only mentions "active rule,"
  leaving unclear whether draft-rule references also warrant a warning.
- Deleting an entire question (not just an option) that other questions'
  `visible_when` conditions depend on — the spec's Edge Case covers option
  removal breaking domain-value mappings and question removal breaking
  `visible_when` references separately, but doesn't address a single delete
  action triggering both concerns simultaneously.

#### Technical Risks

- Cross-feature dependency ordering: this feature's publish-time validation
  (FR-009) and its Key Business Rules explicitly depend on
  009-recommendation-rules-authoring's rule set and condition-AST validator, and
  its Question/Prompt Version version-pin pattern depends on 005's
  already-referenced but unpopulated `question_set_id`/ `prompt_version_id`
  fields — none of 005, 008, or 009 appear to be implemented yet in this
  repository (no `packages/db` on disk), so this feature's build order is
  tightly coupled to those features landing first, or all four must be
  sequenced/coordinated together.
- Concurrency correctness for the "pin at creation, never update" invariant
  (FR-004, SC-002's zero-tolerance target) requires the publish operation and
  session/run creation to be race-safe — a session created in the same moment a
  new question set version is published must deterministically pin to one
  version or the other, not an inconsistent partial state.
- Cache invalidation correctness on publish: the plan's "cached-with-
  invalidation-on-publish" strategy for serving the currently-published question
  set/prompt version introduces a class of staleness bugs (a consumer reading a
  cache that hasn't yet invalidated after a publish) that must be handled
  carefully, especially since SC-003 requires rollback to "take effect...
  immediately."
- Reuse-vs-drift risk on the shared condition-AST: since 009's validator doesn't
  exist yet either, there is a risk this feature's `visible_when` validation is
  built ahead of or independently from 009's, producing two divergent
  implementations of the same "closed operator set, depth- limited" concept
  unless build order and shared code location are explicitly coordinated.

#### Acceptance Criteria Coverage

| AC#                                                     | Description                                                                                                      | Addressable? | Gaps/Notes                                                                                                                                                                                                                                |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1-1                                                   | Adding/removing/reordering a draft question has no effect on in-progress consultations                           | Yes          | Directly served by the version-pin business rule; depends on `question_set_id` pinning being race-safe at session creation.                                                                                                               |
| US1-2                                                   | A `visible_when` condition correctly shows/skips a question based on earlier answers                             | Yes          | Requires the shared condition-AST evaluator; nested/chained visibility edge case noted above is not explicitly covered.                                                                                                                   |
| US1-3                                                   | Selecting a mapped option produces exactly the mapped domain value                                               | Yes          | Straightforward given `QuestionOption.domain_path`; depends on the shared `Criteria` vocabulary staying in sync with 005/009.                                                                                                             |
| US1-4                                                   | Publishing a draft question set makes new consultations use it while in-progress ones keep their pinned version  | Yes          | Same version-pin rule as US1-1; the "exactly one published at a time" demotion-on-publish behavior must be transactional.                                                                                                                 |
| US2-1                                                   | New prompt version starts in draft, no effect on live consumers                                                  | Yes          | Directly served by the lifecycle default state; low ambiguity.                                                                                                                                                                            |
| US2-2                                                   | Marking a draft prompt "experimental" makes it usable for controlled testing without serving live traffic        | Partial      | Addressable, but "controlled testing" mechanism (playground vs. sampled evaluation) is ambiguous per the ambiguity noted above — scope of what counts as "usable for controlled testing" within this feature vs. 011 needs clarification. |
| US2-3                                                   | Publishing an experimental prompt version makes it active for new live consultations                             | Yes          | Directly served by the lifecycle transition and the "one published at a time" rule.                                                                                                                                                       |
| US2-4                                                   | Rolling back a published prompt restores the previous version immediately, without recreating it                 | Yes          | Served by the forward-publish rollback design decision; "immediately" places a real constraint on cache invalidation (technical risk noted above).                                                                                        |
| US3-1                                                   | Previewing a draft question set as a simulated visitor, including conditional visibility, without a real session | Yes          | Served by the shared Replay/Preview concept; must reuse the same `visible_when` evaluator as live consultations to stay accurate.                                                                                                         |
| US3-2                                                   | Replaying a past consultation transcript against an experimental prompt version without modifying the original   | Yes          | Served by the same Replay/Preview concept in "replay" mode; depends on 011's `conversation_logs` (referenced in data-model.md) being available to read from.                                                                              |
| FR-008 (publish-time `visible_when` validation, SC-004) | Blocks publish if any condition references a non-existent question                                               | Yes          | Directly addressed by the Publish-time validation concept; depends on the shared AST validator existing (cross-feature risk noted above).                                                                                                 |
| FR-009 (option removal warning)                         | Warns before removing an option whose domain value is rule-referenced                                            | Partial      | Addressable for _active_ (published) rules; whether draft-rule references also warrant a warning is an open ambiguity noted above.                                                                                                        |
| Edge Case: concurrent draft edits                       | Conflicting saves must not silently overwrite                                                                    | Partial      | The requirement to signal conflict is clear; the concrete mechanism (optimistic concurrency, lock, merge UI) is unspecified and left as an open design decision.                                                                          |
| Edge Case: rollback of a rollback                       | Must behave as a normal publish with full history preserved                                                      | Yes          | Directly resolved by the forward-publish design decision — a rollback is simply a publish of earlier content, so a second rollback is structurally identical to the first.                                                                |

</content>
