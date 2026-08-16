---
work_item: 007-instrument-catalog-browsing
sequence: 007
slug: instrument-catalog-browsing
---

# Instrument Catalog Browsing — Listing & Detail Pages

## Requirements

Give visitors a chat-free way to browse and trust the published instrument
catalog — filterable listing pages and a canonical detail page per base model,
serving as the consumer application's SEO and organic-discovery surface. Value
delivered: a visitor arriving from search or a shared link can evaluate an
instrument (specs, scoped pricing, provenance, images) and self-select into a
budget band, without ever starting a consultation session. Scope boundary:
read-only presentation over the catalog data 005 already writes — no scoring, no
AI/tool surface, no cart/checkout.

## Entities

```mermaid
classDiagram
direction TB

class InstrumentFamily {
  +uuid id
  +text slug
  +section section
  +text nameVi
  +text nameEn
}

class Brand {
  +uuid id
  +text slug
  +text name
}

class InstrumentModel {
  +uuid id
  +uuid brandId
  +uuid familyId
  +text modelCode
  +text displayName
  +levelTier levelTier
  +modelStatus status
  +timestamp lastVerifiedAt
  +uuid variantOfModelId
}

class PricePoint {
  +uuid modelId
  +priceScope scope
  +numeric amountMin
  +numeric amountMax
  +boolean isCurrent
}

class ModelImage {
  +uuid id
  +uuid modelId
  +text url
  +text altVi
  +text altEn
  +text credit
  +text licenseNote
  +boolean isPrimary
  +int sortOrder
}

class Source {
  +uuid id
  +uuid modelId
  +sourceKind kind
  +text url
  +text publisher
  +timestamp retrievedAt
  +boolean isPrimary
}

class ResolvedPrice {
  +priceScope scope
  +boolean isEstimate
  +numeric amountMin
  +numeric amountMax
}

class ListingFilters {
  +section section
  +text family
  +budgetBand budgetBand
  +text brand
}

class CatalogFacets {
  +{slug, nameVi}[] families
  +{slug, name}[] brands
}

class ListingItem {
  +uuid modelId
  +text displayName
  +text familySlug
  +text brandSlug
  +levelTier tier
  +ResolvedPrice price
  +ModelImage primaryImage
  +int variantCount
}

class ListingResult {
  +ListingItem[] items
  +int totalCount
}

class VariantSummary {
  +uuid modelId
  +text displayName
  +text distinguishingFeature
}

class InstrumentDetail {
  +status available
  +uuid modelId
  +text displayName
  +text familySlug
  +text brandSlug
  +levelTier tier
  +timestamp lastVerifiedAt
  +ResolvedPrice price
  +ModelImage[] images
  +Source source
  +VariantSummary[] variants
}

class InstrumentNotAvailable {
  +status not_available
}

class DetailResult {
  <<union>>
}

InstrumentModel "N" -- "1" InstrumentFamily : belongs to
InstrumentModel "N" -- "1" Brand : made by
InstrumentModel "1" -- "N" PricePoint : priced by
InstrumentModel "1" -- "N" ModelImage : illustrated by
InstrumentModel "1" -- "N" Source : verified by
InstrumentModel "0..N" -- "1" InstrumentModel : variantOf
ListingFilters --> ListingResult : queries
ListingResult --> ListingItem : contains
CatalogFacets --> ListingFilters : supplies options
InstrumentModel --> InstrumentDetail : projects to
PricePoint --> ResolvedPrice : resolves to
DetailResult --> InstrumentDetail : available
DetailResult --> InstrumentNotAvailable : not_available
```

**Conservative notes**: `InstrumentFamily`, `InstrumentModel`, and `PricePoint`
are reused exactly as already defined in `packages/db/src/schema/catalog.ts` and
`packages/schemas/src/catalog.ts` — no changes to their existing columns.
`Brand`, `ModelImage`, and `Source` are new tables; matching Valibot schemas
(`BrandSchema`, `ModelImageSchema`, `SourceSchema`) live next to the existing
catalog entity schemas in `packages/schemas/src/catalog.ts`. `Brand` and the
`InstrumentModel.brandId` FK are the minimum viable shape (`id`, `slug`, `name`)
needed to satisfy FR-002's brand filter — no additional brand attributes (logo,
description, etc.) are introduced since nothing in scope requires them.
`ResolvedPrice` is a Valibot schema plus `resolveDisplayPrice` /
`priceOverlapsBudget` / `BUDGET_BOUNDS` in `packages/schemas/src/pricing.ts`.
`ListingFilters`, `CatalogFacets`, `ListingItem`, `ListingResult`,
`VariantSummary`, `InstrumentDetail`, `InstrumentNotAvailable`, and
`DetailResult` are in-memory shapes in
`packages/schemas/src/catalog-browsing.ts` (not persisted). `ListingItem.price`
and `InstrumentDetail.price` are optional (`undefined` when no current price
resolves). `ListingItem.primaryImage` and `InstrumentDetail.source` are
nullable. `getInstrumentDetail` does not return a nested `InstrumentModel`; it
projects the published row onto the flattened `InstrumentDetail` fields.
`VariantSummary.distinguishingFeature` is filled from
`instrument_models.model_code` (no dedicated distinguishing-feature column).

