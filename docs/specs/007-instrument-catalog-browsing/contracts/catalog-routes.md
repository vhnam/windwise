# Contract: Catalog Browsing Routes & Loaders

No AI tools in this feature — these are SSR route loaders (TanStack Start), each
backed directly by a `@windwise/db` query. No provider keys, no LLM involvement.

## `GET /catalog` (and `/catalog/$familySlug`)

Search params (all optional): `section`, `family`, `budgetBand`, `brand` — see
data-model.md's Filter Search Params shape.

**Loader behavior**:

- Calls `listPublishedInstruments(filters)`.
- Returns `{ items, totalCount }` (data-model.md's Listing Query Result Shape).
- Empty `items` with a valid filter combination is a normal, renderable state
  (spec Edge Cases) — the loader does not error on zero results.

**Guarantee**: only `status = 'published'` records are ever included (spec
FR-007) — enforced inside `listPublishedInstruments`, not filtered client-side.

## `GET /instrument/$modelId`

**Loader behavior**:

- Calls `getInstrumentDetail(modelId)`.
- Returns the Detail Query Result Shape's `available` variant when the record
  exists and `status = 'published'`.
- Returns the `not_available` variant (rendered as a clear, distinct page state
  — research.md §4) for any other status, including a nonexistent ID.

**Guarantee**: every `available` response includes `lastVerifiedAt` and a
non-null `source` (spec FR-004); every image in `images` has non-null
`credit`/`license_note` (spec FR-003) — records failing this are expected to
never reach `published` status per
[008](../../008-catalog-management-workflow/spec.md)'s publish gate, so this
loader trusts but does not re-validate that invariant.

## Budget filtering price resolution

Shared function (research.md §1), not a route — documented here because both
this feature and 005's consultation flow depend on its contract:

```ts
resolveBudgetPrice(modelId: string): {
  scope: 'vn_street' | 'msrp_global'
  isEstimate: boolean   // true only when falling back to MSRP-derived estimate
  amountMin: number
  amountMax: number
}
```

**Guarantee**: `isEstimate` is `true` whenever `scope = 'msrp_global'` and
`false` whenever `scope = 'vn_street'` — the UI is required to visibly flag
estimated prices (spec FR-006), and this field is what drives that flag.
