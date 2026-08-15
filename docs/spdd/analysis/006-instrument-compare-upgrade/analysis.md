---
work_item: 006-instrument-compare-upgrade
sequence: 006
slug: instrument-compare-upgrade
---

# SPDD Analysis: Instrument Compare Upgrade

## Original Business Requirement

# Feature Specification: Instrument Compare & Upgrade Flows

**Feature Branch**: `006-instrument-compare-upgrade`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Consumer intent branching for experienced users —
a compare flow for visitors deciding between named models, and an upgrade flow
for visitors naming their current instrument, both built on the existing catalog
and recommendation engine."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Choosing a starting path (Priority: P1)

A visitor arrives and is asked whether they need help from scratch, are
comparing specific models, or want to upgrade from an instrument they already
play, so the conversation starts from the right place instead of assuming they
are a total beginner.

**Why this priority**: Without correct branching, experienced visitors are
forced through irrelevant beginner questions, which is the core gap this feature
closes.

**Independent Test**: Can be fully tested by starting a new session and
confirming all three entry options are presented and each leads to its correct
flow.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they start a consultation, **Then** they
   are asked to choose among "discover," "compare," and "upgrade."
2. **Given** a visitor selects "discover," **When** they proceed, **Then** they
   enter the existing guided consultation flow unchanged.

---

### User Story 2 - Comparing named models (Priority: P1)

A visitor typing free text like "bach strad 37 vs yamaha ytr-8335" wants a
clear, confirmed, side-by-side comparison before deciding.

**Why this priority**: This directly serves a common real-world decision-stage
need that the original discover-only flow could not address.

**Independent Test**: Can be fully tested by entering two named models in free
text, confirming the resolved matches, and verifying a structured comparison is
produced.

**Acceptance Scenarios**:

1. **Given** a visitor names one or more specific instruments in free text,
   **When** the system resolves each mention, **Then** it presents the matched
   catalog candidate(s) and requires explicit visitor confirmation before
   comparing.
2. **Given** a mention resolves to more than one plausible catalog model,
   **When** the visitor is shown candidates, **Then** they must pick the correct
   one before the comparison proceeds — the system never silently picks for
   them.
3. **Given** two or more confirmed models, **When** the comparison is produced,
   **Then** it shows specs, tier, and price for each side by side, plus a short
   human-authored playing-character note where one exists.
4. **Given** a confirmed comparison, **When** the visitor answers a follow-up
   question about what matters to them (tone, weight/response, projection,
   budget), **Then** the comparison highlights the relevant rows instead of
   presenting every spec with equal weight.
5. **Given** a model mention that has not been confirmed in this session,
   **When** any attempt is made to compare it, **Then** the system refuses and
   requires confirmation first.

---

### User Story 3 - Upgrading from a current instrument (Priority: P2)

A visitor who already owns and plays an instrument wants a next-tier suggestion
in the same family, without repeating the family-selection questions they've
already effectively answered.

**Why this priority**: Serves a distinct and valuable segment (progressing
players) but is less foundational than the compare flow.

**Independent Test**: Can be fully tested by naming a current instrument,
answering the upgrade reason/level/budget questions, and confirming the
recommendation stays within the same instrument family and at or above the
current tier.

**Acceptance Scenarios**:

1. **Given** a visitor names their current instrument, **When** it is resolved
   and confirmed, **Then** the system asks for the reason for upgrading, current
   level, and upgrade budget.
2. **Given** confirmed current instrument and answers, **When** a recommendation
   is produced, **Then** every candidate belongs to the same instrument family
   as the current instrument and is at or above its tier.
3. **Given** an upgrade request, **When** the recommendation is produced,
   **Then** the family-selection stage of the underlying engine is skipped
   entirely (the family decision is treated as already made).

### Edge Cases

- What happens when a visitor names a model that does not exist in the catalog
  at all? The system must say it cannot find a match and offer to fall back to
  the discover flow rather than guessing.
- What happens when a visitor names three or more models to compare at once? The
  comparison must remain readable (e.g., scoped to the aspects the visitor cares
  about) rather than dumping an unbounded spec table.
- How does the system handle an upgrade request naming a discontinued current
  instrument? It must still resolve the family/tier and proceed — discontinued
  status only affects whether that exact model is recommended back, not whether
  upgrade logic runs.
