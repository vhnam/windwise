import { sql } from 'drizzle-orm';
import { check, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { instrumentModels } from './catalog.ts';

export const comparisonNoteAspectEnum = pgEnum('comparison_note_aspect', [
  'tone',
  'weight_response',
  'projection',
  'general',
]);

export const modelComparisonNotes = pgTable(
  'model_comparison_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelAId: uuid('model_a_id')
      .notNull()
      .references(() => instrumentModels.id),
    modelBId: uuid('model_b_id')
      .notNull()
      .references(() => instrumentModels.id),
    aspect: comparisonNoteAspectEnum('aspect').notNull(),
    noteVi: text('note_vi').notNull(),
    noteEn: text('note_en').notNull(),
    sourceUrl: text('source_url').notNull(),
    author: text('author').notNull(),
    reviewedBy: text('reviewed_by').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [check('model_comparison_notes_pair_order', sql`${table.modelAId} < ${table.modelBId}`)],
);

export function normalizeModelPair(modelAId: string, modelBId: string): { modelAId: string; modelBId: string } {
  return modelAId < modelBId ? { modelAId, modelBId } : { modelAId: modelBId, modelBId: modelAId };
}
