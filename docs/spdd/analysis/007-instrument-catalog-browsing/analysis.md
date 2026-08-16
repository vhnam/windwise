---
work_item: 007-instrument-catalog-browsing
sequence: 007
slug: instrument-catalog-browsing
---

# SPDD Analysis: Instrument Catalog Browsing

## Original Business Requirement

**Input**: "Free browsing of the instrument catalog by section, family, budget
band, and brand, reachable without chatting — the SEO and trust surface of the
consumer application, including model detail pages with trust signals."

Full spec (`docs/specs/007-instrument-catalog-browsing/spec.md`):

> ### User Scenarios & Testing
>
> **User Story 1 - Browsing without starting a consultation (Priority: P1)** A
> visitor who arrives from a search engine or a shared link wants to look at
> instruments directly, without going through a chat or form consultation first.
>
> **Independent Test**: Can be fully tested by navigating directly to a catalog
> listing page (e.g., by section or family) without ever starting a
> consultation, and confirming published instruments are shown.
>
> **Acceptance Scenarios**:
>
> 1. Given a visitor with no active consultation, When they open a catalog
>    listing page, Then they see published instruments without being required to
>    answer any questions first.
> 2. Given a visitor on a listing page, When they filter by section
>    (brass/woodwind), family, budget band, or brand, Then the listing updates
>    to show only matching published instruments.
>
> **User Story 2 - Viewing full detail on one instrument (Priority: P1)** A
> visitor who found an instrument via browsing or a recommendation wants to see
> its full specs, pricing, and trustworthiness before deciding it's worth
> pursuing.
>
> **Acceptance Scenarios**:
>
> 1. Given a published instrument, When its detail page is opened, Then the
>    visitor sees its specs, images with proper credit, and pricing labeled by
>    scope (MSRP vs. Vietnamese market).
> 2. Given a published instrument, When its detail page is opened, Then the
>    visitor sees its last-verified date and a link to the source used to verify
>    it.
> 3. Given an instrument with known variants (e.g., a lacquer vs. silver-plate
>    finish), When its detail page is opened, Then the variants are listed
>    rather than shown as separate, duplicate catalog entries.
>
> **User Story 3 - Finding instruments within a budget (Priority: P2)** A
> visitor with a fixed budget in mind wants to see only instruments they can
> actually afford, without going through the full consultation.
>
> **Acceptance Scenarios**:
>
> 1. Given a visitor filters by a budget band, When results are shown, Then
>    every listed instrument's price fits that band, using Vietnamese street
>    price where available and a clearly flagged estimate otherwise.
>
> **Edge Cases**:
>
> - What happens when an instrument has no current Vietnamese street price on
>   record? It must still be browsable, with its price shown as an estimate
>   derived from MSRP and clearly labeled as such.
> - What happens when a filter combination matches zero published instruments?
>   The page must say so plainly rather than showing an empty grid with no
>   explanation.
> - How does the system handle a direct link to an unpublished, archived, or
>   since-removed instrument? It must return a clear "not available" state, not
>   a broken or stale page.
> - What happens when an instrument has multiple variants — does the detail page
>   for one variant differ from its base model page? The base model page is the
>   canonical entry point; variants are surfaced as a distinct section on it.
>
> ### Requirements
>
> - **FR-001**: System MUST make all published instruments browsable via listing
>   pages reachable without starting a consultation.
> - **FR-002**: System MUST support filtering listings by section, instrument
>   family, budget band, and brand.
> - **FR-003**: System MUST show, on every instrument detail page, its full
>   specs, images with credit and license note, and pricing labeled by scope.
> - **FR-004**: System MUST show, on every instrument detail page, its
>   last-verified date and a link to its source.
> - **FR-005**: System MUST group near-identical variants of the same base model
>   under one canonical listing, with variants surfaced on that listing's detail
>   page rather than as separate catalog rows.
> - **FR-006**: System MUST filter budget-band results using Vietnamese street
>   price when available, falling back to an MSRP-derived estimate flagged as
>   such when it is not.
> - **FR-007**: System MUST only surface instruments with published status on
>   browsing pages; draft, in-review, and archived instruments MUST NOT appear.
> - **FR-008**: System MUST return a clear "not available" state for a direct
>   link to an instrument that is not currently published.
>
> ### Key Entities
>
> - **Instrument Listing Page**: A filterable view over published instruments,
>   scoped by section, family, budget band, or brand.
> - **Instrument Detail Page**: The canonical page for one base model, including
>   specs, images, scoped pricing, verification trust signals, and its variants.
> - **Variant Group**: A base model and its near-identical variants, presented
>   as one browsable entity.
>
> ### Success Criteria
>
> - **SC-001**: Every published instrument is reachable from at least one
>   listing page filter combination.
> - **SC-002**: 100% of instrument detail pages display a last-verified date and
>   a source link — zero published pages missing these trust signals.
> - **SC-003**: A visitor can go from a listing page to a fully loaded detail
>   page in two clicks or fewer.
> - **SC-004**: Budget-band filtering returns zero instruments priced outside
>   the selected band, verified across all bands.
>
> ### Assumptions
>
> - This feature depends on the catalog authoring and publish workflow already
>   producing published instrument records (see
>   008-catalog-management-workflow).
> - Search-engine indexing and metadata (titles, structured data) are treated as
>   a standard expectation of a public catalog page and not separately
>   enumerated here.
> - No cart, checkout, or purchase action exists on these pages in v1 — the
>   outcome of browsing is informational, matching the platform's explicit
>   non-goals.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **InstrumentFamily** (`packages/db/src/schema/catalog.ts`): section
  (brass/woodwind), slug, bilingual names, and profile attributes
  (beginner_difficulty, min_recommended_age, physical_demand,
  typical_ensembles). Already fully modeled and seeded; this feature reads it
  unchanged for family-scoped listings and the "section/family" filter.
