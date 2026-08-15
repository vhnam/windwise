# Feature Specification: Guided Instrument Consultation

**Feature Branch**: `005-guided-instrument-consultation`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Consumer guided consultation flow — a visitor
answers a short set of questions in natural language and receives 2-3
explainable instrument recommendations, with a non-AI form fallback, shareable
results, and trust signals on catalog data."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - First-time visitor gets a recommendation (Priority: P1)

A parent who knows nothing about band instruments opens the site, answers a few
simple questions about their child's level, purpose for playing, and budget, and
receives 2-3 concrete instrument suggestions with plain-language reasons.

**Why this priority**: This is the core value proposition of the product —
without it, there is no consultation experience at all.

**Independent Test**: Can be fully tested by completing the question flow with a
beginner/school-band/under-20M-VND profile and confirming the system returns
ranked, explained recommendations.

**Acceptance Scenarios**:

1. **Given** a new visitor with no prior session, **When** they answer level,
   purpose, and budget (the three required criteria), **Then** the system
   returns 2-3 ranked instrument recommendations.
2. **Given** a visitor who has answered the required criteria, **When** they
   also answer optional questions (age, section preference, physical notes),
   **Then** the recommendations reflect those additional constraints (e.g., a
   stated brace-wearer is steered away from cup-mouthpiece brass toward
   woodwind).
3. **Given** a visitor who has not yet answered all required criteria, **When**
   they ask for a recommendation, **Then** the system asks for the missing
   required answer(s) instead of guessing or fabricating a result.

---

### User Story 2 - Understanding why a recommendation was made (Priority: P1)

A visitor sees a recommended instrument and wants to know why it was chosen
before trusting it enough to consider buying.

**Why this priority**: Explainability is what separates a trustworthy
consultation from an opaque model-code generator; without it, users have no
reason to act on the result.

**Independent Test**: Can be fully tested by inspecting any single
recommendation result and confirming each item shows a plain-language reason
tied to the visitor's own answers.

**Acceptance Scenarios**:

1. **Given** a completed recommendation, **When** the visitor views a
   recommended instrument, **Then** they see a short explanation naming the
   specific criteria that drove the match (e.g., level and budget).
2. **Given** a recommended instrument, **When** the visitor views its detail
   page, **Then** they see when the listing data was last verified and a link to
   the manufacturer's source page, with prices clearly labeled as either
   manufacturer MSRP or Vietnamese market price.

---

### User Story 3 - Seeing other options (Priority: P2)

A visitor is unsure about the first set of recommendations and wants to see
alternatives without starting over.

**Why this priority**: Reduces drop-off when the first answer doesn't feel
right, without the cost/latency of a fresh AI call.

**Independent Test**: Can be fully tested by requesting "other options" after an
initial recommendation and confirming the next-ranked results are shown without
re-asking the original questions.

**Acceptance Scenarios**:

1. **Given** a completed recommendation, **When** the visitor requests other
   options, **Then** the system shows the next-ranked candidates from the same
   underlying result set, not a freshly regenerated answer.

---

### User Story 4 - Completing a consultation when AI assistance is unavailable (Priority: P2)

A visitor arrives while the conversational assistant is down, slow, or rate
limited, and still needs to get a recommendation.

**Why this priority**: Protects the core value proposition from a single point
of failure and gives the product a dependable non-AI baseline.

**Independent Test**: Can be fully tested by completing the plain multi-step
form version of the consultation and confirming it produces the same kind of
ranked, explained result as the conversational flow for identical answers.

**Acceptance Scenarios**:

1. **Given** the conversational assistant is unavailable, **When** a visitor
   uses the step-by-step form instead, **Then** they can still supply the same
   required and optional criteria and receive recommendations.
2. **Given** the same set of answers, **When** submitted via the form versus the
   conversational flow, **Then** the resulting recommendations and reasons are
   identical.

---

### User Story 5 - Returning to a shared result (Priority: P3)

A visitor shares their consultation result link with a family member or teacher,
who opens it later and sees the same recommendations.

**Why this priority**: Extends the consultation's value beyond a single session
and supports word-of-mouth reach, but the product is usable without it on day
one.

**Independent Test**: Can be fully tested by opening a previously generated
result URL in a new session and confirming it renders the same recommendations
that were originally produced.

**Acceptance Scenarios**:

