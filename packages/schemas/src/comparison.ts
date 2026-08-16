import * as v from 'valibot';

import { LevelTierSchema, PricePointSchema } from './catalog.ts';
import { BudgetSchema, LevelSchema, PurposeSchema } from './criteria.ts';
import { PublicRecommendationItemSchema } from './recommendation.ts';

export const ComparisonAspectEnum = v.picklist(['tone', 'weight_response', 'projection', 'budget']);
export type ComparisonAspect = v.InferOutput<typeof ComparisonAspectEnum>;

export const NoteAspectEnum = v.picklist(['tone', 'weight_response', 'projection', 'general']);
export type NoteAspect = v.InferOutput<typeof NoteAspectEnum>;

export const CompareInput = v.object({
  sessionId: v.string(),
  modelIds: v.pipe(v.array(v.string()), v.minLength(2)),
  priority: v.optional(ComparisonAspectEnum),
});
export type CompareInput = v.InferOutput<typeof CompareInput>;

export const ComparedModelSchema = v.object({
  modelId: v.string(),
  specs: v.object({
    displayName: v.string(),
    modelCode: v.string(),
    familyId: v.string(),
    sourceUrl: v.string(),
  }),
  tier: LevelTierSchema,
  price: v.optional(PricePointSchema),
});
export type ComparedModel = v.InferOutput<typeof ComparedModelSchema>;

export const ComparisonNoteViewSchema = v.object({
  aspect: NoteAspectEnum,
  noteVi: v.string(),
  noteEn: v.string(),
});
export type ComparisonNoteView = v.InferOutput<typeof ComparisonNoteViewSchema>;

export const ComparisonResultSchema = v.object({
  models: v.array(ComparedModelSchema),
  notes: v.array(ComparisonNoteViewSchema),
  highlightedAspects: v.array(ComparisonAspectEnum),
});
export type ComparisonResult = v.InferOutput<typeof ComparisonResultSchema>;

export const UnconfirmedReferenceErrorSchema = v.object({
  error: v.literal('unconfirmed_reference'),
  modelId: v.string(),
});
export type UnconfirmedReferenceError = v.InferOutput<typeof UnconfirmedReferenceErrorSchema>;

export const CompareModelsOutputSchema = v.union([ComparisonResultSchema, UnconfirmedReferenceErrorSchema]);
export type CompareModelsOutput = v.InferOutput<typeof CompareModelsOutputSchema>;

export const ModelComparisonNoteSchema = v.object({
  id: v.string(),
  modelAId: v.string(),
  modelBId: v.string(),
  aspect: NoteAspectEnum,
  noteVi: v.string(),
  noteEn: v.string(),
  sourceUrl: v.string(),
  author: v.string(),
  reviewedBy: v.string(),
  publishedAt: v.optional(v.nullable(v.string())),
});
export type ModelComparisonNote = v.InferOutput<typeof ModelComparisonNoteSchema>;

export const UpgradeCriteriaSchema = v.object({
  sessionId: v.string(),
  currentModelId: v.string(),
  reason: v.string(),
  currentLevel: LevelSchema,
  purpose: PurposeSchema,
  upgradeBudget: BudgetSchema,
});
export type UpgradeCriteria = v.InferOutput<typeof UpgradeCriteriaSchema>;

export const FamilyTierFloorSchema = v.object({
  familyId: v.string(),
  minTier: LevelTierSchema,
  currentIsRecommendable: v.boolean(),
});
export type FamilyTierFloor = v.InferOutput<typeof FamilyTierFloorSchema>;

export const UpgradeRecommendationSchema = v.object({
  items: v.array(PublicRecommendationItemSchema),
  floor: FamilyTierFloorSchema,
  hasQualifyingCandidate: v.boolean(),
});
export type UpgradeRecommendation = v.InferOutput<typeof UpgradeRecommendationSchema>;

export const SuggestUpgradeOutputSchema = v.union([UpgradeRecommendationSchema, UnconfirmedReferenceErrorSchema]);
export type SuggestUpgradeOutput = v.InferOutput<typeof SuggestUpgradeOutputSchema>;
