---
work_item: 009-recommendation-rules-authoring
sequence: 009
slug: recommendation-rules-authoring
---

# SPDD Analysis: Recommendation Rules Authoring

## Original Business Requirement

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

### Supporting artifacts (read in full)

The folder `@docs/specs/009-recommendation-rules-authoring/` also contained
these files, read completely and treated as approved planning context (not
restated here so the analysis stays usable; they remain the source of truth on
disk):

- `plan.md` — implementation plan targeting `apps/manager-dashboard`,
  `@windwise/core`, `@windwise/db`; frames this feature as switching 005/006's
  engine from a hardcoded v0 rule set to a DB-backed, manager- editable one
- `research.md` — AST validation via a recursive Valibot schema (no `eval`, no
  stored expression string); constraint-before-modifier two-pass evaluation
  order; in-memory published-rule-set cache invalidated only on publish; two
  distinct response shapes (internal debug-view vs. consumer publicView) so
  excluded candidates cannot leak; copy-then-publish rollback so version history
  is never mutated
- `data-model.md` — `RuleSet`/`Rule` schema, fixed Condition AST shape (max
  nesting depth 2), discriminated `Effect` union, in-memory
  `ScoreBreakdown`/`TestRecommendationRun` shapes, publish-time validation
  checklist
- `quickstart.md` — seven validation scenarios covering draft isolation,
  publish/rollback, the constraint-wins-over-modifier invariant, breakdown
  visibility, version comparison, and publish-time validation blocking

No existing SPDD analysis or prompt under this `work_item` was present.

---

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **`@windwise/core` (planned, not yet present in `packages/`)**: The engine
  plan.md and research.md describe as already running a hardcoded v0 rule set
  from feature 005. As of this analysis, `packages/` contains only `query`,
  `ui`, and `vite-config` — no `core` package exists on disk yet. This feature's
  own plan.md treats `@windwise/core`'s `recommend()` signature as a fixed,
  already-decided contract this work extends (swap the rule _source_, not the
  interpreter) rather than something this analysis should re-derive.
- **`@windwise/db` (planned, not yet present in `packages/`)**: Same situation —
  no `db` package exists yet in the workspace, though 008's and 005's specs and
  this feature's data-model.md already describe its shape (catalog tables, and
  here `rule_sets`/`rules`).
- **`apps/manager-dashboard`**: A real, running TanStack Start app in the
  workspace (Better Auth wired, a route tree, a single index route). It has no
  rule-authoring, catalog-management, or Test Recommendation UI yet — this
  feature and 008 are the first to add domain screens to it.
- **`apps/consumer-application`**: A real, running TanStack Start + PowerSync
  app with no consultation/recommendation UI yet on disk (only a placeholder
  index route). It is the eventual consumer of a published rule set's effect,
  per 005/006, but this feature does not touch it directly.
- **`@windwise/ui`**: The shared, domain-free component library (see
  004-ui-core-foundation) that the rule builder and Test Recommendation screens
  are expected to compose from, per this feature's plan.md Constitution Check
  (III. UX Consistency).
- **Catalog (family/model/brand)**: Referenced here only as a dependency — owned
  and populated by 008-catalog-management-workflow. This feature's rules target
  catalog entities (`target: family | model | brand`) but does not create or
  manage catalog content itself, per the spec's own Assumptions section.
- **Consumer recommendation flow**: Owned by 005-guided-instrument-
  consultation. This feature changes what powers that flow (a manager- editable
  rule set instead of a hardcoded one) without altering the consumer-facing flow
  itself.

#### New Concepts Required

- **Rule**: A single condition-and-effect definition authored as either a
  `constraint` or `modifier`, targeting a family, model, or brand. New to the
  codebase — 005's hardcoded v0 rules are the only prior instance, and this
  feature is what makes the concept manager-authorable and persisted.
- **Rule Set**: A versioned, ordered collection of rules with a `draft` /
  `published` lifecycle and a publish history. New — there is no versioning or
  lifecycle concept anywhere else in the codebase to build on; this feature
  introduces it standalone for rule sets specifically.
- **Structured Rule Builder**: The manager-facing authoring surface that
  produces a validated condition AST without free-form code. New UI concept for
  `apps/manager-dashboard` — no builder-style form exists in the app today
  beyond a placeholder route.
