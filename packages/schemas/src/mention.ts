import * as v from 'valibot';

export const MentionInput = v.object({
  sessionId: v.string(),
  rawText: v.pipe(v.string(), v.minLength(1)),
});
export type MentionInput = v.InferOutput<typeof MentionInput>;

export const MentionCandidateSchema = v.object({
  modelId: v.string(),
  displayName: v.string(),
  confidence: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
  matchedAlias: v.string(),
});
export type MentionCandidate = v.InferOutput<typeof MentionCandidateSchema>;

export const ConfirmInput = v.object({
  sessionId: v.string(),
  modelId: v.string(),
});
export type ConfirmInput = v.InferOutput<typeof ConfirmInput>;

export const ConfirmOutputSchema = v.object({
  confirmed: v.literal(true),
  modelId: v.string(),
});
export type ConfirmOutput = v.InferOutput<typeof ConfirmOutputSchema>;

export const RawCandidateRowSchema = v.object({
  modelId: v.string(),
  displayName: v.string(),
  matchedAlias: v.string(),
  similarity: v.number(),
});
export type RawCandidateRow = v.InferOutput<typeof RawCandidateRowSchema>;