- **InstrumentModel** (`packages/db/src/schema/catalog.ts`): the base catalog
  row — `brandId`, `familyId`, `modelCode`, `displayName`, `levelTier`, `status`
  (draft/in_review/published/archived), `lastVerifiedAt`, `variantOfModelId`,
  plus a single `sourceUrl` string field carried on the Valibot schema
  (`packages/schemas/src/catalog.ts`). `status` and `variantOfModelId` are
  exactly the fields FR-005/FR-007/FR-008 depend on.
- **PricePoint** (`packages/db/src/schema/catalog.ts`): `modelId`, `scope`
  (`msrp_global | vn_street`), `amountMin/amountMax`, `isCurrent`. This is the
  entity FR-006's budget-band rule operates over.
- **Budget bands**: `BudgetSchema` in `packages/schemas/src/criteria.ts`
  (`under_20m | 20_50m | 50_100m | over_100m`) — the consultation flow's
  existing budget vocabulary. 007's planned `budgetBand` filter values match
  this enum exactly, so no new taxonomy is introduced; the filter reuses the
  same business concept of "budget band" the consultation flow already uses.
- **vn_street-preferred price selection**: a `resolveDisplayPrice`-shaped helper
  already exists, but as a narrow inline expression in
  `packages/core/src/recommend.ts`
  (`forModel.find(price => price.scope === 'vn_street') ?? forModel[0]`) — see
  Risk & Gap Analysis; this is the concept FR-006 needs, but its current form is
  neither shared nor complete.
- **Consultation intent / session** (`packages/db/src/schema/consultation.ts`,
  `apps/consumer-application/src/routes/consult/`, `/compare/`, `/upgrade/`):
  the existing chat/form-driven discovery, compare, and upgrade surfaces (specs
  005/006). This feature is explicitly the non-conversational sibling entry
  point to the same catalog data — it must not require or assume any
  consultation session exists.
- **Variant relationship**: `instrumentModels.variantOfModelId` (self-FK,
  currently untyped as a DB-level reference — see Risk & Gap Analysis) is the
  existing mechanism the consultation engine already uses conceptually for
  "near-identical variant of a base model," matching FR-005's requirement
  directly.