- What happens if no model in the same family qualifies as an upgrade (e.g., the
  visitor already owns the top tier)? The system must say so rather than
  recommending a lateral or lower-tier instrument.
- What happens when a visitor abandons confirmation (names a model but never
  confirms it)? No comparison or upgrade recommendation may proceed on that
  reference.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST present three entry points at the start of a
  consultation: discover (existing guided flow), compare, and upgrade.
- **FR-002**: System MUST resolve free-text instrument mentions to ranked
  candidate catalog matches and MUST NOT silently auto-select a single match.
- **FR-003**: System MUST require explicit visitor confirmation of a resolved
  candidate before it is used in any comparison or upgrade recommendation.
- **FR-004**: System MUST produce a structured side-by-side comparison of
  confirmed models covering specs, tier, and price.
- **FR-005**: System MUST include human-authored, reviewed playing-character
  notes in a comparison where such content exists for the pair, and MUST NOT
  generate a playing-character claim that has no corresponding reviewed content.
- **FR-006**: System MUST ask a follow-up question about what the visitor cares
  about (e.g., tone, weight/response, projection, budget) and use it to
  prioritize which comparison rows are surfaced.
- **FR-007**: System MUST resolve a visitor's stated current instrument to a
  catalog family and tier as the starting point for the upgrade flow.
- **FR-008**: System MUST collect upgrade reason, current level, and upgrade
  budget before producing an upgrade recommendation.
- **FR-009**: System MUST constrain upgrade recommendations to the same
  instrument family as the confirmed current instrument, at or above its tier,
  and MUST skip family-selection scoring entirely for this flow.
- **FR-010**: System MUST refuse to compare or recommend against any model
  reference that has not been explicitly confirmed by the visitor in the current
  session.
- **FR-011**: System MUST clearly inform the visitor when no valid upgrade
  candidate exists within the constraints, rather than returning a lateral or
  downgrade suggestion.

### Key Entities

- **Model Mention**: A visitor's free-text reference to an instrument, along
  with the ranked catalog candidates it could resolve to.
- **Confirmed Reference**: A model mention the visitor has explicitly approved
  as correct, usable in comparisons or upgrade recommendations.
- **Comparison Result**: A structured, side-by-side view of two or more
  confirmed models, including specs, pricing, tier, and any reviewed character
  notes, scoped by the visitor's stated priorities.
- **Upgrade Recommendation**: A ranked set of same-family, same-or-higher tier
  candidates produced relative to a confirmed current instrument.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A visitor naming two clearly identifiable models reaches a
  confirmed, rendered comparison in under three interaction steps (name →
  confirm → view).
- **SC-002**: Zero comparisons or upgrade recommendations are produced against
  an unconfirmed model reference across all sampled sessions.
- **SC-003**: At least 90% of upgrade recommendations return at least one
  same-family, same-or-higher-tier candidate when the catalog contains one.
- **SC-004**: 100% of playing-character claims shown in a comparison trace back
  to a reviewed, human-authored note — zero generated character claims without
  backing content.
- **SC-005**: The classic "Bach Strad 37 vs. Yamaha YTR-8335" scenario resolves
  both mentions, requires confirmation, and renders a correct side-by-side
  comparison end to end.

## Assumptions

- This feature depends on the discover flow, catalog, and pricing data already
  existing (see
  [005-guided-instrument-consultation](../005-guided-instrument-consultation/spec.md)
  and
  [008-catalog-management-workflow](../008-catalog-management-workflow/spec.md)).
- Human-authored comparison notes are curated separately by content owners and
  are not authored by this feature at generation time; this feature only
  consumes and displays them.
- The initial launch scope covers the models seeded for the core catalog (see
  platform seeding plan); broader alias coverage can grow over time.
- Compare and upgrade flows reuse the same anonymous, account-free session model
  as the discover flow.

### Supporting artifacts (read in full)

The folder `docs/specs/006-instrument-compare-upgrade/` also contained these
files, read completely and treated as approved planning context (not restated
here so the analysis stays usable; they remain the source of truth on disk):

