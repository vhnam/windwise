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
