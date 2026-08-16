import type { MentionCandidate, RawCandidateRow } from '@windwise/schemas';

const CANDIDATE_CAP = 5;

export function resolveMention(rawCandidates: RawCandidateRow[]): MentionCandidate[] {
  const bestByModel = new Map<string, RawCandidateRow>();

  for (const row of rawCandidates) {
    const confidence = Math.min(1, Math.max(0, row.similarity));
    const normalized: RawCandidateRow = { ...row, similarity: confidence };
    const existing = bestByModel.get(row.modelId);
    if (!existing || normalized.similarity > existing.similarity) {
      bestByModel.set(row.modelId, normalized);
      continue;
    }
    if (
      normalized.similarity === existing.similarity &&
      (normalized.matchedAlias.localeCompare(existing.matchedAlias) < 0 ||
        (normalized.matchedAlias === existing.matchedAlias &&
          normalized.displayName.localeCompare(existing.displayName) < 0))
    ) {
      bestByModel.set(row.modelId, normalized);
    }
  }

  return [...bestByModel.values()]
    .sort((left, right) => {
      if (right.similarity !== left.similarity) {
        return right.similarity - left.similarity;
      }
      return left.modelId.localeCompare(right.modelId);
    })
    .slice(0, CANDIDATE_CAP)
    .map((row) => ({
      modelId: row.modelId,
      displayName: row.displayName,
      confidence: row.similarity,
      matchedAlias: row.matchedAlias,
    }));
}