## Approach

1. **Read/presentation layering, no new write paths**:
   - This feature is strictly SSR route loader → TanStack Start server function
     (`apps/consumer-application/src/lib/server/catalog.ts`) → `@windwise/db`
     query function → catalog tables → app modules composed from `@windwise/ui`
     primitives. It reuses 005/006's established layering (route → query/tool
     layer → schema-backed persistence) but drops the AI/session layer entirely
     — no `ConsultationSession` read or write anywhere in this feature's code
     path. Routes never import `@windwise/db` directly; they call
     `listInstrumentsFn` / `getInstrumentDetailFn` / `getCatalogFacetsFn`.
   - `@windwise/core` is untouched for scoring; filtering, variant grouping, and
     price resolution for browsing are query-layer concerns, not scoring
     concerns. `recommend.ts` still uses a local `selectPrice()` and only
     imports `BUDGET_BOUNDS` / `priceOverlapsBudget` from `@windwise/schemas`.

2. **Shared price resolution, promoted not duplicated**:
   - Promote the existing inline logic in `packages/core/src/recommend.ts`
     (`selectPrice` + `BUDGET_BOUNDS`) into `@windwise/schemas`
     (`packages/schemas/src/pricing.ts`):
     `resolveDisplayPrice(prices: PricePoint[]): ResolvedPrice | undefined` and
     `priceOverlapsBudget`. They live in `@windwise/schemas`, not
     `@windwise/db`, because `@windwise/core` (which owns `recommend.ts`)
     depends only on `@windwise/schemas` and must not take on a new dependency
     on `@windwise/db` — `@windwise/schemas` is the one package both `core` and
     `db` already depend on, and it already hosts pure logic functions (e.g.
     `missingRequiredCriteria` in `criteria.ts`), so this isn't a new pattern
     for that package. Used by this feature's listing filter and detail page.
     Adoption of `resolveDisplayPrice` inside `recommend.ts` remains out of
     scope (`selectPrice` stays local).
   - Preserve exact current behavior as the baseline (prefer
     `isCurrent && scope === 'vn_street'`, else first `isCurrent` row regardless
     of scope) and add the one piece that's missing today:
     `isEstimate = scope !== 'vn_street'`. No currency/fx conversion is
     introduced — existing code already compares `msrp_global` amounts directly
     against the same VND `BUDGET_BOUNDS`, so this task keeps that convention
     rather than inventing a new one.
   - `BUDGET_BOUNDS`
     (`under_20m: 0–20M, 20_50m: 20–50M, 50_100m: 50–100M, over_100m: 100M–∞`,
     VND) lives in `pricing.ts` and is re-exported from `recommend.ts` for
     backward compatibility — no new boundary values are invented.

3. **Variant grouping and status, enforced at the query layer**:
   - `list-published-instruments.ts` returns one row per base model
     (`variantOfModelId IS NULL`), with `variantCount` computed from published
     variant children — grouping happens in SQL/query code, never trusted to a
     component.
   - Business rule for the previously-open "variant status differs from base"
     edge case: a variant is included in a detail page's `variants` array only
     if that variant's own `status = 'published'` — the published-only rule
     (FR-007) applies per-row, including to variants, with no exception.

4. **Trust-signal completeness as a query-layer guarantee, not a UI
   convention**:
   - `ModelImage` rows require both `credit` and `license_note` at the schema
     level (`NOT NULL`). Listing/detail queries do not add a second
     credit/license `WHERE` clause; they rely on that constraint and still
     defensively pick the lowest `sortOrder` among `isPrimary = true` rows when
     more than one primary exists.
   - `get-instrument-detail.ts` selects exactly one `Source` per model
     (`isPrimary = true`, or the most recently `retrieved_at` row if none is
     flagged primary) — a detail page always has zero or one source link, not an
     unbounded list, keeping FR-004/SC-002 trivially verifiable. Zero source
     rows map to `source: null`.