#### New Concepts Required

- **ModelImage**: an instrument's photo(s) with mandatory `credit` and
  `license_note`, `alt` text (bilingual), primary flag, and sort order. No table
  or schema currently exists for this — the codebase has no image concept at all
  today. Relates to InstrumentModel by FK.
- **Source** (as a first-class entity, not a bare URL string): `kind`
  (manufacturer/dealer/manual_pdf/editorial/expert_review), `url`, `publisher`,
  `retrieved_at`. Today `InstrumentModel.sourceUrl` is a single string field
  with no publisher/kind/retrieved-at metadata — FR-004's "last-verified date
  and a link to its source" needs more structure than the current field carries
  (see Risk & Gap Analysis on whether to extend `sourceUrl` or fully introduce
  the `sources` table envisioned in
  `docs/specs/007-instrument-catalog-browsing/data-model.md`). Relates to
  InstrumentModel by FK (one model → one or more sources, at minimum one for
  last-verification).
- **Brand** (as a first-class, queryable entity): `brandId` exists on
  `InstrumentModel` today, but there is **no `brands` table anywhere in the
  schema** — it is a bare UUID with no name, slug, or lookup path; the only
  concrete value in the codebase is a hardcoded `SEED_BRAND_ID` constant in
  `packages/db/src/seed.ts`. FR-002's "filter by brand" and the plan's
  `brandSlug` listing field cannot be implemented against current schema without
  introducing this entity (see Risk & Gap Analysis — this is the most material
  gap found).
- **Listing Query Result / Detail Query Result** (in-memory shapes, not
  persisted): the pre-grouped (variant-aware), filter-aware read shapes that
  don't exist yet as query functions — greenfield for this feature, no existing
  analog in `@windwise/db`'s current query files (`consultation.ts`,
  `get-model-by-id.ts`, `fuzzy-match-catalog.ts`, `pin-reference-model.ts`,
  `confirmed-model-ids.ts`, `list-published-comparison-notes.ts` — none of these
  do listing-style filtering or variant grouping today).

#### Key Business Rules

- **Published-only visibility** (FR-007/FR-008): governs `InstrumentModel` —
  only `status = 'published'` rows may render on listing or detail pages;
  non-published direct links get a distinct "not available" state, not a 404 and
  not silent omission.
- **Variant canonicalization** (FR-005): governs `InstrumentModel` self-
  relationship — a model with `variantOfModelId` set must never appear as an
  independent listing row; it must appear only within its base model's detail
  page.
- **Price scope preference and estimate flagging** (FR-006): governs
  `PricePoint` — `vn_street` wins when present and `isCurrent`; otherwise an
  MSRP-derived value is shown but must be visibly flagged as an estimate. This
  rule must produce identical results wherever price is displayed or filtered
  (listing cards, detail page, budget-band matching) — a single business rule
  applied at multiple surfaces, not three independent judgment calls.
- **Trust signal completeness** (FR-003/FR-004, SC-002): governs
  `ModelImage`/`Source` — an image without `credit`/`license_note` must never
  render; a detail page without a last-verified date and source link is
  considered a defect, not an acceptable degraded state.
- **No-consultation-required access** (User Story 1): governs the relationship
  between this feature and the existing `ConsultationSession` concept — browsing
  must be fully functional with zero session state, a boundary rule that keeps
  this feature decoupled from 005/006's stateful flows.

## Strategic Approach

#### Solution Direction

This is a pure read/presentation layer over catalog data the consultation engine
(spec 005) already writes and scores — no new write paths, no AI/tool surface,
and no changes to `@windwise/core`'s recommendation logic. The general flow is:
SSR route loader in `apps/consumer-application` → typed filter/query function in
`@windwise/db` → catalog tables (existing + image/source additions) →
presentation components in `@windwise/ui`. This mirrors the layering already
established by 005/006 (route → query/tool layer → schema-backed persistence),
just without the AI/session layer those features require. Filter state should
live in the URL (TanStack Router typed search params) rather than client
component state, since filtered listings need to be
shareable/bookmarkable/crawlable for the feature's stated SEO purpose.