- `plan.md` — extends 005's packages (`@windwise/schemas`, `@windwise/core`,
  `@windwise/db`, `@windwise/ai`) rather than adding new ones; new routes in
  `apps/consumer-application`; server-side confirmation gate is one shared check
  used by both `compareModels` and `suggestUpgrade`
- `research.md` — deterministic fuzzy mention resolution (no LLM entity
  resolution), session-scoped confirmation table read by one shared query,
  upgrade flow reuses 005's "family already decided" Stage A skip branch rather
  than a second scoring path, comparison notes are a plain lookup that omits an
  aspect rather than ever synthesizing a claim
- `data-model.md` — new `ModelAlias`, `ModelComparisonNote`,
  `ConfirmedReference` entities; extends `ConsultationSession` with `intent` and
  `reference_model_ids`; defines in-memory `MentionCandidate`,
  `ComparisonResult`, `UpgradeCriteria` shapes
- `quickstart.md`, `contracts/` — validation scenarios and tool-schema contracts
  for the four new entry points

Codebase note: as of this analysis, `packages/core`, `packages/schemas`,
`packages/db`, and `packages/ai` referenced by 006's plan do not yet exist in
the repository — only `apps/consumer-application`, `apps/manager-dashboard`, and
`packages/query`, `packages/ui`, `packages/vite-config` are present, and 005
(the dependency this feature explicitly builds on) itself has no implementation
and no prior SPDD analysis on disk yet. This analysis therefore evaluates 006
against its own spec/plan artifacts and against 004's established
package/library boundary conventions, not against existing 005 runtime code.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Shared package boundary convention**: The workspace already establishes the
  pattern of one shared library per concern, consumed by both apps without
  forking (proven by `packages/ui`, `packages/query`). 006's plan to extend
  005's `@windwise/core`/`schemas`/`db`/`ai` rather than create a parallel
  comparison-logic package follows this established convention.
- **`apps/consumer-application`**: The visitor-facing app that already exists as
  a workspace member and is the intended host for the new intent-choice,
  compare, and upgrade routes; it currently has no domain-specific
  (instrument/consultation) routes of its own.
- **`packages/ui` core primitives**: 004's shared, domain-free component library
  (button, field, card, tabs, dialog, notice, loading placeholder) that 006's
  intent-choice UI and comparison table are expected to compose from rather than
  invent new one-off controls, consistent with 004's FR-006 (apps must not fork
  core pieces).

#### New Concepts Required

- **Guided Consultation Engine (from 005)**: The recommendation engine
  (`recommend()`, family/tier scoring stages, `ConsultationSession`,
  `InstrumentModel`, `PricePoint`) that 006 depends on entirely but does not
  itself define. 006 is only meaningful once this engine and its catalog exist;
  today it is planned, not built.
- **Consultation Intent**: The discover/compare/upgrade choice a visitor makes
  at the very start of a session, stored once and never changed. Governs which
  question sequence and engine entry point a session uses.
- **Model Mention**: A visitor's free-text reference to an instrument, paired
  with a ranked, deterministic set of catalog candidates it could resolve to.
  Distinct from a plain search result because it is always ranked and never
  auto-resolved.
- **Confirmed Reference**: The explicit, session-scoped visitor approval of one
  specific model mention. This is the gatekeeping concept the whole feature is
  built around — nothing downstream (comparison, upgrade recommendation) may
  reference a model that has not passed through it.
- **Comparison Result**: A structured side-by-side rendering of two or more
  confirmed models' specs, tier, and price, optionally annotated with
  human-authored character notes and scoped by a stated visitor priority.
- **Comparison Priority**: The visitor's stated "what matters to you" answer
  (tone, weight/response, projection, budget) used purely to prioritize which
  comparison rows are surfaced, not to filter or hide models.
- **Playing-Character Note**: A human-authored, reviewed piece of content tied
  to a specific pair of models and an aspect (tone, weight/response, projection,
  general). Exists independently of any single comparison request and is only
  ever displayed, never generated.
- **Upgrade Recommendation**: A ranked set of candidates constrained to the same
  instrument family and at-or-above tier as a confirmed current instrument,
  produced by the same engine as discover but with the family-selection stage
  skipped.
- **Family/Tier Floor**: The constraint object derived from a confirmed current
  instrument (its family and tier) that bounds every candidate the upgrade flow
  may return.

