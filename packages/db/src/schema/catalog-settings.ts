import { integer, pgTable, uuid } from 'drizzle-orm/pg-core';

export const catalogSettings = pgTable('catalog_settings', {
  organizationId: uuid('organization_id').primaryKey(),
  stalenessThresholdDays: integer('staleness_threshold_days').notNull().default(180),
});
