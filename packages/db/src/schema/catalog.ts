import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const modelStatusEnum = pgEnum('model_status', ['draft', 'in_review', 'published', 'archived']);
export const sectionEnum = pgEnum('instrument_section', ['brass', 'woodwind']);
export const levelTierEnum = pgEnum('level_tier', ['student', 'intermediate', 'professional', 'custom']);
export const priceScopeEnum = pgEnum('price_scope', ['msrp_global', 'vn_street']);

export const instrumentFamilies = pgTable('instrument_families', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  section: sectionEnum('section').notNull(),
  nameVi: text('name_vi').notNull(),
  nameEn: text('name_en').notNull(),
  beginnerDifficulty: integer('beginner_difficulty').notNull(),
  minRecommendedAge: integer('min_recommended_age').notNull(),
  physicalDemand: integer('physical_demand').notNull(),
  typicalEnsembles: text('typical_ensembles').array().notNull(),
});

export const instrumentModels = pgTable('instrument_models', {
  id: uuid('id').primaryKey(),
  brandId: uuid('brand_id').notNull(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => instrumentFamilies.id),
  modelCode: text('model_code').notNull(),
  displayName: text('display_name').notNull(),
  levelTier: levelTierEnum('level_tier').notNull(),
  status: modelStatusEnum('status').notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).notNull(),
  variantOfModelId: uuid('variant_of_model_id'),
});

export const pricePoints = pgTable('price_points', {
  id: uuid('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => instrumentModels.id),
  scope: priceScopeEnum('scope').notNull(),
  amountMin: numeric('amount_min').notNull(),
  amountMax: numeric('amount_max').notNull(),
  isCurrent: boolean('is_current').notNull(),
});