#### Key Business Rules

- **Never auto-select a match** (governs Model Mention, Confirmed Reference):
  Resolution always returns a ranked candidate set; only an explicit visitor
  action turns a candidate into a Confirmed Reference.
- **No comparison or upgrade without confirmation** (governs Confirmed
  Reference, Comparison Result, Upgrade Recommendation): Any model reference
  that has not been explicitly confirmed in the current session is refused, with
  the refusal enforced independent of what a natural-language interaction
  "intends."
- **Character notes are display-only, never generated** (governs
  Playing-Character Note, Comparison Result): A comparison may show fewer notes
  than models being compared, but it may never fabricate one; missing content is
  an omission, not a placeholder.
- **Priority shapes emphasis, not membership** (governs Comparison Priority,
  Comparison Result): The visitor's stated priority changes which rows are
  highlighted; it must not cause a spec, tier, or price row to disappear
  entirely.
- **Family and tier are fixed once upgrade starts** (governs Family/Tier Floor,
  Upgrade Recommendation): Once a current instrument is confirmed, every
  candidate must stay in its family and at or above its tier — no candidate
  outside that boundary may appear, and if none qualify, the system must say so
  rather than relax the floor.
- **Intent is chosen once, up front** (governs Consultation Intent): The
  discover/compare/upgrade choice is made before any question flow begins and
  does not change mid-session; "discover" must remain byte-for-byte the existing
  005 flow.

## Strategic Approach

#### Solution Direction

Treat this as three new, guarded entry points into the single guided
consultation engine 005 establishes — not a second recommendation system. An
upfront intent choice branches a session into "discover" (unchanged), "compare"
(mention → confirm → structured comparison, optionally priority-scoped), or
"upgrade" (mention → confirm → reason/level/budget → family/tier-constrained
recommendation). Both new flows share one mention resolution mechanism and one
confirmation gate, so "has this model been approved by the visitor in this
session" is answered in exactly one place regardless of which flow is asking.
The upgrade flow reuses the engine's existing family-scoring machinery by
skipping straight to tier-constrained candidate selection rather than
re-deriving family logic. Comparison character content is sourced from a
separately curated, human-reviewed note store and is purely additive — its
absence never blocks or degrades the rest of the comparison.

#### Key Design Decisions

- **Deterministic mention resolution vs. LLM-driven entity resolution**: An LLM
  guessing which catalog model a free-text mention refers to would make wrong
  matches unpredictable and hard to regression-test, and would blur the line
  between "the system resolved this" and "the visitor confirmed this" →
  resolution is a deterministic, rankable matching process; confirmation remains
  a separate, explicit visitor action.
- **Server-side confirmation gate vs. trusting conversational state**: A
  natural-language interaction can "believe" a model was already confirmed
  without it actually having been, especially across an interrupted or resumed
  session; the cost of a false positive here (an unconfirmed model driving a
  purchase-adjacent decision) is high → confirmation state must be checked
  independently of anything the interaction claims to remember, at the point
  comparison or upgrade logic runs.
- **Reuse the engine's family/tier scoring vs. a separate upgrade scorer**: A
  second scoring implementation risks drifting from the discover flow's
  tier/budget/discontinued-status rules over time → the upgrade flow skips only
  the family-selection stage and otherwise runs the same scoring path discover
  uses, so the two stay in sync by construction rather than by discipline.
- **Display-only character notes vs. generating a summary when none exists**: A
  generated playing-character claim cannot be attributed to a reviewed source
  and risks stating something untrue about how an instrument plays → notes are
  shown only when a matching reviewed note exists; a missing note is an
  omission, never a generated fallback.
- **Priority as emphasis vs. priority as a filter**: Filtering rows by stated
  priority risks hiding information (like price) a visitor still needs to make a
  decision, even if it isn't their stated top concern → priority
  reorders/highlights rows; every model retains its full spec, tier, and price
  display.
- **Upfront, sticky intent choice vs. inferring intent mid-conversation**:
  Detecting a model name mentioned mid-discover-flow and silently switching
  modes would itself be an unconfirmed inference, the exact pattern this feature
  is designed to avoid elsewhere → intent is chosen once, before any questions
  begin, and does not shift automatically.

