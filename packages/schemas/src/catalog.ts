import * as v from 'valibot';

export const SectionSchema = v.picklist(['brass', 'woodwind']);
export type Section = v.InferOutput<typeof SectionSchema>;

export const LevelTierSchema = v.picklist(['student', 'intermediate', 'professional', 'custom']);
export type LevelTier = v.InferOutput<typeof LevelTierSchema>;

export const ModelStatusSchema = v.picklist(['draft', 'in_review', 'published', 'archived']);
export type ModelStatus = v.InferOutput<typeof ModelStatusSchema>;

export const PriceScopeSchema = v.picklist(['msrp_global', 'vn_street']);
export type PriceScope = v.InferOutput<typeof PriceScopeSchema>;

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
