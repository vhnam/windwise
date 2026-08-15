---
work_item: 007-instrument-catalog-browsing
sequence: 007
slug: instrument-catalog-browsing
---

# SPDD Analysis: Instrument Catalog Browsing

## Original Business Requirement

# Feature Specification: Instrument Catalog Browsing

**Feature Branch**: `007-instrument-catalog-browsing`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Free browsing of the instrument catalog by
section, family, budget band, and brand, reachable without chatting — the SEO
and trust surface of the consumer application, including model detail pages with
trust signals."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browsing without starting a consultation (Priority: P1)

A visitor who arrives from a search engine or a shared link wants to look at
instruments directly, without going through a chat or form consultation first.

**Why this priority**: This is the primary SEO and organic-discovery surface of
the consumer application; without it, all traffic must funnel through the
consultation flow.

**Independent Test**: Can be fully tested by navigating directly to a catalog
listing page (e.g., by section or family) without ever starting a consultation,
and confirming published instruments are shown.

**Acceptance Scenarios**:

1. **Given** a visitor with no active consultation, **When** they open a catalog
   listing page, **Then** they see published instruments without being required
   to answer any questions first.
2. **Given** a visitor on a listing page, **When** they filter by section
   (brass/woodwind), family, budget band, or brand, **Then** the listing updates
   to show only matching published instruments.

---

### User Story 2 - Viewing full detail on one instrument (Priority: P1)

A visitor who found an instrument via browsing or a recommendation wants to see
its full specs, pricing, and trustworthiness before deciding it's worth
pursuing.

**Why this priority**: The detail page is where browsing converts into a trusted
decision; it is the second half of the SEO/trust surface.

**Independent Test**: Can be fully tested by opening any published instrument's
detail page and confirming specs, pricing, and trust signals are all present.

**Acceptance Scenarios**:

1. **Given** a published instrument, **When** its detail page is opened,
   **Then** the visitor sees its specs, images with proper credit, and pricing
   labeled by scope (MSRP vs. Vietnamese market).
2. **Given** a published instrument, **When** its detail page is opened,
   **Then** the visitor sees its last-verified date and a link to the source
   used to verify it.
3. **Given** an instrument with known variants (e.g., a lacquer vs. silver-plate
   finish), **When** its detail page is opened, **Then** the variants are listed
   rather than shown as separate, duplicate catalog entries.

---

### User Story 3 - Finding instruments within a budget (Priority: P2)

A visitor with a fixed budget in mind wants to see only instruments they can
actually afford, without going through the full consultation.

**Why this priority**: Budget is called out as a hard filter in the consultation
flow (BR-C1) and is equally central to browsing; but browsing by section/family
already delivers standalone value without it on day one.

**Independent Test**: Can be fully tested by selecting a budget band filter on a
listing page and confirming every result's Vietnamese market price (or its
estimated equivalent) falls within that band.

**Acceptance Scenarios**:

1. **Given** a visitor filters by a budget band, **When** results are shown,
   **Then** every listed instrument's price fits that band, using Vietnamese
   street price where available and a clearly flagged estimate otherwise.

### Edge Cases

- What happens when an instrument has no current Vietnamese street price on
  record? It must still be browsable, with its price shown as an estimate
  derived from MSRP and clearly labeled as such.
- What happens when a filter combination matches zero published instruments? The
  page must say so plainly rather than showing an empty grid with no
  explanation.
- How does the system handle a direct link to an unpublished, archived, or
  since-removed instrument? It must return a clear "not available" state, not a
  broken or stale page.
- What happens when an instrument has multiple variants — does the detail page
  for one variant differ from its base model page? The base model page is the
  canonical entry point; variants are surfaced as a distinct section on it.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST make all published instruments browsable via listing
  pages reachable without starting a consultation.
- **FR-002**: System MUST support filtering listings by section, instrument
  family, budget band, and brand.
- **FR-003**: System MUST show, on every instrument detail page, its full specs,
  images with credit and license note, and pricing labeled by scope.
- **FR-004**: System MUST show, on every instrument detail page, its
  last-verified date and a link to its source.
- **FR-005**: System MUST group near-identical variants of the same base model
  under one canonical listing, with variants surfaced on that listing's detail
  page rather than as separate catalog rows.
- **FR-006**: System MUST filter budget-band results using Vietnamese street
  price when available, falling back to an MSRP-derived estimate flagged as such
  when it is not.
- **FR-007**: System MUST only surface instruments with published status on
  browsing pages; draft, in-review, and archived instruments MUST NOT appear.
