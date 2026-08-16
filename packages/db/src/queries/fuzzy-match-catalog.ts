import { eq } from 'drizzle-orm';

import type { RawCandidateRow } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { instrumentModels, modelAliases } from '#/schema/index.ts';

export function normalizeMentionText(rawText: string): string {
  return rawText
    .toLowerCase()
    .trim()
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 0; i < a.length; i += 1) {
    current[0] = i + 1;
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      current[j + 1] = Math.min((current[j] ?? 0) + 1, (previous[j + 1] ?? 0) + 1, (previous[j] ?? 0) + cost);
    }
    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j] ?? 0;
    }
  }

  return previous[b.length] ?? Math.max(a.length, b.length);
}

export function mentionSimilarity(query: string, candidate: string): number {
  const left = normalizeMentionText(query);
  const right = normalizeMentionText(candidate);
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  if (left === right) {
    return 1;
  }
  if (right.includes(left) || left.includes(right)) {
    return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  }
  return Math.max(0, 1 - levenshtein(left, right) / Math.max(left.length, right.length));
}

const SIMILARITY_FLOOR = 0.35;

export async function fuzzyMatchCatalog(db: Database, rawText: string): Promise<RawCandidateRow[]> {
  const normalizedQuery = normalizeMentionText(rawText);
  if (normalizedQuery.length === 0) {
    return [];
  }

  const aliasRows = await db
    .select({
      modelId: modelAliases.modelId,
      displayName: instrumentModels.displayName,
      matchedAlias: modelAliases.alias,
    })
    .from(modelAliases)
    .innerJoin(instrumentModels, eq(modelAliases.modelId, instrumentModels.id));

  const modelRows = await db
    .select({
      modelId: instrumentModels.id,
      displayName: instrumentModels.displayName,
    })
    .from(instrumentModels);

  const rows: RawCandidateRow[] = [];

  for (const row of aliasRows) {
    const similarity = mentionSimilarity(normalizedQuery, row.matchedAlias);
    if (similarity >= SIMILARITY_FLOOR) {
      rows.push({
        modelId: row.modelId,
        displayName: row.displayName,
        matchedAlias: row.matchedAlias,
        similarity,
      });
    }
  }

  for (const row of modelRows) {
    const similarity = mentionSimilarity(normalizedQuery, row.displayName);
    if (similarity >= SIMILARITY_FLOOR) {
      rows.push({
        modelId: row.modelId,
        displayName: row.displayName,
        matchedAlias: row.displayName,
        similarity,
      });
    }
  }

  return rows;
}
