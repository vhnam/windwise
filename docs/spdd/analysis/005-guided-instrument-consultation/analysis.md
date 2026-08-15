---
work_item: 005-guided-instrument-consultation
sequence: 005
slug: guided-instrument-consultation
---

# SPDD Analysis: Guided Instrument Consultation

## Original Business Requirement

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

### Supporting artifacts (read in full)

The folder `@docs/specs/005-guided-instrument-consultation/` also contained
these files, read completely and treated as approved planning context (not
restated here so the analysis stays usable; they remain the source of truth on
disk):

- `plan.md` — architecture: chat and form both call one pure `@windwise/core`
  recommendation engine; identifies this feature as also carrying the platform's
  M0/M1 foundation slice (new packages `@windwise/schemas`, `@windwise/core`,
  `@windwise/db`, `@windwise/ai` do not yet exist in the monorepo)
- `research.md` — Valibot-as-single-schema-source decision, v0 hardcoded
  constraint/modifier rule engine, chat/form parity test strategy,
  version-pinning at session/run creation, anti-hallucination output validator
  design
- `data-model.md` — Criteria, InstrumentFamily, InstrumentModel, PricePoint,
  RuleSet/Rule, QuestionSet/Question, ConsultationSession, ConsultationAnswer,
  RecommendationRun (scoped subset of the platform-wide domain map; later
  features 006-011 extend the same tables)
- `quickstart.md`, `contracts/` — present but not restated here

No existing SPDD analysis or prompt under this `work_item` was present.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Consumer application shell (`apps/consumer-application`)**: The TanStack
  Start web app (React 19, TanStack Router/Query) that will host the
  consultation experience. Currently has only a placeholder home route and a
  PowerSync integration wired for a different (offline-sync) purpose — no domain
  routes, catalog UI, or consultation UI exist yet.
- **Shared UI library (`@windwise/ui`)**: Domain-free primitive components
  (button, field, card, tabs, dialog, notice, loading placeholder) that the
  consultation chat wizard and form-fallback wizard are both expected to compose
  from, per the platform's "one library, two products" rule established in work
  item 004. No consultation- or instrument-specific component exists in it, nor
  should one — that boundary is already enforced by prior work.
- **Shared query layer (`@windwise/query`)**: An existing workspace package for
  data-fetching concerns the consumer app already depends on conceptually as its
  TanStack Query integration point; its current contents were not deeply
  inspected but it is the natural place criteria and recommendation-result
  fetching would attach to on the client side.
- **PowerSync client-sync integration**: Already wired into the consumer app
  (`app-schema.ts`, `backend-connector.ts`, `provider.tsx`) for a client-side
  offline-sync model. The plan explicitly does NOT route catalog or consultation
  data through it — this feature reads/writes via server functions against a new
  Postgres-backed package instead, which is an addition to, not a replacement
  of, the existing PowerSync usage.
- **Monorepo package boundary convention**: The workspace already separates
  concerns into `packages/*` (ui, query, vite-config) consumed by `apps/*`, with
  each package independently versioned via changesets. This feature's new
  packages (`schemas`, `core`, `db`, `ai`) are expected to follow the same
  boundary and versioning convention, not a bespoke structure.

#### New Concepts Required

- **Consultation Session**: The record of one visitor's attempt at getting a
  recommendation, tracking which criteria were collected and via which channel
  (chat or form). New — no session/conversation persistence concept exists
  anywhere in the codebase today.
- **Criteria**: The structured, validated set of answers (level, purpose, budget
  required; age, section preference, physical notes optional) that both the chat
  tool and the form submit into a single recommendation call. New — relates to
  Consultation Session as its captured input and to Recommendation Result as its
  driving parameter.
- **Instrument Catalog (Family / Model / PricePoint)**: The read-side domain
  data a recommendation is computed against — instrument families, individual
  models with verification/publish state, and scope-labeled prices. New to this
  feature's code, though its authoring/write path belongs to a separate work
  item (008); this feature only needs a minimally seeded, read-only slice.
- **Recommendation Rule Set**: The constraint/modifier logic that turns Criteria
  plus Catalog into a ranked, explained result. New — a small fixed v0 rule set
  owned by this feature, structured so a later, DB-backed authoring workflow
  (009) can replace the rule _source_ without rewriting the _interpreter_.
- **Recommendation Result / Recommendation Run**: The ranked output (2-3
  instruments with reasons) produced for a given Criteria set, plus the
  persisted, shareable, version-pinned record of that computation. New — this is
  what the shareable URL (FR-011) resolves to, and what "show other options"
  (FR-006) re-slices without recomputation.
