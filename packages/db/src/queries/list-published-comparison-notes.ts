import { and, inArray, isNotNull } from 'drizzle-orm';

import type { ModelComparisonNote } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { modelComparisonNotes } from '#/schema/index.ts';

export async function listPublishedComparisonNotes(db: Database, modelIds: string[]): Promise<ModelComparisonNote[]> {
  if (modelIds.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(modelComparisonNotes)
    .where(
      and(
        isNotNull(modelComparisonNotes.publishedAt),
        inArray(modelComparisonNotes.modelAId, modelIds),
        inArray(modelComparisonNotes.modelBId, modelIds),
      ),
    );

  return rows.map((row) => ({
    id: row.id,
    modelAId: row.modelAId,
    modelBId: row.modelBId,
    aspect: row.aspect,
    noteVi: row.noteVi,
    noteEn: row.noteEn,
    sourceUrl: row.sourceUrl,
    author: row.author,
    reviewedBy: row.reviewedBy,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }));
}