- **Condition AST (fixed, closed operator set)**: The manager-authored,
  schema-validated structure (equals/not-equals/comparisons/in/between/
  and/or/not, max nesting depth) that replaces any notion of a stored expression
  or code string. New — this is the concept that makes rule authoring safe
  without sandboxing or code execution.
- **Score Breakdown**: The per-rule contribution detail (which rules fired, by
  how much, and which excluded a candidate and why) attached to a candidate in a
  test run. New — no scoring-transparency concept exists anywhere in the
  codebase yet, since no recommendation engine exists on disk yet either.
- **Test Recommendation Run**: An ad hoc, non-persisted, debugging-only
  evaluation of arbitrary criteria against a chosen rule set version (draft or
  published), distinct from any consumer-facing recommendation record. New —
  this is the concept that makes rule authoring safe to iterate on before
  anything goes live.
- **Publish-time validation**: The check that blocks a rule set publish if a
  rule references a catalog target that no longer exists, or a reason template
  references an undefined placeholder. New — no equivalent cross-reference
  validation exists elsewhere in the workspace yet.

#### Key Business Rules

- **Draft has no live effect** (governs Rule, Rule Set): Saving a rule edit
  never changes what consumers see until an explicit publish action.
- **Exactly one active rule set** (governs Rule Set): The system must guarantee
  exactly one published rule set is live for consumer recommendations at any
  given time — a correctness invariant, not a UX convenience.
- **Constraint always outranks modifier** (governs Rule, Score Breakdown): A
  candidate matching an active exclusion constraint is removed from consumer
  results regardless of any modifier score it would otherwise accumulate — the
  specific correctness gap this feature exists to close. Every rule must be
  authored as unambiguously one kind or the other; there is no default or hybrid
  kind.
- **Fixed, closed operator set with bounded nesting** (governs Rule): Rule
  conditions may only use a named, finite set of operators, validated at save
  time (not discovered at run time), with a maximum nesting depth.
- **Excluded candidates are debug-only** (governs Score Breakdown, Test
  Recommendation Run): Excluded candidates and the rule/reason that excluded
  them are visible only in the test tool; they must never reach consumer-facing
  results.
- **Rollback without reconstruction** (governs Rule Set): Reverting to a prior
  rule set version is a single publish action; a manager never manually
  re-creates prior rules by hand.
- **Publish is a validation gate** (governs Rule Set): A rule set cannot be
  published while it references a missing catalog target or an undefined
  reason-template placeholder — the block must name the specific rule and issue,
  not fail generically.
- **Traceability of live recommendations** (governs Rule Set, Rule): Every live
  recommendation records which rule set version produced it, so a manager can
  reconstruct after the fact why a specific recommendation happened.

## Strategic Approach

#### Solution Direction

Treat this feature as the point where 005's recommendation engine stops being a
hardcoded, code-deployed rule array and becomes a manager-editable, versioned,
testable system — without touching the engine's evaluation contract itself. The
structured rule builder and Test Recommendation tool live in
`apps/manager-dashboard`, alongside 008's catalog-management work, using the
shared `@windwise/ui` library rather than a visually distinct sub-app. Authoring
produces a schema-validated condition AST (never a code string), so "no
free-form code" (FR-001) is a structural guarantee, not a policy. Rule sets are
the unit of versioning and publish/rollback, not individual rules, so
exactly-one-active-version (FR-006) and traceability (FR-012) are properties of
the rule set lifecycle rather than something each rule has to separately
guarantee. The Test Recommendation tool is a distinct, non-persisted evaluation
path that can run against any rule set version (draft or published) and surfaces
detail (excluded candidates, per-rule contributions) that must never appear in
consumer-facing results — keeping "debugging visibility" and "consumer safety"
as two different response shapes rather than one shape with a role check.

Data flow at a concept level: manager authors/edits a rule through the
structured builder → saved to a draft rule set (no live effect) → manager runs
Test Recommendation against the draft to see per-rule contributions and any
exclusions, comparing versions if useful → manager publishes, which is validated
against the current catalog and reason-template placeholders before it can take
effect → the published rule set becomes the one active version, and prior
versions remain available for direct re-publish (rollback) without hand
reconstruction.

#### Key Design Decisions

- **Structured builder producing an AST vs. a scripting/expression language**: A
  scripting language would need sandboxing to be safe against manager-authored
  input reaching production, and sandboxing is a known class of security bugs →
  **fixed, closed-operator AST validated by schema on save**, so "no arbitrary
  code" is structural rather than a policy managers could work around.
