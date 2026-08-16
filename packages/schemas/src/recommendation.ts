import * as v from 'valibot';

import { PriceScopeSchema } from './catalog.ts';
import { PartialCriteriaSchema } from './criteria.ts';

export const ScoreBreakdownSchema = v.object({
  base: v.number(),
  adjustments: v.array(
    v.object({
      reasonKey: v.string(),
      delta: v.number(),
    }),
  ),
  lastVerifiedAt: v.string(),
  sourceUrl: v.string(),
  price: v.object({
    scope: PriceScopeSchema,
    amountMin: v.number(),
    amountMax: v.number(),
  }),
  familySlug: v.string(),
  familyNameVi: v.string(),
  familyNameEn: v.string(),
  modelCode: v.string(),
  displayName: v.string(),
});
export type ScoreBreakdown = v.InferOutput<typeof ScoreBreakdownSchema>;

export const ExclusionInfoSchema = v.object({
  reasonKey: v.string(),
});
export type ExclusionInfo = v.InferOutput<typeof ExclusionInfoSchema>;

export const RecommendationItemSchema = v.object({
  rank: v.number(),
  familyId: v.string(),
  modelId: v.string(),
  score: v.number(),
  scoreBreakdown: ScoreBreakdownSchema,
  reasons: v.array(v.string()),
  excludedBy: v.optional(ExclusionInfoSchema),
});
export type RecommendationItem = v.InferOutput<typeof RecommendationItemSchema>;

export const PublicRecommendationItemSchema = v.omit(RecommendationItemSchema, ['excludedBy']);
export type PublicRecommendationItem = v.InferOutput<typeof PublicRecommendationItemSchema>;

export const NoMatchInfoSchema = v.object({
  limitingConstraint: v.string(),
  suggestion: v.string(),
});
export type NoMatchInfo = v.InferOutput<typeof NoMatchInfoSchema>;

export const RecommendationResultSchema = v.object({
  runId: v.string(),
  items: v.array(PublicRecommendationItemSchema),
  noMatch: v.optional(NoMatchInfoSchema),
});
export type RecommendationResult = v.InferOutput<typeof RecommendationResultSchema>;

export const CollectAnswersInputSchema = v.object({
  sessionId: v.string(),
  message: v.string(),
});
export type CollectAnswersInput = v.InferOutput<typeof CollectAnswersInputSchema>;

export const CollectAnswersOutputSchema = v.object({
  criteria: PartialCriteriaSchema,
  missingRequired: v.array(v.string()),
});
export type CollectAnswersOutput = v.InferOutput<typeof CollectAnswersOutputSchema>;

export const RecommendInstrumentsInputSchema = v.object({
  sessionId: v.string(),
});
export type RecommendInstrumentsInput = v.InferOutput<typeof RecommendInstrumentsInputSchema>;

export const VersionPinsSchema = v.object({
  ruleSetId: v.string(),
  questionSetId: v.string(),
  promptVersionId: v.string(),
  engineVersion: v.string(),
  llmModel: v.string(),
  latencyMs: v.number(),
});
export type VersionPins = v.InferOutput<typeof VersionPinsSchema>;
