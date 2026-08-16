import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const modelStatusEnum = pgEnum('model_status', ['draft', 'in_review', 'published', 'archived']);
export const sectionEnum = pgEnum('instrument_section', ['brass', 'woodwind']);
export const levelTierEnum = pgEnum('level_tier', ['student', 'intermediate', 'professional', 'custom']);
export const priceScopeEnum = pgEnum('price_scope', ['msrp_global', 'vn_street']);
export const sourceKindEnum = pgEnum('source_kind', [
  'manufacturer',
  'dealer',
  'manual_pdf',
  'editorial',
  'expert_review',
]);

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

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
  brandId: uuid('brand_id')
    .notNull()
    .references(() => brands.id),
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

export const modelImages = pgTable('model_images', {
  id: uuid('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => instrumentModels.id),
  url: text('url').notNull(),
  altVi: text('alt_vi').notNull(),
  altEn: text('alt_en').notNull(),
  credit: text('credit').notNull(),
  licenseNote: text('license_note').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => instrumentModels.id),
  kind: sourceKindEnum('kind').notNull(),
  url: text('url').notNull(),
  publisher: text('publisher').notNull(),
  retrievedAt: timestamp('retrieved_at', { withTimezone: true }).notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
});
