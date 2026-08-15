# Quickstart: Instrument Catalog Browsing

Validation guide. See [data-model.md](./data-model.md) and
[contracts/catalog-routes.md](./contracts/catalog-routes.md) for referenced
shapes. Reuses the seeded catalog from
[005's quickstart](../005-guided-instrument-consultation/quickstart.md).

## Prerequisites

- Seeded catalog with at least one `published` model per family, one `draft`
  model, one `archived` model, and at least one model with `vn_street` pricing
  and one with only `msrp_global` pricing
- At least one model with a variant (`variant_of_model_id` set)
- `apps/consumer-application` running

## Scenario 1 — Browsing without a consultation

1. Open `/catalog` directly, with no prior session or consultation.
2. **Expect**: published instruments render on first paint (SSR), no question
   flow or chat gate encountered first (spec FR-001).

## Scenario 2 — Filtering narrows results correctly

1. Apply `section=brass`, then add `budgetBand=under_20m`.
2. **Expect**: the URL reflects both params (research.md §2); every returned
   item is in the brass section and its resolved price (`resolveBudgetPrice`)
   falls within the under-20M band.

## Scenario 3 — Only published records ever appear

1. Note the `draft` and `archived` seed models' IDs.
2. Browse listings across every filter combination that should logically include
   them (matching family/section/budget/brand).
3. **Expect**: neither ID appears in any listing response (spec FR-007, SC-001).

## Scenario 4 — Variant grouping

1. Open the listing page for the family containing the seeded variant pair.
2. **Expect**: one row for the base model, with `variantCount >= 1` — the
   variant does not appear as its own separate row (spec FR-005).
3. Open that model's detail page.
4. **Expect**: the variant is listed in the `variants` array.

## Scenario 5 — Trust signals always present

1. Open any published model's detail page.
2. **Expect**: `lastVerifiedAt` and `source.url` are both present and rendered
   (spec FR-004, SC-002); every image shown has visible credit text (spec
   FR-003).

## Scenario 6 — Budget estimate flagging

1. Open the detail page for the model seeded with only `msrp_global` pricing (no
   `vn_street` row).
2. **Expect**: the displayed price is visibly marked as an estimate
   (`isEstimate: true`); the model seeded with `vn_street` pricing shows no such
   flag (spec FR-006).

## Scenario 7 — Not-available direct link

1. Request `/instrument/$modelId` for the seeded `draft` or `archived` model's
   ID directly.
2. **Expect**: a distinct "not available" page state, not a generic 404 and not
   the full detail view (spec FR-008, research.md §4).

## Scenario 8 — Zero results is a clear state, not an error

1. Apply a filter combination guaranteed to match nothing in the seed data
   (e.g., an unused brand + the narrowest budget band).
2. **Expect**: the page renders a clear "no instruments match" message, not an
   unstyled empty grid or a thrown error (spec Edge Cases).

## Success criteria mapped

| Quickstart scenario | Spec success criterion                                               |
| ------------------- | -------------------------------------------------------------------- |
| 1                   | SC-001 (reachable via listing filters)                               |
| 3                   | SC-001, FR-007 correctness invariant                                 |
| 4                   | variant grouping requirement (FR-005)                                |
| 5                   | SC-002 (100% trust signals present)                                  |
| 1, 5                | SC-003 (listing → detail in ≤2 clicks, implementation-time UX check) |
| 2, 6                | SC-004 (zero out-of-band budget results)                             |