- **Constraint and modifier as two structurally distinct rule kinds vs. one rule
  type with a "severity" or "weight" field**: A single unified type with an
  extreme weight could still, in principle, be outscored by enough smaller
  modifiers, which is exactly the correctness gap User Story 3 exists to close →
  **kind is a required, explicit choice with no default**, and evaluation treats
  constraints and modifiers as separate passes rather than comparable numbers.
- **Rule set (not individual rule) as the versioned/published unit**: Versioning
  individual rules independently would make "exactly one active combination"
  ambiguous whenever two rules' versions disagree → **the rule set is the atomic
  unit of draft/publish/rollback**, so "what's live" is always one unambiguous
  answer.
- **Test Recommendation as a separate, non-persisted evaluation path vs. reusing
  the consumer recommendation path with a debug flag**: A shared path with a
  debug flag risks the excluded-candidate detail leaking to a consumer-facing
  caller that forgets to strip it → **two distinct evaluation/response shapes**,
  so "consumers never see exclusions" is a type-level property rather than a
  runtime check that could be missed at a future call site.
- **Publish-time validation as a hard gate vs. a warning managers can dismiss**:
  The edge cases explicitly call out that missing catalog references and
  undefined placeholders must be caught before they reach consumers, not
  discovered later → **publish is blocked outright**, with the specific rule and
  issue named, not a soft warning.
- **Rollback via re-publishing a copy of a prior version vs. reactivating the
  historical version in place**: Reactivating a historical row in place would
  make any live-recommendation traceability record (FR-012) that references it
  ambiguous about which point in time it actually reflects → **rollback
  publishes a new version copied from history**, keeping every version's
  identity immutable once created, which is what makes FR-012's "reconstruct why
  a recommendation happened" reliable.
