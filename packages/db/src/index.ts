export type { Database } from './client.ts';
export { createDb, createPostgresClient, getDb } from './client.ts';
export * from './schema/index.ts';
export * from './queries/consultation.ts';
export {
  seedDatabase,
  seedCatalogRows,
  SEED_QUESTION_SET_ID,
  SEED_RULE_SET_ID,
  SEED_FAMILY_IDS,
  SEED_MODEL_IDS,
  SEED_RULES,
} from './seed.ts';