#### Alternatives Considered

- **A single flow that lets the model infer discover vs. compare vs. upgrade
  from free text** — rejected: reintroduces silent guessing at the very point
  the feature exists to eliminate, and makes "why did I get asked these
  particular questions" hard for a visitor to predict.
- **Letting the visitor free-type "yes that's the one" as confirmation inside
  the chat** — considered as the confirmation interaction's surface form, but
  rejected as the _only_ signal source; the underlying gate must be a checkable
  state the comparison/upgrade logic reads, not a heuristic parse of
  conversational agreement.
- **A general-purpose "any two models" comparison with no confirmation step** —
  rejected: comparisons feed a purchase-adjacent decision, and an unconfirmed
  mismatch (e.g., resolving "37" to the wrong bore size) would silently mislead
  a visitor rather than fail loudly.
- **Scoping upgrade recommendations to "same family only" without a tier floor**
  — rejected: a same-family but lower-tier suggestion is not an upgrade and
  would contradict the visitor's stated intent; the floor must be both family
  and tier.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **"Playing-character note... where one exists" scope**: The spec does not say
  whether a comparison with confirmed models but zero matching notes for any
  aspect should still render (with notes simply absent) or should surface some
  indication that no character content exists yet. Needs clarification on
  whether "no note" is silent or explicitly flagged to the visitor.
- **Resolution confidence threshold for "no match at all"**: The edge case says
  the system must say it "cannot find a match," but the spec does not define how
  low a candidate's confidence must be before it is excluded from the ranked
  list entirely versus shown as a weak candidate the visitor can still reject.
- **Upgrade budget vs. discover budget semantics**: FR-008 asks for an "upgrade
  budget" separately from the discover flow's budget question; the spec doesn't
  clarify whether this is an absolute budget for the new instrument or a
  delta/trade-in-adjusted budget relative to the current instrument's value —
  these produce materially different candidate sets.
- **Scope of "reason for upgrading"**: FR-008 requires collecting the upgrade
  reason but no functional requirement states whether/how the stated reason
  (e.g., "outgrew student model" vs. "want better projection") should influence
  which same-family/same-tier candidates are ranked higher, versus being
  informational-only context shown alongside the recommendation.

#### Edge Cases

- **Three-or-more-model comparisons**: Explicitly called out in the spec as
  needing to stay readable via priority-scoping rather than an unbounded table;
  this interacts with the "priority shapes emphasis, not membership" rule and
  needs a concrete readability strategy once priority alone isn't a hard cap on
  models shown.
- **Discontinued current instrument in the upgrade flow**: Family/tier
  resolution must still proceed for a discontinued model, but the discontinued
  instrument itself must be excluded from being recommended back — this requires
  the family/tier floor logic to tolerate a "resolved but not recommendable"
  current instrument.
- **No qualifying upgrade candidate (visitor already owns top tier)**: Must
  produce a clear "no candidate" message rather than a lateral/downgrade
  suggestion or an empty-looking result; this is a distinct outcome from
  "resolution failed" and needs its own recognizable state.
- **Abandoned confirmation**: A visitor who names a model but never confirms it
  must leave zero residue that could later be mistaken for confirmation — this
  matters most across a resumed or reloaded session where a stale mention could
  otherwise be conflated with an approved one.
- **Ambiguous mention resolving to the visitor's own already-confirmed model**:
  Not explicitly addressed — e.g., in the upgrade flow, a mention that resolves
  back to the same model as the current instrument (visitor re-describing what
  they already own) is not called out as a case to detect or message differently
  from a genuine new mention.

#### Technical Risks

- **Dependency on unbuilt foundations**: This feature's plan extends
  `@windwise/schemas`, `@windwise/core`, `@windwise/db`, and `@windwise/ai`
  packages that do not exist yet in the repository, and depends on 005's engine,
  catalog, and session model, which also have no implementation on disk. Any
  schedule or scope slip in 005 directly blocks 006; the two cannot be sequenced
  independently despite having separate spec numbers.
- **Confirmation-gate consistency across two callers**: `compareModels` and
  `suggestUpgrade` both need to enforce the same server-side confirmation check;
  if the check is duplicated instead of shared, the two flows could drift over
  time (one flow trusting a stale or client-supplied confirmed state) — the risk
  is organizational (two people implementing two copies) as much as technical.