- **Question Set**: The versioned, pinned definition of which questions (mapping
  1:1 to Criteria fields) a session was asked, so a session's question wording
  never silently changes underneath it even if a newer set is later published.
  New — a minimal single seeded version for this feature; the authoring UI is
  out of scope (010).
- **Chat/Form Parity Contract**: The architectural guarantee that the
  conversational tool and the plain multi-step form are two entry points into
  one shared engine call, not two implementations. New as an explicit, testable
  business rule rather than an implementation detail — it is what makes
  FR-007/SC-004 meaningful.
- **Trust Signal (verification date, source link, price scope label)**: The set
  of provenance facts that must accompany every displayed recommendation. New as
  a first-class, enforced concept (not just a UI affordance) because SC-003
  demands 100% coverage, not best-effort display.

#### Key Business Rules

- **No recommendation without required criteria** (governs Criteria,
  Recommendation Result): the system must prompt for missing level, purpose, or
  budget rather than guess — this is the anti-fabrication guarantee that also
  underlies the AI output-validator design in research.md.
- **Chat and form must be provably identical** (governs Chat/Form Parity
  Contract, Recommendation Result): identical Criteria must yield identical
  Recommendation Result regardless of entry channel — this is a hard equality
  requirement (SC-004), not a "similar experience" aspiration.