- **FR-008**: System MUST return a clear "not available" state for a direct link
  to an instrument that is not currently published.

### Key Entities

- **Instrument Listing Page**: A filterable view over published instruments,
  scoped by section, family, budget band, or brand.
- **Instrument Detail Page**: The canonical page for one base model, including
  specs, images, scoped pricing, verification trust signals, and its variants.
- **Variant Group**: A base model and its near-identical variants, presented as
  one browsable entity.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every published instrument is reachable from at least one listing
  page filter combination.
- **SC-002**: 100% of instrument detail pages display a last-verified date and a
  source link — zero published pages missing these trust signals.
- **SC-003**: A visitor can go from a listing page to a fully loaded detail page
  in two clicks or fewer.
- **SC-004**: Budget-band filtering returns zero instruments priced outside the
  selected band, verified across all bands.

## Assumptions

- This feature depends on the catalog authoring and publish workflow already
  producing published instrument records (see
  [008-catalog-management-workflow](../008-catalog-management-workflow/spec.md)).
- Search-engine indexing and metadata (titles, structured data) are treated as a
  standard expectation of a public catalog page and not separately enumerated
  here.
- No cart, checkout, or purchase action exists on these pages in v1 — the
  outcome of browsing is informational, matching the platform's explicit
  non-goals.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Consumer application (`apps/consumer-application`)**: The TanStack Start SSR
  app this feature's routes belong to. Today it only has a placeholder
  `index.tsx` and `__root.tsx`; no catalog, listing, or detail routes exist yet.
  It already depends on `@windwise/ui`, `@windwise/query`, and PowerSync
  integration scaffolding, but nothing domain-specific.
- **Shared UI library (`@windwise/ui`)**: The domain-free primitive set
  established by work item 004 (button, field, card, badge, tabs, dialog,
  loading placeholder, notice). Listing and detail pages are expected to compose
  these rather than invent one-off controls, per that work item's "one library,
  two products" rule.
- **`@windwise/query`**: Shared TanStack Query client setup already consumed by
  the consumer app; the natural home for catalog fetch/prefetch wiring
  referenced in 007's plan.md, though no catalog query hooks exist in it yet.
