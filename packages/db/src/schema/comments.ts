import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { instrumentModels } from './catalog.ts';

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => instrumentModels.id),
  authorUserId: uuid('author_user_id').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
