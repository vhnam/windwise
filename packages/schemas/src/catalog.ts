import * as v from 'valibot';

export const SectionFilters = ['brass', 'woodwind'] as const;
export const SectionSchema = v.picklist(SectionFilters);
export type Section = v.InferOutput<typeof SectionSchema>;

export const LevelTierFilters = ['student', 'intermediate', 'professional', 'custom'] as const;
export const LevelTierSchema = v.picklist(LevelTierFilters);
export type LevelTier = v.InferOutput<typeof LevelTierSchema>;

export const STATUS_FILTERS = ['draft', 'in_review', 'published', 'archived'] as const;
export const ModelStatusSchema = v.picklist(STATUS_FILTERS);
export type ModelStatus = v.InferOutput<typeof ModelStatusSchema>;

export const PriceScopeFilters = ['msrp_global', 'vn_street'] as const;
export const PriceScopeSchema = v.picklist(PriceScopeFilters);
export type PriceScope = v.InferOutput<typeof PriceScopeSchema>;

export const SourceKindFilters = ['manufacturer', 'dealer', 'manual_pdf', 'editorial', 'expert_review'] as const;
export const SourceKindSchema = v.picklist(SourceKindFilters);
export type SourceKind = v.InferOutput<typeof SourceKindSchema>;

export const BrandSchema = v.object({
  id: v.string(),
  slug: v.string(),
  name: v.string(),
});
export type Brand = v.InferOutput<typeof BrandSchema>;

export const InstrumentFamilySchema = v.object({
  id: v.string(),
  slug: v.string(),
  section: SectionSchema,
  nameVi: v.string(),
  nameEn: v.string(),
  beginnerDifficulty: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
  minRecommendedAge: v.pipe(v.number(), v.integer()),
  physicalDemand: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
  typicalEnsembles: v.array(v.string()),
});
export type InstrumentFamily = v.InferOutput<typeof InstrumentFamilySchema>;

export const InstrumentModelSchema = v.object({
  id: v.string(),
  brandId: v.string(),
  familyId: v.string(),
  modelCode: v.string(),
  displayName: v.string(),
  levelTier: LevelTierSchema,
  status: ModelStatusSchema,
  lastVerifiedAt: v.string(),
  variantOfModelId: v.optional(v.nullable(v.string())),
  sourceUrl: v.string(),
});
export type InstrumentModel = v.InferOutput<typeof InstrumentModelSchema>;

export const PricePointSchema = v.object({
  modelId: v.string(),
  scope: PriceScopeSchema,
  amountMin: v.number(),
  amountMax: v.number(),
  isCurrent: v.boolean(),
});
export type PricePoint = v.InferOutput<typeof PricePointSchema>;

export const CatalogSnapshotSchema = v.object({
  families: v.array(InstrumentFamilySchema),
  models: v.array(InstrumentModelSchema),
  prices: v.array(PricePointSchema),
});
export type CatalogSnapshot = v.InferOutput<typeof CatalogSnapshotSchema>;

export const ModelImageSchema = v.object({
  id: v.string(),
  modelId: v.string(),
  url: v.string(),
  altVi: v.string(),
  altEn: v.string(),
  credit: v.string(),
  licenseNote: v.string(),
  isPrimary: v.boolean(),
  sortOrder: v.number(),
});
export type ModelImage = v.InferOutput<typeof ModelImageSchema>;

export const SourceSchema = v.object({
  id: v.string(),
  modelId: v.string(),
  kind: SourceKindSchema,
  url: v.string(),
  publisher: v.string(),
  retrievedAt: v.string(),
  isPrimary: v.boolean(),
});
export type Source = v.InferOutput<typeof SourceSchema>;