- **Fuzzy-match quality against a small seed catalog**: Deterministic similarity
  matching is easiest to get right with a large, diverse alias set; the spec's
  own launch scope (a handful of seeded models) makes it hard to validate
  ranking quality and thresholding decisions broadly before more catalog content
  and real visitor phrasing exist.
- **Content-curation dependency for comparison notes**: FR-005's guarantee (zero
  generated character claims) depends entirely on an editorial process outside
  this feature producing reviewed notes; if that process lags catalog growth,
  most comparisons could ship with no character content at all, which is a
  plausible content-completeness risk even though the technical guarantee (never
  fabricate) still holds.

#### Acceptance Criteria Coverage

| AC#                                                   | Description                                                                  | Addressable?                                                                                                                                                                     | Gaps/Notes                                                                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1-1                                                 | New visitor is asked to choose among discover, compare, upgrade              | Yes                                                                                                                                                                              | Straightforward given FR-001; depends on 005's session bootstrap existing first.                                                                          |
| US1-2                                                 | Selecting "discover" enters the existing guided flow unchanged               | Yes                                                                                                                                                                              | Requires the intent branch to be strictly additive and never alter 005's flow; regression risk if the two are developed by different people concurrently. |
| US2-1                                                 | Named mention(s) resolve to shown candidates requiring explicit confirmation | Yes                                                                                                                                                                              | Core mechanism defined by FR-002/FR-003; resolution confidence threshold ambiguity above affects edge behavior, not the happy path.                       |
| US2-2                                                 | Multiple plausible candidates require visitor pick, never a silent choice    | Yes                                                                                                                                                                              | Directly covered by FR-002's "MUST NOT silently auto-select."                                                                                             |
| US2-3                                                 | Comparison shows specs, tier, price, plus character note where one exists    | Yes                                                                                                                                                                              | Covered by FR-004/FR-005; "where one exists" ambiguity (silent vs. flagged absence) noted above.                                                          |
| US2-4                                                 | Follow-up priority question highlights relevant comparison rows              | Yes                                                                                                                                                                              | Covered by FR-006; depends on "priority as emphasis not filter" rule holding in implementation.                                                           |
| US2-5                                                 | Unconfirmed mention refuses any compare attempt                              | Yes                                                                                                                                                                              | Covered by FR-010; this is the single most safety-critical AC in the feature (also SC-002).                                                               |
| US3-1                                                 | Current instrument resolved/confirmed, then reason/level/budget collected    | Yes                                                                                                                                                                              | Covered by FR-007/FR-008; "upgrade budget" semantics ambiguity noted above could affect what "collected" means precisely.                                 |
| US3-2                                                 | Recommendation constrained to same family, at-or-above tier                  | Yes                                                                                                                                                                              | Covered by FR-009; depends on Family/Tier Floor being enforced as a hard constraint, not a scoring bias.                                                  |
| US3-3                                                 | Family-selection stage skipped entirely for upgrade                          | Yes                                                                                                                                                                              | Covered by FR-009 and confirmed by research.md's Stage A skip decision; this is a design decision already validated at the planning layer.                |
| Edge: unmatched model name                            | Yes                                                                          | Must offer fallback to discover flow rather than guessing; covered by FR-002's ranked-candidates behavior plus an explicit "no match" message not yet detailed in a numbered FR. |
| Edge: 3+ models compared at once                      | Partial                                                                      | Spec requires readability via priority-scoping but does not define a hard cap or fallback strategy if no priority has been stated yet for a 3+-way comparison.                   |
| Edge: discontinued current instrument in upgrade flow | Yes                                                                          | Covered narratively in Edge Cases; no explicit FR states the "resolve but exclude from recommend-back" behavior, though it is consistent with FR-009.                            |
| Edge: no qualifying upgrade candidate                 | Yes                                                                          | Covered by FR-011.                                                                                                                                                               |
| Edge: abandoned confirmation                          | Yes                                                                          | Covered by FR-010 and FR-003 by extension (nothing proceeds without confirmation), consistent with the Confirmed Reference gate.                                                 |
