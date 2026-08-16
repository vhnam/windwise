# Phase 0 Research: Instrument Catalog Browsing

## 1. Sharing budget-price resolution with the consultation engine

**Decision**: Extract the "prefer `vn_street`, fall back to MSRP-derived
estimate flagged as such" logic into one `@windwise/db` function
(`resolve-budget-price.ts`) used by this feature's listing filter, by 005's
consultation budget matching (which currently implements the same rule inline
per 005's data-model.md PricePoint note), and by
[006](../006-instrument-compare-upgrade/plan.md)'s `compareModelsCore()`
(per-model `price` field, see 006's data-model.md `ComparisonResult`) and
`suggestUpgrade()`'s `upgradeBudget` matching.

**Rationale**: Spec 007 FR-006 states the identical rule platform plan §3.3
already specifies for consultation budget filtering ("Budget filtering must use
`vn_street` when present, falling back to `msrp_global × fx × import_factor`...
flagged as an estimate"). Independent implementations of currency/estimate logic
across 005, 006, and this feature would drift silently — exactly the duplication
the constitution's Code Quality principle flags. If 005 already shipped an
inline version, this feature's implementation work includes promoting it to a
shared function and pointing 006's price displays at it too, not copying it a
third time.

**Alternatives considered**: Reimplementing the same rule locally in this
feature's query — rejected for the duplication reason above.

## 2. Filter state representation

**Decision**: Represent listing filters (section, family, budget band, brand) as
typed TanStack Router search params, not client component state.

**Rationale**: Platform plan §5.2 explicitly calls out typed search params as
router's "strongest use case here" for exactly this kind of
list-filter/pagination scenario. It also makes filtered listing URLs directly
shareable/bookmarkable and crawlable, reinforcing this feature's SEO purpose
(spec FR-001).

**Alternatives considered**: Zustand for filter state — rejected per the
platform plan's own stated Zustand/Query boundary rule ("server data is never
mirrored into Zustand... Zustand holds only state that has no server counterpart
yet"); filter selections that map directly to a server query and a shareable URL
are exactly what search params are for, not client-only state.

## 3. Variant grouping at the query layer vs. presentation layer

**Decision**: `list-published-instruments.ts` returns one row per base model
(grouping `variant_of_model_id` children under their parent) at the query layer,
not by fetching a flat list and grouping in a component.

**Rationale**: Spec FR-005 requires variants to never appear as separate catalog
rows on listing pages. Grouping in the query keeps the "what does a listing page
actually show" invariant enforceable and testable in one place (a `@windwise/db`
unit test), rather than trusting every future listing UI to apply the grouping
correctly.

**Alternatives considered**: Grouping client-side in the listing component —
rejected, makes the invariant untested at the data layer and repeatable per new
UI surface that queries the same data.

## 4. "Not available" state for unpublished direct links

**Decision**: The detail-page route loader queries by ID regardless of status,
then returns a typed `NOT_AVAILABLE` result (distinct from a generic 404) when
status is not `published`, letting the page render a clear, intentional message
rather than a framework-default not-found page.

**Rationale**: Spec FR-008 / Edge Cases explicitly distinguishes this from a
broken link — the record exists, it's just not publicly offered right now. A
clear distinction matters for trust (spec 005/007's shared "trust signal"
thread) and for not looking like a bug to a visitor who followed an old shared
link.

**Alternatives considered**: Returning a plain HTTP 404 for any non-published
record — rejected, indistinguishable from a genuinely missing/mistyped ID, which
spec 007's edge case explicitly calls out as a worse experience than a clear
"not available."