- **Every recommendation carries its trust signals** (governs Instrument
  Catalog, Trust Signal, Recommendation Result): a recommendation without a
  reason, verification date, and correctly scoped price is treated as an invalid
  result, not a partial one (SC-003's "zero recommendations shown without
  this").
- **Shareable results are pinned, not live** (governs Recommendation Run,
  Question Set, Recommendation Rule Set): once a run is created, the question
  set, rule set, and engine version it used are fixed; later catalog or rule
  changes must not alter what a previously shared URL renders (FR-011, SC-005).
- **No PII in anonymous consultation** (governs Consultation Session): only a
  session identifier is retained; the system must not collect or persist
  identifying visitor information.
- **"Other options" reuses the existing result set** (governs Recommendation
  Run): requesting alternatives slices further down the already-computed ranked
  list; it must not trigger a new natural-language generation or a new engine
  computation with different inputs.

## Strategic Approach

#### Solution Direction

Treat this as a genuinely new, two-surface feature built on top of a small set
of new shared packages, not an extension of an existing domain module — none
exists yet. The core commitment carried over from the approved plan is
architectural: exactly one recommendation computation (a pure engine function
taking Criteria, Catalog, and a Rule Set) is called from two thin entry points —
a conversational tool and a plain multi-step form — so "identical answers
produce identical results" is true by construction rather than by convention.
Data flows in one direction per entry point: visitor input (chat message or form
step) → normalization into Criteria → one shared engine call against read-only
catalog/rule data → a persisted, version-pinned Recommendation Run → rendered
result with trust signals, addressable by a permanent URL. The chat surface
additionally passes through an output validator that constrains the assistant to
rephrasing tool results, never inventing catalog facts. Both surfaces compose
the existing `@windwise/ui` primitives rather than introducing consultation-
specific components into the shared library, continuing the boundary rule
already established for the workspace.

#### Key Design Decisions

- **One shared engine vs. parallel chat/form logic**: duplicating scoring logic
  per surface is faster to prototype but structurally cannot guarantee SC-004's
  exact-equality requirement and would drift over time → **one pure engine, two
  thin callers**, matching the already-approved plan.
- **New persistence package now vs. deferring storage until catalog authoring
  (008) exists**: without persistence, shareable/version-pinned results (FR-011,
  SC-005) and abandon/resume (edge case) are not achievable at all → **introduce
  a minimal, feature-scoped storage layer now**, seeded manually, and let
  008/009/010 extend the same tables later rather than replace them.
- **Hardcoded v0 rule set vs. waiting for a rule-authoring UI**: this feature's
  success criteria (SC-002, SC-003) require sensible, explainable output
  immediately; a full authoring workflow is a separate, larger work item →
  **ship a small fixed rule set structured like the future DB-backed model**, so
  the swap later is a data-source change, not an interpreter rewrite.
- **Server-side-only AI tool execution vs. client-callable recommendation
  logic**: exposing catalog/pricing logic to the client risks both hallucination
  surface and price/catalog data leakage before verification → **all
  recommendation and catalog reads happen through server functions**, with the
  LLM restricted to two tool calls plus rephrasing.
- **Version-pinning at creation vs. resolving "current" catalog/rules at read
  time**: read-time resolution is simpler to build but directly violates the
  shareable-result guarantee (FR-011) the moment catalog data changes → **pin
  question set, rule set, and engine version once, at session/run creation**.
- **"Other options" as re-slicing a stored result vs. a fresh recommendation
  call**: a fresh call is simpler but reintroduces cost/latency and risks a
  different answer for the same criteria, which FR-006 explicitly forbids →
  **re-slice the already-computed ranked result**.

#### Alternatives Considered

- **AI-only consultation with no form fallback**: rejected outright by the spec
  itself (FR-007, User Story 4) — a single point of failure on the AI provider
  is treated as unacceptable for the core value proposition.
- **Client-side recommendation computation (e.g., ship catalog + rules to the
  browser)**: rejected — conflicts with keeping provider/catalog logic
  server-side, complicates the anti-hallucination validator design, and would
  let a visitor's browser compute results independent of the pinned version
  model.
- **Resolving shared results by recomputing from current catalog/rules at view
  time**: rejected — directly breaks FR-011/SC-005 ("unaffected by later catalog
  changes"); explicitly called out as the bug this feature must avoid.
- **Reusing PowerSync's offline-sync path for consultation/catalog data**:
  rejected for this feature — the data is read-mostly, SSR'd, and not
  visitor-edited offline; the plan treats Postgres/Drizzle as additive rather
  than a PowerSync replacement.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **What "identical" means for FR-007/SC-004 in the presence of chat free-text
  normalization**: the spec requires identical recommendations for identical
  _answers_, but chat answers arrive as free text that must first be normalized
  into the same Criteria shape the form produces directly. The equality
  guarantee only holds if normalization itself is deterministic and shared — the
  spec does not say whether normalization is part of the "same engine" guarantee
  or a separate concern that could legitimately diverge.
- **Granularity of "relaxing a specific constraint" in the no-match edge case**:
  FR-013 and the first edge case require identifying the limiting constraint and
  suggesting a relaxation, but the spec does not define whether this must name
  the single most limiting field or may present multiple relaxable options when
  several constraints jointly cause the empty result.
- **Definition of "abandons the flow and returns later"**: the edge case says
  previously given answers should still be present, but does not specify a time
  bound, device/browser scope (same browser only, given no accounts), or what
  happens if the pinned question set has since changed between visits.
- **Correction UX for misread free text**: the spec requires that a visitor can
  correct an interpreted answer, not just raw text, but does not specify whether
  correction happens inline in the chat, via a fallback to the form for that one
  field, or some other mechanism.

#### Edge Cases

- **All-required, zero-optional submissions**: must still produce a full ranked
  recommendation (explicitly called out) — the rule engine must not treat absent
  optional criteria as disqualifying or as an implicit "no preference" that
  skews scoring unexpectedly.
- **Every catalog item excluded by combined criteria**: must produce a plain,
  actionable message naming the limiting constraint rather than an empty or
  generic error state — this is a designed empty state, not a fallback error
  path.
- **Stale verification window on a still-shown listing**: staleness must remain
  visible to the visitor even when the instrument is still recommended — this
  couples a data-freshness signal directly to the UI contract, not just to a
  backend quality check.
- **Shared URL opened long after catalog changes**: the rendered recommendation
  must match what was originally computed, which depends entirely on the
  version-pinning design holding under real schema/rule evolution (008/009/010
  will add fields and rule sources over time).
- **Rate-limited or slow AI provider mid-conversation** (not just fully down):
  User Story 4 covers full unavailability; a degraded-but-not-down provider is
  not explicitly addressed and could produce a partial or inconsistent chat
  state that the spec does not describe how to recover from.

#### Technical Risks

- **Foundational packages do not exist yet**: `@windwise/schemas`,
  `@windwise/core`, `@windwise/db`, and `@windwise/ai` all need to be created as
  part of this feature (per the plan), meaning this work item carries both a
  new-feature risk and a new-infrastructure risk simultaneously. Mitigation
  direction: keep the engine and schema packages pure and framework-free so they
  are cheap to validate in isolation before wiring the app surfaces.
- **New database dependency added to a workspace whose stated fixed stack is
  PowerSync-centric**: the plan already flags this as unresolved and requiring
  explicit confirmation before detailed design proceeds; treating it as settled
  without that confirmation is a process risk, not just a technical one.
- **Anti-hallucination guarantee depends on an output validator that has not
  been proven**: the chat surface's trustworthiness (User Story 2,
  FR-005/FR-009/FR-010) rests on a post-generation scan design that is still at
  the research/decision stage; if it under- or over-triggers, it either allows
  fabricated content through or degrades the chat experience with false
  rejections.
- **Exact-equality parity between chat and form is a strong, testable claim**:
  it requires disciplined boundary enforcement (no drift in how each surface
  calls the shared engine) that must be verified with integration-level tests,
  not just unit tests on the engine — a gap the research notes already flag.
- **Minimal v0 catalog/rule seed size**: only 4 families and a small hardcoded
  rule set back this feature initially; recommendation quality and edge-case
  coverage (e.g., the no-match scenario) may be hard to validate meaningfully
  until a larger catalog exists, which is a later work item's responsibility.

#### Acceptance Criteria Coverage

| AC#                             | Description                                                                         | Addressable? | Gaps/Notes                                                                                                                                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1.1                           | Required-only criteria produce 2-3 ranked recommendations                           | Yes          | Depends on the new engine, seeded catalog, and seeded rule set all existing before this is testable.                                                                                                                      |
| US1.2                           | Optional criteria (age, section, physical notes) further constrain results          | Yes          | Rule engine must implement the specific softening/exclusion behaviors (e.g., braces steering away from cup-mouthpiece brass) named in the example, not just accept the fields.                                            |
| US1.3                           | Missing required criteria triggers a prompt, not a guess                            | Yes          | Directly maps to the "no recommendation without required criteria" business rule; must hold identically for both chat and form entry.                                                                                     |
| US2.1                           | Recommendation shows a reason naming driving criteria                               | Yes          | Requires the rule engine to emit structured reason data, not just a score, so UI can render plain language.                                                                                                               |
| US2.2                           | Detail view shows verification date, source link, and scoped price labels           | Yes          | Depends on catalog data actually carrying `last_verified_at`, a source URL, and price `scope` — fields exist in the modeled schema but a seed must populate them realistically.                                           |
| US3.1                           | "Other options" shows next-ranked candidates without a fresh generation             | Yes          | Requires the Recommendation Run to persist the full ranked set (not just top 2-3) so slicing further down is possible without recomputation.                                                                              |
| US4.1                           | Form flow alone (no AI) supplies same criteria and yields recommendations           | Yes          | Requires the form-fallback wizard to be fully independent of AI provider availability at both the UI and server-function level.                                                                                           |
| US4.2                           | Same answers via form vs. chat yield identical recommendations and reasons          | Partial      | Addressable by the shared-engine architecture, but hinges on the ambiguity above (whether chat normalization is guaranteed deterministic/shared) — needs resolution before this can be called fully addressed.            |
| US5.1                           | Shared result URL renders same recommendations later, unaffected by catalog changes | Yes          | Directly addressed by the version-pinning design (Recommendation Run pinning question set, rule set, engine version), contingent on that design holding as later features extend the same tables.                         |
| Edge: all-criteria-excluded     | Plain message naming the limiting constraint, not an empty/misleading result        | Partial      | Engine must be designed to report _why_ it excluded everything, not just that it returned zero results — this is a specific output requirement beyond basic filtering logic, and the granularity ambiguity above applies. |
| Edge: abandon-and-return        | Previously given answers still present                                              | Partial      | Requires session/answer persistence keyed to something resumable without accounts; exact resumption mechanism (cookie lifetime, device scope) is unspecified.                                                             |
| Edge: chat misreads free text   | Visitor can correct the interpreted (normalized) answer, not just raw text          | Partial      | Requires a UI affordance to edit structured Criteria values post-normalization; mechanism not specified in the spec (see ambiguity above).                                                                                |
| Edge: stale listing still shown | Staleness must not be hidden                                                        | Yes          | Directly satisfied by always rendering `last_verified_at`; requires a defined staleness threshold for visual treatment, which is not stated in the spec (minor gap, not blocking).                                        |
| Edge: required-only submission  | Full recommendation still produced despite no optional answers                      | Yes          | Directly covered by the "no recommendation without required criteria" rule combined with the engine treating absent optional fields as neutral, not disqualifying.                                                        |

**Coverage summary**: 9 of 14 acceptance scenarios/edge cases are fully
addressable with the approved architecture; 5 are partial pending resolution of
the normalization-parity, constraint-granularity, and
resumption/correction-mechanism ambiguities noted above.