#### Key Design Decisions

- **Where the "vn_street-preferred, MSRP-fallback" rule lives**: trade-off
  between promoting the existing inline expression in
  `packages/core/src/recommend.ts` into a shared `@windwise/db` function versus
  leaving three independent implementations (005's consultation matching, this
  feature's listing/detail price display, and 006's
  `compareModelsCore`/`suggestUpgrade` price fields). → Recommend promoting to
  one shared function, because the rule is currently under-specified even in its
  one existing implementation (no MSRP→VND conversion, no estimate flag — see
  Risk & Gap Analysis), and getting it right once is materially cheaper than
  reconciling three drifted versions later.
- **Brand as a real entity vs. keeping it a bare UUID**: trade-off between
  introducing a `brands` table (slug, display name) now, versus filtering by raw
  `brandId` with no human-readable label. → Recommend introducing the entity
  now: FR-002 explicitly requires brand as a filter dimension, and a filter with
  no display name or slug cannot power a crawlable, shareable URL or a legible
  filter UI, which undercuts the SEO/UX goals this feature exists for. This
  decision should be surfaced explicitly since it is new schema work not
  previously scoped by 005/006.
- **Sources as a structured entity vs. extending the existing `sourceUrl`
  field**: trade-off between introducing a full `sources` table (kind,
  publisher, retrieved_at) versus adding publisher/retrieved-at columns directly
  next to the existing `sourceUrl` string. → Lean toward the structured entity,
  since FR-004's requirement ("last-verified date and a link to its source")
  reads as wanting attributable, typed provenance (matters for the "trust
  surface" framing), and a model can plausibly have more than one source over
  its verification history — but this is a genuine open trade-off worth
  confirming in REASONS Canvas rather than assumed outright, since the simpler
  column-extension path is also defensible for v1 scope.
- **Variant grouping location**: query-layer grouping (server) vs.
  component-layer grouping (client). → Query-layer, consistent with the existing
  pattern of keeping business rules server-side and testable in `@windwise/db`,
  and consistent with how 006 already keeps its confirmation gate and
  mention-resolution logic server-side rather than trusting a client or LLM to
  apply it correctly.

#### Alternatives Considered

- **Filter state as client-only component state (e.g., Zustand)** — rejected;
  the existing codebase convention (seen in the AI/consultation flows) keeps
  server-derived state out of Zustand, and filter selections map directly to a
  shareable server query, which is exactly what typed search params are for.
- **Flat listing with client-side variant grouping** — rejected for the same
  reason variant grouping should live server-side: the invariant ("variants
  never appear as separate rows") needs to be enforceable and testable in one
  place, not trusted to every future UI surface that queries the same data.
- **Treating a non-published direct link as a plain 404** — rejected; the spec's
  own edge case explicitly distinguishes "not available" (record exists, not
  currently offered) from a broken/mistyped link, and collapsing the two loses a
  trust signal this feature is supposed to strengthen.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Sources structure is unspecified beyond "a link to its source"**: FR-004
  doesn't say whether a detail page needs one canonical source or the fuller
  provenance record (publisher, kind, retrieved_at) implied by the "trust
  surface" framing. Needs resolution before schema work starts (see Strategic
  Approach decision above).
- **"Brand" filter semantics**: the spec says "filter by ... brand" but doesn't
  say whether brand needs its own dedicated page (like family gets via
  `$familySlug`), just a filter facet, or both. Given family gets a dedicated
  slugged route, it's ambiguous whether brand should too for SEO parity.
- **Budget-band boundaries**: the four bands (`under_20m`, `20_50m`, `50_100m`,
  `over_100m`) are reused from the consultation flow, but their exact VND
  boundary numbers aren't visible anywhere in the explored schema or spec —
  SC-004 ("zero instruments priced outside the selected band") can't be verified
  as correct without knowing those boundary values are defined consistently
  between this feature and the consultation engine.

#### Edge Cases

- **A model whose only price rows are non-current** (`isCurrent = false` for
  all): the current inline price-selection logic in `recommend.ts` doesn't
  handle this — `forModel.find(...) ?? forModel[0]` doesn't filter by
  `isCurrent` at all, so a stale price could be displayed as if current. This
  matters more here than in 005/006 since this feature's pages are the
  public-facing, indexed surface. test.
- **A model with zero price rows entirely**: neither the spec nor the current
  logic states what should render — not the same as "no vn_street price" (spec
  covers that), this is "no price data at all," which would need its own
  explicit state (likely still "browsable" per FR-006's spirit, but unstated).
- **A variant whose own `status` differs from its base model's** (e.g., base
  model published, one variant still draft): FR-005 requires variants to surface
  "on that listing's detail page," but doesn't say whether a non-published
  variant should still be listed there or hidden. Needs clarification since it's
  a direct extension of the published-only rule to a case the FR doesn't
  explicitly cover.

#### Technical Risks

- **No `brands` table exists today** — `brandId` is an unreferenced bare UUID
  column (`packages/db/src/schema/catalog.ts`), with only a hardcoded
  `SEED_BRAND_ID` constant standing in for real brand data
  (`packages/db/src/seed.ts`). This is new schema/migration work this feature
  must do that wasn't anticipated by 005/006's plans — flagged as the most
  material technical risk found, since FR-002's brand filter is not
  implementable without it.
- **The "vn_street-preferred, MSRP-fallback-with-estimate-flag" rule is
  currently incomplete, not just unshared** — the one existing implementation
  (`packages/core/src/recommend.ts`) does not perform any MSRP→VND estimate
  conversion or set an `isEstimate` flag; it only prefers `vn_street` when a row
  for that scope exists. Promoting this into a shared `@windwise/db` function
  (as 007's own plan/research already intends) is not a pure refactor — it
  requires implementing the estimate-conversion logic FR-006 actually requires
  for the first time. This also affects 005's and 006's existing behavior once
  the shared function is adopted there, so the change has cross-feature blast
  radius beyond 007's own scope.
- **`variantOfModelId` is not a DB-level foreign key** (no `.references()` in
  `packages/db/src/schema/catalog.ts`, unlike `familyId`/`brandId`→models):
  self-referencing integrity for the variant-grouping invariant (FR-005) is
  currently unenforced at the schema level, relying entirely on query-layer
  discipline. Not blocking, but worth tightening given how central the
  variant-grouping guarantee is to this feature.
- **N+1 query risk on listing pages**: fetching variant groups + primary image
  - current price per listing row is exactly the pattern 007's own plan already
    flags as needing an implementation-time check — confirmed as a real risk
    given no existing query function in `@windwise/db` currently does this kind
    of multi-relation fetch in one pass.

#### Acceptance Criteria Coverage

| AC#     | Description                                                                                        | Addressable?       | Gaps/Notes                                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| US1-AC1 | Listing page shows published instruments, no consultation required                                 | Yes                | Straightforward given existing `status` field and no session dependency in the route design                                                                        |
| US1-AC2 | Filtering by section/family/budget band/brand updates results                                      | Partial            | Section/family/budget band are addressable against current schema; brand filtering is blocked until a `brands` entity exists                                       |
| US2-AC1 | Detail page shows specs, images w/ credit, pricing by scope                                        | Partial            | Specs/pricing addressable; images blocked until `ModelImage` schema exists (fully greenfield, no gap beyond "build it")                                            |
| US2-AC2 | Detail page shows last-verified date and source link                                               | Partial            | `lastVerifiedAt` already exists and is addressable as-is; the "source link" needs the Sources ambiguity above resolved first                                       |
| US2-AC3 | Variants listed, not duplicated                                                                    | Yes, with a caveat | Addressable via `variantOfModelId`, but the "variant with different status than base" edge case above needs a stated rule before this can be called fully complete |
| US3-AC1 | Budget-band filtering matches only in-band results, VN price preferred, estimate flagged otherwise | Partial            | Blocked on completing the estimate-flagging logic described in Technical Risks — the current implementation cannot satisfy this AC as-is                           |