5. **Not-available vs. not-found, explicit typed states**:
   - `getInstrumentDetail` always queries by ID regardless of `status`, then
     returns a discriminated union (`InstrumentDetail | InstrumentNotAvailable`)
     — the route component renders a distinct "Nhạc cụ này hiện không khả dụng"
     message for `status === 'not_available'`, never a generic 404, satisfying
     FR-008. Missing rows and unpublished rows are the same visitor-facing
     state.

6. **Filter state lives in the URL**:
   - `section`, `family`, `budgetBand`, `brand` are typed TanStack Router search
     params, not component state — shareable, bookmarkable, and crawlable,
     matching the platform's stated Zustand/Query boundary (server-shaped state
     never goes in Zustand). Unknown or empty values are dropped in
     `validateSearch` (treated as unset) rather than throwing.
   - Brand is a filter facet only in this task (query param on the listing
     route) — no dedicated `/catalog/brand/$brandSlug` route is introduced,
     since the spec requires brand filtering, not a dedicated brand landing
     page; this can be added later without breaking this task's shape if needed.
   - Family-scoped URLs (`/catalog/$familySlug`) lock the family from the path
     param; remaining filters stay as search params. Facet option lists come
     from `listCatalogFacets` loaded in parallel with the listing.

## Structure

### Inheritance Relationships

1. `ResolvedPrice` is a Valibot object schema in
   `packages/schemas/src/pricing.ts` (alongside the pure price helpers).
   `ListingFilters`, `CatalogFacets`, `ListingItem`, `ListingResult`,
   `VariantSummary`, `InstrumentDetail`, `InstrumentNotAvailable`, and
   `DetailResult` are Valibot object/union schemas in
   `packages/schemas/src/catalog-browsing.ts` — a dedicated browsing-contract
   file so persisted catalog entities stay in `catalog.ts`. `BudgetBandSchema`
   is an alias of `BudgetSchema` from `criteria.ts`.
2. `Brand`, `ModelImage`, `Source` are Drizzle `pgTable` definitions in
   `packages/db/src/schema/catalog.ts` (extended), following the exact
   column-naming and enum conventions already used there (`snake_case` DB
   columns, `camelCase` Drizzle keys). Matching Valibot schemas live in
   `packages/schemas/src/catalog.ts`.
3. `DetailResult` is a discriminated union of flattened `InstrumentDetail`
   (`status: 'available'` plus projected display fields) and
   `InstrumentNotAvailable` (`status: 'not_available'`) — not a nested
   `InstrumentModel` payload and not a class hierarchy. Matches the existing
   pattern of plain discriminated-union return shapes already used in this
   codebase (e.g. `RecommendationResult`/`NoMatchInfo` in `@windwise/schemas`).

### Dependencies

1. `apps/consumer-application/src/routes/catalog/index.tsx` and
   `$familySlug.tsx` call `listInstrumentsFn` and `getCatalogFacetsFn` (TanStack
   Start server functions in
   `apps/consumer-application/src/lib/server/catalog.ts`) via the route loader.
   Those functions call `listPublishedInstruments()`
   (`packages/db/src/queries/list-published-instruments.ts`) and
   `listCatalogFacets()` (`packages/db/src/queries/list-catalog-facets.ts`).
2. `apps/consumer-application/src/routes/instrument/$modelId.tsx` calls
   `getInstrumentDetailFn`, which calls `getInstrumentDetail()`
   (`packages/db/src/queries/get-instrument-detail.ts`).
3. Both listing and detail query functions call `resolveDisplayPrice()`
   (`packages/schemas/src/pricing.ts`). Listing also calls
   `priceOverlapsBudget()` for `budgetBand`. One shared price module, no
   duplicated price logic in the app.
4. Query functions depend on `packages/db/src/client.ts` (`Database` type) and
   the schema tables in `packages/db/src/schema/catalog.ts`, following the exact
   dependency shape already used by `get-model-by-id.ts` and `consultation.ts`
   in the same directory. New query functions are re-exported from
   `packages/db/src/index.ts`.
