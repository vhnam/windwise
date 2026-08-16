import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { instrumentModels } from './catalog.ts';

export const modelAliases = pgTable(
  'model_aliases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => instrumentModels.id),
    alias: text('alias').notNull(),
    locale: text('locale').notNull(),
  },
  (table) => [uniqueIndex('model_aliases_alias_locale_uidx').on(table.alias, table.locale)],
);
