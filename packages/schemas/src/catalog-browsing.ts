import * as v from 'valibot';

import { LevelTierSchema, ModelImageSchema, SectionSchema, SourceSchema } from './catalog.ts';
import { BudgetSchema } from './criteria.ts';
import { ResolvedPriceSchema } from './pricing.ts';

export const BudgetBandSchema = BudgetSchema;
export type BudgetBand = v.InferOutput<typeof BudgetBandSchema>;

export const ListingFiltersSchema = v.object({
  section: v.optional(SectionSchema),
  family: v.optional(v.string()),
  budgetBand: v.optional(BudgetBandSchema),
  brand: v.optional(v.string()),
});
export type ListingFilters = v.InferOutput<typeof ListingFiltersSchema>;

export const CatalogFacetsSchema = v.object({
  families: v.array(v.object({ slug: v.string(), nameVi: v.string() })),
  brands: v.array(v.object({ slug: v.string(), name: v.string() })),
});
export type CatalogFacets = v.InferOutput<typeof CatalogFacetsSchema>;

export const ListingItemSchema = v.object({
  modelId: v.string(),
  displayName: v.string(),
  familySlug: v.string(),
  brandSlug: v.string(),
  tier: LevelTierSchema,
  price: v.optional(ResolvedPriceSchema),
  primaryImage: v.optional(v.nullable(ModelImageSchema)),
  variantCount: v.number(),
});
export type ListingItem = v.InferOutput<typeof ListingItemSchema>;

export const ListingResultSchema = v.object({
  items: v.array(ListingItemSchema),
  totalCount: v.number(),
});
export type ListingResult = v.InferOutput<typeof ListingResultSchema>;

export const VariantSummarySchema = v.object({
  modelId: v.string(),
  displayName: v.string(),
  distinguishingFeature: v.string(),
});
export type VariantSummary = v.InferOutput<typeof VariantSummarySchema>;

export const InstrumentDetailSchema = v.object({
  status: v.literal('available'),
  modelId: v.string(),
  displayName: v.string(),
  familySlug: v.string(),
  brandSlug: v.string(),
  tier: LevelTierSchema,
  lastVerifiedAt: v.string(),
  price: v.optional(ResolvedPriceSchema),
  images: v.array(ModelImageSchema),
  source: v.optional(v.nullable(SourceSchema)),
  variants: v.array(VariantSummarySchema),
});
export type InstrumentDetail = v.InferOutput<typeof InstrumentDetailSchema>;

export const InstrumentNotAvailableSchema = v.object({
  status: v.literal('not_available'),
});
export type InstrumentNotAvailable = v.InferOutput<typeof InstrumentNotAvailableSchema>;

export const DetailResultSchema = v.union([InstrumentDetailSchema, InstrumentNotAvailableSchema]);
export type DetailResult = v.InferOutput<typeof DetailResultSchema>;