5. Presentation: `FilterBar` and `InstrumentCard` live in
   `apps/consumer-application/src/modules/catalog-page/`; `TrustSignals` and
   `VariantList` live in
   `apps/consumer-application/src/modules/instrument-detail-page/`. They are
   feature-specific composites, not primitives ported from Shadcn —
   `packages/ui/src/components/` is scoped to Shadcn-derived design-system
   primitives only (confirmed both by
   `packages/ui/src/tests/inventory.test.ts`'s `DOMAIN_BASENAME` naming guard,
   which independently blocks `instrument-card`, and by the broader rule that
   this package holds no app-composed components at all). The listing/detail
   modules compose `@windwise/ui`'s `Card`/`Badge`/`Button`/`Select`/`Field`
   primitives plus a new Shadcn `Breadcrumb` primitive
   (`packages/ui/src/components/breadcrumb.tsx`). App-level `AppBreadcrumb`
   (`apps/consumer-application/src/components/app-breadcrumb/`) wraps that
   primitive with TanStack Router `Link`s. Empty/not-available states reuse
   `UndrawIllustration` (`lookingForAnswers`). None of the catalog composites
   depend on DB or route internals — only `ListingItem` / `DetailResult` / facet
   option shapes.

### Layered Architecture

1. **Route Layer** (`apps/consumer-application/src/routes/catalog/`,
   `/instrument/`): SSR loaders parse typed search params, call server
   functions, and pass fully-resolved data to page modules — no business logic
   in routes themselves, matching 005/006's existing route-thinness convention.
   Catalog listing loaders fan out to two server functions (`listing` +
   `facets`) in parallel.
2. **Server-function Layer**
   (`apps/consumer-application/src/lib/server/catalog.ts`): `createServerFn`
   adapters with Valibot validators (`ListingFiltersSchema` for listing,
   `{ modelId }` for detail). Dynamic-import `@windwise/db` inside handlers so
   the client bundle does not pull the database client.
3. **Query Layer** (`packages/db/src/queries/`): filtering, variant grouping,
   trust-signal completeness enforcement, price resolution, facet lists, and the
   published/not-available discrimination all live here — this is where every
   business rule in this feature is actually enforced.
4. **Schema Layer** (`packages/db/src/schema/`, `packages/schemas/src/`):
   persisted table shapes and in-memory result shapes. Pure price helpers live
   in `pricing.ts` (same "pure functions in schemas" pattern as `criteria.ts`);
   browsing DTOs live in `catalog-browsing.ts`.
5. **Presentation Layer** (`packages/ui/src/components/`,
   `apps/consumer-application/src/modules/catalog-page/`,
   `.../instrument-detail-page/`, `.../components/app-breadcrumb/`): renders
   whatever the query layer already resolved — no re-deriving of price scope,
   variant membership, or published-status logic in components.
6. **Error/Empty-State Handling** (route + presentation layer, no server
   exception middleware in this stack): "zero results for this filter
   combination" and "instrument not available" are rendered states derived from
   typed loader results (`ListingResult.totalCount === 0`,
   `DetailResult.status === 'not_available'`), not thrown exceptions — this
   TanStack Start codebase has no global exception-handler layer; loader errors
   that do occur (DB unavailable, etc.) propagate to the framework's existing
   route error boundary, unchanged by this feature.

## Operations

### Create Schema — `Brand` (`packages/db/src/schema/catalog.ts`)

1. Responsibility: minimal queryable brand entity to support FR-002's brand
   filter and `ListingItem.brandSlug`/detail-page brand display.
2. Attributes:
   - `id`: uuid, primary key
   - `slug`: text, not null, unique
   - `name`: text, not null
3. Constraints: `instrumentModels.brandId` gains `.references(() => brands.id)`
   (currently a bare, unreferenced uuid column) — add the FK, do not change the
   column's type or nullability.
