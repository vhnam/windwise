# Phase 1 Data Model: Instrument Catalog Browsing

No new tables. This feature reads the catalog entities already modeled in
[005's data-model.md](../005-guided-instrument-consultation/data-model.md)
(`InstrumentFamily`, `InstrumentModel`, `PricePoint`) plus two tables from
platform plan §3.2 not previously needed by 005/006 and introduced here:

## ModelImage (`@windwise/db`, new to this feature's scope)

| Field                    | Type      | Notes                                                      |
| ------------------------ | --------- | ---------------------------------------------------------- |
| `id`                     | uuid      |                                                            |
| `model_id`               | uuid (fk) |                                                            |
| `url`                    | text      | never a hotlinked manufacturer asset (platform §4.3)       |
| `alt_vi`, `alt_en`       | text      |                                                            |
| `credit`, `license_note` | text      | required non-null before an image can render (spec FR-003) |
| `is_primary`             | boolean   |                                                            |
| `sort_order`             | int       |                                                            |

## Source (`@windwise/db`, new to this feature's scope)

| Field                              | Type                                                                       | Notes                                                   |
| ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| `id`                               | uuid                                                                       |                                                         |
| `kind`                             | enum: `manufacturer \| dealer \| manual_pdf \| editorial \| expert_review` |                                                         |
| `url`, `publisher`, `retrieved_at` |                                                                            | surfaced as the detail page's source link (spec FR-004) |

## Listing Query Result Shape (in-memory, `@windwise/schemas`)

Output of `list-published-instruments.ts`.

```ts
{
  items: Array<{
    modelId: string;
    displayName: string;
    familySlug: string;
    brandSlug: string;
    tier: "student" | "intermediate" | "professional" | "custom";
    price: {
      scope: "vn_street" | "msrp_global";
      isEstimate: boolean;
      amountMin: number;
      amountMax: number;
    };
    primaryImage: {
      url: string;
      altVi: string;
      altEn: string;
      credit: string;
    } | null;
    variantCount: number;
  }>;
  totalCount: number;
}
```

One row per base model — variants are pre-grouped at the query layer
(research.md §3), never returned as separate rows.

## Detail Query Result Shape (in-memory, `@windwise/schemas`)

Output of `get-instrument-detail.ts`.

```ts
| {
    status: 'available'
    model: { /* full InstrumentModel fields */ }
    specs: Array<{ key: string; value: string; unit: string | null }>
    images: ModelImage[]
    price: { scope: 'vn_street' | 'msrp_global'; isEstimate: boolean; amountMin: number; amountMax: number }
    lastVerifiedAt: string
    source: { url: string; publisher: string; retrievedAt: string }
    variants: Array<{ modelId: string; displayName: string; distinguishingFeature: string }>
  }
| { status: 'not_available' }        // distinct from a routing 404 (research.md §4)
```

## Filter Search Params (TanStack Router, not persisted)

```ts
{
  section?: 'brass' | 'woodwind'
  family?: string          // family slug
  budgetBand?: 'under_20m' | '20_50m' | '50_100m' | 'over_100m'
  brand?: string            // brand slug
}
```

Directly reflected in the listing page URL (research.md §2) — no separate
client-only filter state.