- **Location in `apps/manager-dashboard` using `@windwise/ui` vs. a standalone
  rules-authoring app**: The manager-dashboard app already exists as the
  intended home for manager-facing tooling (alongside 008's catalog work), and a
  separate app would fragment the manager experience and duplicate shared UI
  dependencies → **build within `apps/manager-dashboard`**, reusing shared
  primitives rather than introducing a new visual system.

#### Alternatives Considered

- **Sandboxed expression evaluation (e.g., a VM context) for rule conditions**:
  Rejected — the spec's "no free-form code" framing (FR-001) and the general
  risk profile of manager-authored content reaching a production evaluation path
  make a closed-operator AST the safer and simpler structural choice; sandboxing
  still carries residual escape risk.
- **Single-pass scoring where constraints are modeled as very large negative
  scores**: Rejected — this is the exact pattern User Story 3 identifies as the
  platform's known correctness gap; a large-enough positive modifier could still
  numerically overcome it, which violates SC-002's zero-tolerance framing.
- **Per-rule versioning instead of per-rule-set versioning**: Rejected — it
  would make "what's currently live" a combination of independently versioned
  parts rather than one unambiguous, publishable/rollback-able unit, undermining
  FR-006's exactly-one-active guarantee.
- **One shared response shape for both consumer and test-tool results, with
  excluded-candidate data filtered by caller role**: Rejected — a single shape
  invites a future call site to forget the filtering step; keeping test-tool and
  consumer response shapes structurally distinct makes the FR-009 "excluded
  candidates must not reach consumers" guarantee harder to accidentally violate.
- **Soft publish warnings for missing catalog references or undefined
  placeholders, resolved after the fact**: Rejected — the spec's edge cases
  explicitly frame these as blocking conditions at publish time, not
  post-publish cleanup items.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **What "structured builder" means precisely for deeply nested conditions**:
  The spec requires a builder that enforces a fixed operator set and a maximum
  nesting depth, but does not itself state the numeric depth limit or which
  specific comparison affordances (e.g., date vs. numeric vs. enum fields) the
  UI must support — left to planning artifacts (data-model.md fixes depth at 2),
  which this analysis treats as already-decided technical direction rather than
  something to resolve here, but it is worth flagging that the spec text alone
  under-specifies this.
- **Scope of "rule-authoring permission"**: User Story 1 assumes a manager "with
  rule-authoring permission" exists, and User Story 2/3 reference "a manager"
  generally, but the spec does not define the permission model itself (roles,
  who can draft vs. publish vs. only test). Whether publish requires a distinct,
  higher-trust permission than draft-editing is unstated in spec.md itself.
- **What counts as "matching" for the missing-catalog-target edge case**: The
  edge case says publish must be blocked if a rule "references a target...that
  no longer exists," but a rule's condition can also reference catalog-derived
  _field values_ (e.g., a family or brand ID used inside a comparison operator,
  not just the rule's own `target`). Whether publish-time validation must also
  inspect condition bodies for stale references, or only the rule's declared
  `target`, is not fully explicit in spec.md.
- **Granularity of "compare the two test results" (User Story 2, scenario 3)**:
  The spec requires managers to see how ranking or exclusions differ between two
  rule set versions run against the same criteria, but does not specify what
  "how they differ" must surface (e.g., only which candidates changed status, or
  a full per-rule diff) — left open for downstream design.

#### Edge Cases

- **Zero rules match given criteria**: Explicitly called out in spec.md — the
  system must return the unmodified baseline ranking rather than erroring. This
  matters because an empty match set is easy to conflate with a failure state if
  not handled deliberately.
- **A rule set with zero rules at all (freshly created draft)**: Not explicitly
  named in spec.md, but implied by the draft-first lifecycle (FR-004) —
  publishing an empty rule set is not explicitly forbidden or addressed, and its
  behavior (identical to baseline, or blocked) should be clarified before
  implementation.
- **Two managers editing the same draft rule set concurrently**: Not addressed
  in spec.md. Since a draft rule set has no live effect, the blast radius of a
  lost edit is contained, but a manager could still silently overwrite another
  manager's in-progress changes.
- **Reason template placeholder validation depending on the matched criteria's
  actual runtime shape**: The edge case for undefined placeholders is framed as
  a publish-time check, but a placeholder could be structurally valid (present
  in the condition) yet still render badly for a criteria combination the
  condition matches only in one branch of an `any`/`or` — worth confirming this
  validation is thorough across all branches of a condition, not just the top
  level.
- **Publishing while a Test Recommendation Run is mid-flight against a
  soon-to-be-superseded draft version**: Since Test Recommendation Runs are ad
  hoc and non-persisted, this is likely low-impact, but the spec doesn't
  explicitly state whether an in-progress test run against a draft that gets
  published (and thus becomes a different kind of version) should behave any
  differently.

#### Technical Risks

- **Foundational packages (`@windwise/core`, `@windwise/db`) do not exist in the
  workspace yet**: This feature's own plan.md, research.md, and data-model.md
  are written as though `@windwise/core`'s `recommend()` and a v0 hardcoded rule
  set already exist from feature 005, and as though `@windwise/db` already has
  catalog tables from 008. As of this analysis, `packages/` contains only
  `query`, `ui`, and `vite-config` — neither package exists on disk. This is not
  necessarily a defect in this feature's scope (005/006/008 may be sequenced to
  land first), but it is a real dependency risk: if those packages are not in
  place before this feature's implementation begins, this feature cannot
  "promote" or "extend" anything and would instead need to build the interpreter
  and schema from scratch, which is a different and larger scope than plan.md
  currently assumes.
- **Correctness invariant (SC-002, zero constraint violations) requires rigorous
  testing, not just code review**: Because this is framed as a zero-tolerance
  invariant rather than a quality target, any implementation bug in the
  constraint-before-modifier evaluation order would be a trust-safety defect (an
  unsuitable instrument surfacing to a consumer), not merely a ranking quality
  issue. This raises the bar for test coverage around the veto path
  specifically.
- **AST validation must be genuinely structural, not merely UI-enforced**: If
  the fixed operator set and nesting-depth limit are only enforced in the
  builder's UI (client-side) and not re-validated on the save boundary itself, a
  malformed or malicious payload could still reach persistence through a non-UI
  path (e.g., a future API integration). Server-side, schema-level enforcement
  at the save boundary is necessary for FR-003's guarantee to hold.
- **Publish-time validation against a live catalog is a moving target**: Because
  the catalog (owned by 008) can change independently of rule authoring, a rule
  set that validated successfully at publish time could reference a target
  removed from the catalog afterward. The spec's FR-011 only covers the
  publish-time check; ongoing validity after publish (e.g., if a catalog entity
  is deleted post-publish) is not addressed in spec.md and is a gap worth
  flagging for the consumer-facing side.
- **Traceability (FR-012/SC-005) depends on every live recommendation path
  reliably recording the rule set version used**: If any future consumer- facing
  recommendation call site bypasses this recording step, SC-005's "100% of
  sampled runs" target silently fails without an obvious symptom until an audit
  is attempted.

#### Acceptance Criteria Coverage

| AC#                                                                       | Description                                                                           | Addressable?                                                                                                                     | Gaps/Notes                                                                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| US1.1                                                                     | Creating/editing a rule saves to a draft with no live effect                          | Yes                                                                                                                              | Directly maps to FR-004; depends on `@windwise/core`/`@windwise/db` existing or being built as part of this feature's scope    |
| US1.2                                                                     | Publishing a draft makes it the active version; prior version remains available       | Yes                                                                                                                              | Maps to FR-005/FR-006; rollback-via-copy design decision (research.md §5) keeps prior versions immutable and retrievable       |
| US1.3                                                                     | Reverting to a prior version without hand reconstruction                              | Yes                                                                                                                              | Maps to FR-005/SC-004; single publish action per the copy-then-publish decision                                                |
| US2.1                                                                     | Test run shows ranked results plus per-rule contribution per candidate                | Yes                                                                                                                              | Maps to FR-007/FR-008; depends on the Score Breakdown concept being built, which does not exist anywhere in the codebase yet   |
| US2.2                                                                     | Excluded candidate still shown in test tool with excluding rule and reason            | Yes                                                                                                                              | Maps to FR-009; requires the two-distinct-response-shapes design to hold structurally, not just by convention                  |
| US2.3                                                                     | Comparing test results across two rule set versions                                   | Partial                                                                                                                          | Maps to User Story 2 scenario 3; spec does not define what level of diff detail must be shown (see Requirement Ambiguities)    |
| US3.1                                                                     | Constraint match removes candidate from consumer results regardless of modifier score | Yes                                                                                                                              | Maps to FR-010/SC-002; this is the core correctness invariant and highest-risk item to verify thoroughly (see Technical Risks) |
| US3.2                                                                     | Modifier match adjusts score but never removes candidate on its own                   | Yes                                                                                                                              | Maps to FR-002; structurally guaranteed if constraint/modifier evaluation stays a genuine two-pass design                      |
| US3.3                                                                     | Rule kind (constraint/modifier) is an explicit, non-default choice                    | Yes                                                                                                                              | Maps to FR-002; a builder-level required-field constraint, straightforward to enforce and verify                               |
| Edge: nesting depth / operator set violations rejected at save, not later | Yes                                                                                   | Maps to FR-003; depends on schema-level (not just UI-level) enforcement, per Technical Risks                                     |
| Edge: exactly one active rule set at a time                               | Yes                                                                                   | Maps to FR-006; depends on a DB-level uniqueness guarantee (e.g., a constraint on published status), not just application logic  |
| Edge: zero rules match test criteria                                      | Yes                                                                                   | Maps to spec Edge Cases; baseline ranking shown, not an error — explicit, testable behavior                                      |
| Edge: publish blocked on missing catalog target                           | Yes                                                                                   | Maps to FR-011; depends on validation scope covering condition bodies as well as declared `target` (see Requirement Ambiguities) |
| Edge: publish blocked on undefined reason-template placeholder            | Yes                                                                                   | Maps to FR-011; depends on validation covering all branches of a condition, not only top-level fields (see Edge Cases)           |
| SC-005 traceability of every live recommendation                          | Yes                                                                                   | Maps to FR-012; risk is a future consumer call site bypassing the recording step (see Technical Risks)                           |

**Coverage summary**: 14 of 15 identified acceptance scenarios/criteria are
fully addressable as stated; 1 is partial pending clarification of diff detail
for version comparison (US2.3). Two of the "Yes" rows also carry open scope
questions on publish-time reference validation depth (see Requirement
Ambiguities), which should be resolved before implementation even though they
don't block strategic addressability.

Open questions / risks to carry into REASONS Canvas: whether
`@windwise/core`/`@windwise/db` are confirmed to exist before this feature's
implementation begins; permission model for draft-edit vs. publish; diff
granularity for version comparison; whether publish-time validation must inspect
condition bodies (not just declared `target`) for stale catalog references;
concurrent draft-editing behavior.