1. **Given** a completed consultation, **When** the visitor copies its result
   URL and someone else opens it later, **Then** the same recommendations and
   reasons are displayed, unaffected by later catalog changes.

### Edge Cases

- What happens when a visitor's answers rule out every catalog item (e.g., an
  age too young for any available instrument in their stated budget)? The system
  must say so plainly and suggest relaxing a specific constraint, rather than
  showing an empty or misleading result.
- How does the system handle a visitor who abandons the flow partway through and
  returns later? Previously given answers should still be present.
- What happens when the conversational assistant misreads free text into an
  unsupported value? The visitor must be able to correct the interpreted answer,
  not just the raw text.
- What happens when a recommended instrument's listing data is stale (past its
  verification window)? It may still be shown, but the staleness must not be
  hidden from the visitor.
- How does the system behave for a visitor who supplies only the required
  criteria and skips all optional questions? A full recommendation must still be
  produced.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST collect three required criteria — playing level,
  purpose/ensemble context, and budget band — before producing any
  recommendation.
- **FR-002**: System MUST support natural-language (Vietnamese first) input for
  answering consultation questions, normalizing free text into structured
  criteria values.
- **FR-003**: System MUST also support optional criteria — age band, section
  preference, and physical notes (e.g., braces, small hands, asthma) — and
  factor them into recommendations when provided.
- **FR-004**: System MUST return 2-3 ranked instrument recommendations once
  required criteria are satisfied.
- **FR-005**: System MUST show, for each recommendation, a plain-language
  explanation naming the specific criteria that drove the match.
- **FR-006**: System MUST provide a "show other options" action that returns the
  next-ranked candidates from the same result rather than issuing a new
  natural-language generation.
- **FR-007**: System MUST offer every catalog page and consultation step as
  reachable via a plain multi-step form, producing identical recommendations to
  the conversational flow for identical answers, usable when the conversational
  assistant is unavailable.
- **FR-008**: System MUST refuse to fabricate or guess a recommendation when
  required criteria are missing, and instead prompt for the missing information.
- **FR-009**: System MUST display, on every recommended instrument, a
  last-verified date and a link to the manufacturer's source page.
- **FR-010**: System MUST label displayed prices by scope (manufacturer MSRP vs.
  Vietnamese market price) and MUST NOT present a single unqualified price
  figure.
- **FR-011**: System MUST produce a permanent, shareable URL for each completed
  consultation result that renders the same recommendations later, independent
  of subsequent catalog changes.
- **FR-012**: System MUST NOT collect personally identifying information during
  an anonymous consultation; only a session identifier is retained.
- **FR-013**: System MUST clearly communicate to the visitor when no instrument
  satisfies their combined criteria, and identify which constraint is the
  limiting factor.

### Key Entities

- **Consultation Session**: A single visitor's attempt at getting
  recommendations — tracks which questions were asked, in what order, and
  whether via chat or form.
- **Criteria**: The structured set of answers (level, purpose, budget, and
  optional attributes) driving a recommendation.
- **Recommendation Result**: The ranked set of instrument suggestions produced
  for a given criteria set, including the reason for each and a stable reference
  usable for sharing.
- **Instrument Listing**: A catalog entry a visitor sees, including verification
  date, source link, and scoped pricing.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A visitor with a clear profile can go from landing on the site to
  seeing a first recommendation in under 60 seconds of active interaction.
- **SC-002**: At least 90% of consultations that answer all required criteria
  result in a non-empty recommendation.
- **SC-003**: 100% of displayed recommendations include a plain-language reason
  and a source/verification date — zero recommendations shown without this trust
  information.
- **SC-004**: The form fallback produces recommendation output identical to the
  conversational flow for the same answers, verified across all sampled criteria
  combinations.
- **SC-005**: A shared consultation result renders correctly for a new visitor
  at least 30 days after it was created.

## Assumptions

- Vietnamese is the primary interaction language for v1; English is structural
  but not required for launch.
- The underlying instrument catalog and scoring rules already exist and are
  populated at a level sufficient to produce meaningful results (see
  [008-catalog-management-workflow](../008-catalog-management-workflow/spec.md)
  and
  [009-recommendation-rules-authoring](../009-recommendation-rules-authoring/spec.md)).
- No user accounts are required on the consumer side for v1; consultations are
  anonymous and identified only by a session reference.
- Checkout, cart, and real-time multi-store price comparison are explicitly out
  of scope for this feature.