- **Catalog domain model (from 005's plan/data-model, not yet built)**:
  `InstrumentFamily`, `InstrumentModel`, `PricePoint` and the budget-band
  matching concept (`vn_street`-preferred, MSRP-fallback-with-estimate) were
  designed for the guided-consultation feature (005) and are the same entities
  this browsing feature reads. No `packages/db` package exists in the repository
  yet — 005/006/007 all depend on it as planned-but-unbuilt infrastructure.
- **Consultation flow (005)**: The chat/form-based path to recommendations,
  referenced here only as the thing browsing must NOT require ("reachable
  without chatting"). Confirms this feature is a parallel, independent entry
  point rather than a step within consultation.
- **Catalog management workflow (008, sibling spec, also unbuilt)**: The
  authoring/publish pipeline this feature explicitly assumes as its data source
  — 007 is a pure read surface over records 008 is responsible for producing.

#### New Concepts Required

- **Instrument Listing Page**: A filterable, SSR-rendered view over published
  instruments only, scoped by section, family, budget band, and brand. New as a
  UI/route concept; depends entirely on the not-yet-built catalog read layer.
- **Instrument Detail Page**: The canonical, single page per base model showing
  specs, images (with credit/license), scoped pricing, trust signals
  (last-verified date, source link), and its variant group. New concept; the
  "canonical entry point" framing is specific to this feature.
- **Variant Group**: A base model plus its near-identical variants (e.g.,
  lacquer vs. silver-plate) treated as one browsable entity so variants never
  appear as duplicate catalog rows. New grouping concept that sits between raw
  `InstrumentModel` rows and what a visitor sees.
- **Published-only visibility gate**: The rule that only `published`-status
  instruments are ever exposed on these routes, with a distinct "not available"
  state for direct links to non-published records (as opposed to a generic 404).
  New as an explicit product-facing state, though it depends on a status field
  that 008's authoring workflow owns.
- **Budget-band filter (browsing context)**: Reuses 005's budget-matching logic
  but as a listing filter rather than a consultation-flow input — new in the
  sense that it must be exposed as a public, unauthenticated filter control
  rather than an answer collected mid-conversation.
- **Trust signal presentation**: Last-verified date + source link + image
  credit/license, surfaced together as a first-class part of every detail page.
  Framed here as the feature's differentiator ("SEO and trust surface"); no
  prior work item treats trust display as a dedicated concept.

#### Key Business Rules

- **Consultation-free access** (governs Instrument Listing Page, Instrument
  Detail Page): Browsing MUST be fully reachable without starting or completing
  a consultation.
- **Published-only surfacing** (governs Instrument Listing Page, Instrument
  Detail Page, Published-only visibility gate): Draft, in-review, and archived
  instruments MUST NOT appear on any browsing page, and a direct link to one
  MUST resolve to a distinct "not available" state.
- **One canonical entry per base model** (governs Variant Group, Instrument
  Detail Page): Near-identical variants MUST be grouped under a single listing
  row and surfaced as a section on the base model's detail page, never as
  separate catalog entries.
- **Price scope labeling** (governs Instrument Detail Page): Every price shown
  MUST be labeled by scope (MSRP vs. Vietnamese market) so a visitor is never
  shown an unscoped number.
- **Vietnamese-price-first budget filtering** (governs budget-band filter):
  Budget-band matching MUST prefer `vn_street` price and fall back to an
  MSRP-derived estimate only when no street price exists, with that fallback
  clearly flagged — the same rule 005 needs for consultation, per plan.md's
  explicit intent to share one query function rather than reimplement it.
- **Mandatory trust signals** (governs Instrument Detail Page): Every published
  detail page MUST show a last-verified date and a source link; this is a
  zero-tolerance completeness rule (SC-002), not a best-effort display.
- **Image licensing gate** (governs Instrument Detail Page): An image without
  credit and license note MUST NOT render on a published page — this is a
  pre-existing platform constraint (data-model.md, platform §4.3) that this
  feature must honor rather than introduce.

## Strategic Approach

#### Solution Direction

Treat this as a **read-only, SSR presentation layer** over the catalog data
model that 005 (guided consultation) already designed and 008 (catalog
management) is responsible for populating — not a new domain or a new data
model. The general data flow is: visitor requests a listing or detail route →
SSR route loader in `apps/consumer-application` calls a published- only catalog
query → query result (already variant-grouped, already budget-resolved) is
rendered through `@windwise/ui` primitives on first paint, with no client-side
loading spinner for primary content. Because no `packages/db` or catalog query
layer exists yet anywhere in the repository, this feature's "read path" framing
depends on that infrastructure being stood up (by this work item or a
prerequisite one) as much as on new routes — it is not purely additive UI on top
of existing plumbing.

#### Key Design Decisions

- **Shared budget-price resolution vs. a second implementation**: 005 also needs
  `vn_street`-preferred/MSRP-fallback budget matching for consultation.
  Duplicating that logic for browsing would create two sources of truth for the
  same business rule → **implement budget-price resolution once, in the shared
  catalog query layer, and have both browsing and consultation call it.**
- **Variant grouping at the query layer vs. at the presentation layer**:
  Grouping could be done by fetching all model rows and merging them in the
  route/component, or by having the query itself return one row per base model
  with variants nested. Presentation-layer grouping risks a variant briefly
  rendering as its own listing row on partial fetches or future reuse of the
  query elsewhere → **group variants at the query layer** so "one canonical
  entry per base model" is guaranteed everywhere the query is reused, not just
  in this feature's components.
- **SSR-first rendering vs. client-fetched listing**: This is explicitly the
  SEO/trust surface; content invisible to first paint undermines that purpose →
  **render listing and detail pages via SSR route loaders**, treating
  client-side data fetching as an enhancement (e.g., prefetch on hover) rather
  than the primary path.
- **Distinct "not available" state vs. reusing a generic 404**: A direct link to
  an unpublished/archived/removed instrument is a known, expected case (catalog
  status changes over time), not an exceptional error → **model it as an
  explicit detail-page state** distinct from routing 404s, so the page can
  explain _why_ the content isn't there rather than presenting a broken-link
  experience.
- **Filter state in the URL vs. client-only state**: Filterable listings are the
  SEO surface; unlinkable filter combinations (section, family, budget band,
  brand) would be unreachable from search results or shared links → **reflect
  filters directly in the URL** so any filtered view is itself a shareable,
  indexable page.
- **Sequencing relative to 008 (catalog management)**: This feature's
  correctness is entirely dependent on published records existing and on the
  `published`/`draft`/`in-review`/`archived` status field being authoritative —
  both owned by 008 → **treat 008 as a data-availability precondition**, not a
  blocking implementation dependency; the read queries and routes can be built
  and tested against seeded/fixture data independent of 008's authoring UI being
  complete.

#### Alternatives Considered

- **Folding browsing into the consultation flow (e.g., a "skip questions"
  path)**: Rejected — the spec explicitly requires browsing to be reachable
  "without chatting," and conflating the two would tie the SEO surface's
  availability to consultation-flow changes.
- **Client-side-only filtering (fetch full catalog, filter in the browser)**:
  Rejected for the primary path — it defeats SSR-driven SEO indexing of filtered
  views and would require shipping the full catalog payload up front, which does
  not scale as the catalog grows toward 60-90+ models.
- **Per-variant catalog rows with a "see also" link between them**: Rejected —
  the spec explicitly requires variants to be grouped under one canonical entry,
  not linked duplicates; this alternative would still produce duplicate,
  competing SEO pages for near-identical products.
- **Duplicating budget-matching logic separately for browsing**: Rejected as a
  design decision above — same rule, same rounding/fallback behavior is required
  in both 005 and 007; a second implementation risks the two surfaces
  disagreeing on which instruments fit a given budget.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Definition of "near-identical variant"**: FR-005 and the edge cases describe
  grouping by example (lacquer vs. silver-plate finish) but do not define the
  boundary between a "variant" of one base model and a genuinely distinct model
  that happens to share a family/brand. This judgment call currently lives with
  whoever authors catalog records (008), but 007's grouping display logic will
  inherit whatever ambiguity exists there. Open gap: no explicit rule for what
  data attribute(s) determine "same base model."
- **Budget band boundaries**: The spec requires filtering to return "zero
  instruments priced outside the selected band" (SC-004), but does not state the
  bands themselves (data-model.md shows candidate values like
  `under_20m`/`20_50m`/`50_100m`/`over_100m` from the router search- param
  shape, not the spec) or how an instrument whose price _range_ straddles a band
  boundary should be classified.
- **"Two clicks or fewer" (SC-003) scope**: Unclear whether this is measured
  from the catalog's own listing page only, or also from an external entry point
  (search engine result, shared link) — the two give different click budgets in
  practice.
- **Estimate flagging presentation**: FR-006 requires MSRP-derived estimates to
  be "clearly flagged," but the spec does not define what counts as clear (e.g.,
  a label string is implied but not specified) — left for the visual/UX design
  phase, but worth surfacing since it is tied to a trust-signal success
  criterion (SC-002 lists date/source only, not the estimate flag, though
  FR-003/FR-006 both bear on trust).

#### Edge Cases

- **Zero published instruments in a family/section entirely**: The spec covers
  "zero matches for a filter combination" but not the case where an entire
  top-level section or family has no published instruments yet (plausible during
  early catalog rollout, given plan.md's "handful at MVP" scale note) — the
  empty-state messaging may need to differ from a narrow filter-combination
  miss.
- **Variant that becomes unpublished while its base model stays published**: Not
  addressed — should the detail page silently drop that variant from its variant
  list, or should the whole listing become inconsistent? This is a direct
  consequence of variants being grouped under one page rather than routed
  independently.
- **A model transitioning from published to archived while a visitor has its
  detail page open in another tab**: SSR means the page was correct at request
  time; the spec doesn't address staleness tolerance for an already-rendered
  page, which is a reasonable v1 gap but worth naming.
- **Price completely absent (no MSRP and no `vn_street`)**: The spec's edge case
  only covers "no Vietnamese street price" with an MSRP-derived estimate as
  fallback; it does not say what happens if MSRP is also missing, which would
  break both the detail page's price display and any budget-band filter that
  depends on a price existing.

#### Technical Risks

- **No catalog data layer exists yet**: There is no `packages/db` (or
  equivalent) package in the repository today — the entities this feature reads
  (`InstrumentModel`, `InstrumentFamily`, `PricePoint`, plus `ModelImage` and
  `Source` per 007's own data-model.md) are designed on paper (005/007 planning
  docs) but not implemented. This feature cannot ship independent of that
  infrastructure landing first or alongside it, which is a larger dependency
  than "add new routes to an existing app."
- **N+1 query risk on listing pages**: Each listing row needs a resolved price,
  a primary image, and a variant count — fetching these per-row instead of in
  one batched query is an easy correctness trap for a first-paint SSR page and
  was already flagged as a constitution performance check in plan.md; worth
  carrying forward as a concrete risk.
- **Shared budget-resolution function becoming a coupling point**: Because 005
  (consultation) and 007 (browsing) are designed to share one budget- price
  resolution function, a change made for one feature's needs (e.g., 005 needing
  per-criteria matching nuance) could silently affect the other's filter
  correctness (SC-004) if the shared function isn't tested from both call sites.
- **SEO/indexability depends on infrastructure choices not yet exercised in this
  repo**: This is the first feature in the codebase requiring true SSR-for-SEO
  (vs. the existing placeholder SSR scaffold); metadata, structured data, and
  crawlability are explicitly called out in the spec's Assumptions as "standard
  expectations, not separately enumerated" — meaning they are real scope that
  isn't visible in the FR list.

#### Acceptance Criteria Coverage

| AC#                                                          | Description                                                                                                        | Addressable? | Gaps/Notes                                                                                                                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1.1                                                        | Visitor with no active consultation sees published instruments on a listing page without answering questions first | Yes          | Requires the catalog read layer and published-only query to exist; no consultation-state check needed since the route is independent                                                                                                |
| US1.2                                                        | Listing updates when filtered by section, family, budget band, or brand                                            | Yes          | Depends on filter search-param plumbing (TanStack Router) and the same published-only query accepting filter arguments                                                                                                              |
| US2.1                                                        | Detail page shows specs, images with credit, and scope-labeled pricing                                             | Yes          | Depends on `ModelImage` (credit/license required) and price-scope data existing; image licensing gate must be enforced before render                                                                                                |
| US2.2                                                        | Detail page shows last-verified date and source link                                                               | Yes          | Depends on `Source` entity and a `lastVerifiedAt`-equivalent field on the model; SC-002 makes this zero-tolerance, so needs a completeness check, not just a UI slot                                                                |
| US2.3                                                        | Variants listed on detail page, not shown as separate catalog entries                                              | Yes          | Depends on the variant-grouping rule being enforced at the query layer; "near-identical" boundary is a spec gap (see Ambiguities) affecting correctness of grouping                                                                 |
| US3.1                                                        | Budget-band filter returns only instruments whose Vietnamese price (or flagged estimate) fits the band             | Yes          | Depends on the shared budget-price resolution function (also used by 005) and defined band boundaries, which are only present in data-model.md, not the spec itself                                                                 |
| Edge: no VN street price                                     | Instrument still browsable with a flagged MSRP-derived estimate                                                    | Yes          | Requires the estimate-flag UI treatment, which is underspecified (see Ambiguities)                                                                                                                                                  |
| Edge: zero-match filter combination                          | Page states no matches plainly, not an empty grid                                                                  | Yes          | Straightforward empty-state pattern, reusable from 004's shared notice/empty-state conventions once those exist                                                                                                                     |
| Edge: direct link to unpublished/archived/removed instrument | Clear "not available" state, not broken/stale page                                                                 | Yes          | Requires the distinct "not available" result type already planned in 007's data-model.md (`status: 'not_available'`), separate from routing 404                                                                                     |
| Edge: variant vs. base model detail page                     | Base model page is canonical; variants shown as a section on it                                                    | Yes          | Same variant-grouping dependency as US2.3                                                                                                                                                                                           |
| SC-001                                                       | Every published instrument reachable from at least one listing filter combination                                  | Partial      | Addressable by design (published-only query with full filter coverage), but verifying "every" instrument requires a coverage check (e.g., an integration test enumerating published records) not called out as a technical task yet |
| SC-002                                                       | 100% of detail pages show last-verified date and source link, zero missing                                         | Partial      | Requires those fields to be mandatory (non-null) at the data layer, not just rendered when present — otherwise a record missing a source could silently violate this at 100%                                                        |
| SC-003                                                       | Listing-to-detail in two clicks or fewer                                                                           | Yes          | Straightforward navigation design outcome; ambiguity noted above on measurement starting point                                                                                                                                      |
| SC-004                                                       | Budget-band filtering returns zero instruments outside the selected band, across all bands                         | Partial      | Addressable via the shared resolution function, but depends on the price-completely-absent edge case (see Edge Cases) being resolved, since an instrument with no price at all cannot be correctly banded                           |

**Coverage summary**: 10 of 14 acceptance scenarios/criteria are fully
addressable with the proposed read-layer-plus-SSR-routes approach; 4 (SC-001,
SC-002, SC-004, and indirectly US2.3/US3.1 via the "near-identical variant" and
"price completely absent" gaps) are partial pending either a data-completeness
guarantee (mandatory fields, coverage tests) or a requirement clarification not
resolvable from the spec text alone.

Open questions / risks to carry into REASONS Canvas: the "near-identical
variant" grouping boundary; budget-band definitions and boundary-price handling;
behavior when MSRP is also absent; whether SC-001/SC-002 need an automated
completeness check versus a manual content-review gate; and the
sequencing/shared-ownership of the not-yet-built catalog data layer between this
feature, 005, and 008.