4. Migration: generate via the existing Drizzle migration workflow; seed data
   migration replaces the single hardcoded `SEED_BRAND_ID` constant in
   `packages/db/src/seed.ts` with a real seeded `brands` row using that same ID,
   so existing seeded `instrument_models` rows remain valid with no data
   rewrite. **Verified finding**: the plain `ALTER TABLE ... ADD CONSTRAINT`
   fails on any database that already has `instrument_models` rows (confirmed
   against this repo's local dev Postgres, which does) — `brand_id` values with
   no matching `brands` row violate the new FK immediately. The generated
   migration SQL (`packages/db/drizzle/0002_wakeful_prodigy.sql`) includes a
   backfill `INSERT INTO brands SELECT DISTINCT brand_id ...` (placeholder
   slug/name `brand-<first 8 of uuid>` / `Unknown brand`) for any `brand_id` not
   already present, run before the `ADD CONSTRAINT` statement, so the migration
   is safe on both a fresh database and one with existing catalog rows. Seed
   then inserts Yamaha (`SEED_BRAND_ID`, slug `yamaha`) via
   `onConflictDoNothing`.

### Create Schema — `ModelImage` (`packages/db/src/schema/catalog.ts`)

1. Responsibility: instrument photos with mandatory attribution, per FR-003.
2. Attributes:
   - `id`: uuid, primary key
   - `modelId`: uuid, not null, `.references(() => instrumentModels.id)`
   - `url`: text, not null
   - `altVi`, `altEn`: text, not null
   - `credit`, `licenseNote`: text, not null (DB-level `NOT NULL`, not just
     app-level validation — enforces the "never renders without credit" rule
     structurally)
   - `isPrimary`: boolean, not null, default false
   - `sortOrder`: integer, not null, default 0
3. Constraints: no more than one `isPrimary = true` row per `modelId` — enforce
   in the seed/authoring path (out of this feature's scope per Assumptions — 008
   owns authoring); this feature's queries must not assume the constraint is
   enforced and should defensively pick the lowest `sortOrder` among
   `isPrimary = true` rows if more than one exists.

### Create Schema — `Source` (`packages/db/src/schema/catalog.ts`)

1. Responsibility: structured provenance per model, replacing the current fake
   `sourceUrl` placeholder (`manufacturerSourceUrl()` in
   `packages/db/src/queries/get-model-by-id.ts`, which synthesizes a URL from
   `modelCode` rather than reading real data).
2. Attributes:
   - `id`: uuid, primary key
   - `modelId`: uuid, not null, `.references(() => instrumentModels.id)`
   - `kind`: enum
     `manufacturer | dealer | manual_pdf | editorial | expert_review`, not null
   - `url`: text, not null
   - `publisher`: text, not null
   - `retrievedAt`: timestamp with timezone, not null
   - `isPrimary`: boolean, not null, default false
3. Constraints: at least one `Source` row must exist per published model for
   SC-002 to hold — this feature does not enforce that invariant (it's an
   authoring-workflow concern, 008), but `get-instrument-detail.ts` must treat
   "zero source rows for a published model" as a defensive `source: null` case
   rather than throwing, so a data gap degrades the page instead of crashing it.
4. Scope note: `InstrumentModel.sourceUrl` (the existing
   `manufacturerSourceUrl()` placeholder in `get-model-by-id.ts`) is left
   untouched by this task — it is read by 005/006's result, compare, and upgrade
   pages, which is a blast radius well beyond catalog browsing. `Source` is
   purely additive: the detail page queries it directly and does not replace or
   interact with `sourceUrl` at all.

### Implement Pure Function — `resolveDisplayPrice`

(`packages/schemas/src/pricing.ts`, new)

1. Interface Definition:
   `resolveDisplayPrice(prices: PricePoint[]): ResolvedPrice | undefined` — pure
   function, no DB access, mirrors the existing `selectPrice()` shape in
   `packages/core/src/recommend.ts` so it is a drop-in replacement for that
   function's callers if/when 005 and 006 adopt it.
2. Core Method Logic:
   - Filter to `isCurrent === true` rows for the target model (callers pass
     already-model-scoped arrays, same contract as `getCurrentPricesForModels`
     in `get-model-by-id.ts`).
   - If a `vn_street` row exists among them, return it with `isEstimate: false`.
   - Else, return the first remaining row (there is at most `msrp_global` per
     existing seed data) with `isEstimate: true`.
   - If no current rows exist at all, return `undefined` — callers must treat
     this as "no price data," not as an error.
3. Exception Handling: none — this is a total, pure function; the "no price
   data" case is represented in the return type (`| undefined`), not thrown.
4. Export `BUDGET_BOUNDS` and `priceOverlapsBudget` alongside it
   (`BUDGET_BOUNDS` moved here from `packages/core/src/recommend.ts`,
   re-exported from `recommend.ts` for backward compatibility so 005's existing
   imports keep working unchanged) — single source of truth for the four VND
   band boundaries. Unit tests live in `packages/schemas/src/pricing.test.ts`.

### Implement Query Function — `listPublishedInstruments`

(`packages/db/src/queries/list-published-instruments.ts`, new)

1. Interface Definition:
   `listPublishedInstruments(db: Database, filters: ListingFilters): Promise<ListingResult>`
2. Core Method Logic:
   - Base predicate:
     `instrumentModels.status = 'published' AND variantOfModelId IS NULL` (base
     rows only, per FR-005/FR-007).
   - Apply `filters.section` (join `instrumentFamilies`, filter `section`),
     `filters.family` (filter `instrumentFamilies.slug`), `filters.brand` (join
     `brands`, filter `slug`) as optional `AND` predicates — omit a predicate
     entirely when its filter is unset, never an always-true placeholder
     condition.
   - For each matched base model, fetch current `PricePoint` rows, resolve via
     `resolveDisplayPrice()`, and apply `filters.budgetBand` as a
     post-resolution filter using `priceOverlapsBudget` / `BUDGET_BOUNDS` — a
     model with no resolvable price is excluded when a budget band filter is
     active (can't verify it's in-band), but still included in unfiltered
     listings (`price` may be `undefined`).
   - Fetch `ModelImage` rows for matched models in one batched query (`inArray`
     on matched model IDs), then pick primary in memory (`isPrimary = true`,
     lowest `sortOrder` tiebreak) — not N+1 per row.
   - Compute `variantCount` as a batched count of
     `variantOfModelId IN (matchedIds) AND status = 'published'` (unpublished
     variants don't count toward `variantCount`, consistent with the per-row
     published-only rule).
   - Return `{ items, totalCount: items.length }`. `primaryImage` is `null` when
     the model has no primary image.
3. Constraints: this function must produce zero N+1 queries for a page of
   listing results — batch all per-model lookups (price, image, variant count)
   by `inArray`, matching the plan's own flagged performance requirement.

### Implement Query Function — `getInstrumentDetail`

(`packages/db/src/queries/get-instrument-detail.ts`, new)

1. Interface Definition:
   `getInstrumentDetail(db: Database, modelId: string): Promise<DetailResult>`
2. Core Method Logic:
   - Query `instrumentModels` by `id` regardless of `status`, joining family and
     brand for `familySlug` / `brandSlug`.
   - If no row exists, or `status !== 'published'`, return
     `{ status: 'not_available' }` — do not distinguish "doesn't exist" from
     "not published" in the response shape (both are equally "not available" to
     the visitor; FR-008 only requires the state to be clear, not that it reveal
     which case it is).
   - Otherwise, resolve `ResolvedPrice` via `resolveDisplayPrice()` (optional),
     fetch all `ModelImage` rows (ordered by `sortOrder`), fetch the primary
     `Source` (or most-recent `retrievedAt` if none flagged primary, or `null`
     if none exist), and fetch `VariantSummary[]` for
     `variantOfModelId = modelId AND status = 'published'`.
     `distinguishingFeature` is `modelCode`.
   - Return flattened
     `{ status: 'available', modelId, displayName, familySlug, brandSlug, tier, lastVerifiedAt (ISO string), price, images, source, variants }`
     — not a nested `model` object.
3. Exception Handling: none beyond the typed `not_available` branch above — this
   function never throws for a data-shape reason; only genuine infrastructure
   failures (DB connection) propagate as real exceptions.

### Implement Query Function — `listCatalogFacets`

(`packages/db/src/queries/list-catalog-facets.ts`, new)

1. Interface Definition:
   `listCatalogFacets(db: Database): Promise<CatalogFacets>` where
   `CatalogFacets` is `CatalogFacetsSchema` in
   `packages/schemas/src/catalog-browsing.ts`.
2. Core Method Logic:
   - Select `{ slug, nameVi }` from `instrumentFamilies`.
   - Select `{ slug, name }` from `brands`.
   - Return `{ families, brands }` for FilterBar option lists. No published-only
     filter on facets (families/brands are catalog metadata; empty listing
     results are handled separately).

### Create Server Functions — Catalog adapters

(`apps/consumer-application/src/lib/server/catalog.ts`, new)

1. Responsibility: TanStack Start `createServerFn` boundary so route loaders do
   not import `@windwise/db` on the client.
2. Functions:
   - `listInstrumentsFn` (`GET`, validator `ListingFiltersSchema`) →
     `listPublishedInstruments(getDb(), data)`
   - `getInstrumentDetailFn` (`GET`, validator `{ modelId: string }`) →
     `getInstrumentDetail(getDb(), data.modelId)`
   - `getCatalogFacetsFn` (`GET`, no input) → `listCatalogFacets(getDb())`
3. Handlers dynamic-import `@windwise/db`.

### Create Route — Listing Page

(`apps/consumer-application/src/routes/catalog/index.tsx`, new)

1. Responsibility: SSR entry point for the unfiltered/filtered catalog listing.
2. Loader: `validateSearch` parses `section`, `family`, `budgetBand`, `brand`
   from search params; unknown enum values and empty strings are dropped
   (treated as unset). Call `listInstrumentsFn` and `getCatalogFacetsFn` in
   parallel; pass `{ listing, facets }` plus search to the page module.
3. Render: `apps/consumer-application/src/modules/catalog-page/` — grid of
   `InstrumentCard` (local:
   `apps/consumer-application/src/modules/catalog-page/instrument-card.tsx`)
   plus a `FilterBar` (local:
   `apps/consumer-application/src/modules/catalog-page/filter-bar.tsx`);
   `AppBreadcrumb` trail Home → Danh mục. When `totalCount === 0`, render an
   explicit empty state ("Không có nhạc cụ nào phù hợp") with
   `UndrawIllustration` `lookingForAnswers` (not an empty grid), consistent with
   005's existing empty-state pattern. Copy distinguishes "filters too tight" vs
   "catalog has no published instruments."

### Create Route — Family-Scoped Listing

(`apps/consumer-application/src/routes/catalog/$familySlug.tsx`, new)

1. Responsibility: SEO-friendly, family-scoped listing URL.
2. Loader: same as the listing page, with `family` pre-set from
   `params.familySlug` instead of a search param; other filters (`section`,
   `budgetBand`, `brand`) remain available as search params on top of the fixed
   family. Family is omitted from `validateSearch` on this route.
3. Render: reuses the same `catalog-page` module as the unfiltered listing —
   `lockedFamily` disables the family FilterBar control; breadcrumb is Home →
   Danh mục → family name. No separate component tree.

### Create Route — Instrument Detail Page

(`apps/consumer-application/src/routes/instrument/$modelId.tsx`, new)

1. Responsibility: canonical detail page for one base model.
2. Loader: call `getInstrumentDetailFn` with the route's `$modelId`.
3. Render: `apps/consumer-application/src/modules/instrument-detail-page/` —
   when `status === 'not_available'`, render a distinct "Nhạc cụ này hiện không
   khả dụng" message (never a generic not-found page); when
   `status === 'available'`, render specs, `ModelImage[]` gallery (credit and
   license in the figcaption), scoped price (with an estimate badge when
   `isEstimate === true`, or "Chưa có thông tin giá" when `price` is missing),
   `TrustSignals` (local:
   `apps/consumer-application/src/modules/instrument-detail-page/trust-signals.tsx`
   — last-verified date + source link), and `VariantList` (local:
   `apps/consumer-application/src/modules/instrument-detail-page/variant-list.tsx`).
   Breadcrumb: Home → Danh mục → familySlug → displayName. Variants link to
   `/instrument/$modelId`.

### Create Primitive — `Breadcrumb`

(`packages/ui/src/components/breadcrumb.tsx`, new)

1. Responsibility: Shadcn-style breadcrumb primitives (`Breadcrumb`,
   `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`,
   `BreadcrumbSeparator`, `BreadcrumbEllipsis`) with no Windwise domain
   knowledge. Inventory test lists `breadcrumb.tsx`. Navigation tests live in
   `packages/ui/src/tests/navigation.test.tsx`.
2. App wrapper: `AppBreadcrumb` in
   `apps/consumer-application/src/components/app-breadcrumb/` maps
   `{ label, to?, params? }` items onto those primitives with TanStack Router
   `Link` render props.

## Norms

1. **Query function shape**: every new `@windwise/db` query function takes
   `db: Database` as its first parameter and returns a plain typed value/union
   (never throws for expected "no data" cases) — exact convention already used
   by `get-model-by-id.ts` and `consultation.ts` in the same package.
2. **Batched lookups**: any per-model-ID lookup across a set of matched models
   (`inArray(...)`) — never a query inside a `.map()`/loop over listing results.
   This is the concrete rule that satisfies the plan's N+1 performance flag.
3. **Schema field naming**: DB columns `snake_case`, Drizzle/TypeScript keys
   `camelCase`, exactly matching `packages/db/src/schema/catalog.ts`'s existing
   tables — no deviation for the new `brands`/`model_images`/ `sources` tables.
4. **Valibot schema placement**: persisted catalog entities
   (`Brand`/`ModelImage`/`Source`) live in `packages/schemas/src/catalog.ts`;
   browsing DTOs
   (`ListingFilters`/`CatalogFacets`/`ListingItem`/`ListingResult`/
   `VariantSummary`/`InstrumentDetail`/`DetailResult`) live in
   `packages/schemas/src/catalog-browsing.ts`; price resolution lives in
   `packages/schemas/src/pricing.ts`. All three are re-exported from
   `packages/schemas/src/index.ts`.
5. **Route loader thinness**: loaders parse input and call server functions
   only; they must not contain filtering, grouping, or price-resolution logic
   inline — any such logic belongs in `packages/db/src/queries/`. Listing
   loaders may call two server functions in parallel (`listing` + `facets`).
6. **Empty/error states as data, not exceptions**: "zero results" and "not
   available" are represented as typed return values inspected by the component
   (`totalCount === 0`, `status === 'not_available'`), following this codebase's
   existing pattern (`RecommendationResult`/`NoMatchInfo`) — do not introduce
   throw-based control flow or a new global error-handling layer for these
   expected states.
7. **Testing**: unit tests for `resolveDisplayPrice` and `priceOverlapsBudget`
   live in `packages/schemas/src/pricing.test.ts`. Query-layer mapping and
   branching for `listPublishedInstruments`, `getInstrumentDetail`, and
   `listCatalogFacets` live in
   `packages/db/src/__tests__/catalog-browsing.test.ts` (queued Drizzle stand-in
   — SQL predicates stay in the query functions; published-only listing is still
   enforced by those predicates). Breadcrumb primitive coverage lives in
   `packages/ui/src/tests/navigation.test.tsx`.

## Safeguards

1. **Functional Constraints**: Only `instrument_models.status = 'published'`
   rows may appear on listing pages or in a detail page's primary model view;
   variants in a detail page's `variants[]` array are independently filtered to
   `status = 'published'` — no unpublished record reaches any rendered catalog
   page under any filter combination (FR-007/FR-008, SC-001).
2. **Performance Constraints**: `listPublishedInstruments` must issue a bounded
   number of queries independent of result-set size — one query for matched base
   models, and at most one batched (`inArray`) query each for prices, primary
   images, and variant counts; no per-row query loop.
3. **Data Constraints**: A `ModelImage` row with a null `credit` or
   `license_note` must never be selectable by any query in this feature
   (enforced by `NOT NULL` at the schema level); `resolveDisplayPrice` must mark
   `isEstimate: true` whenever the returned price's `scope !== 'vn_street'`,
   with no code path that displays a non-`vn_street` price as
   `isEstimate: false`.
4. **Business Rule Constraints**: Budget-band matching must use the shared
   `BUDGET_BOUNDS` table
   (`under_20m: 0–20M, 20_50m: 20–50M, 50_100m: 50–100M, over_100m: 100M–∞` VND)
   with the same overlap semantics as `priceOverlapsBudget` in
   `packages/schemas/src/pricing.ts` — no second, independently defined set of
   band boundaries anywhere in this feature (SC-004).
5. **Integration Constraints**: This feature must not read or write
   `consultation_sessions` or any 005/006 AI/tool state — a visitor with zero
   session history must see fully functional listing and detail pages (User
   Story 1's no-consultation-required boundary).
6. **API/Contract Constraints**: `ListingFilters` search params must be
   validated at the route `validateSearch` boundary (allowed `section` /
   `budgetBand` sets; empty/unknown values dropped). `listInstrumentsFn` also
   validates with `ListingFiltersSchema`. An invalid/unknown filter value must
   not crash the loader — treat it as if that filter were unset rather than
   throwing, consistent with a public, crawlable, sometimes malformed-URL-facing
   surface.
7. **Migration Constraints**: The `brands`, `model_images`, and `sources` tables
   are additive migrations only — no existing column in `instrument_models` or
   `price_points` changes type or nullability; the only existing-schema change
   is adding the `brandId → brands.id` foreign key reference. The FK addition
   includes a backfill `INSERT INTO brands ...` for unmatched `brand_id` values
   before `ADD CONSTRAINT` (`0002_wakeful_prodigy.sql`).
8. **Backward Compatibility Constraints**: `resolveDisplayPrice` must produce
   identical `price`/`scope` selection to the current `selectPrice()` in
   `packages/core/src/recommend.ts` for every existing test fixture — the only
   new behavior is the addition of the `isEstimate` field; 005's existing
   recommendation behavior must not change as a side effect of this task
   (`recommend.ts` is not required to switch over to the new function in this
   task — `BUDGET_BOUNDS` re-export is provided for compatibility, but
   `selectPrice` remains local).
9. **Scope Constraint**: No cart, checkout, pricing negotiation, or purchase
   action is introduced on any route created by this task, matching the spec's
   stated non-goal.
