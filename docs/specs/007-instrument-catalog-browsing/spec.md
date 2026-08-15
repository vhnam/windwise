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
