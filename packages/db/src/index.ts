export type { Database } from './client.ts';
export { createDb, createPostgresClient, getDb } from './client.ts';
export * from './schema/index.ts';
export * from './queries/consultation.ts';
export { fuzzyMatchCatalog, normalizeMentionText, mentionSimilarity } from './queries/fuzzy-match-catalog.ts';
export { getModelById, getModelsByIds, getCurrentPricesForModels } from './queries/get-model-by-id.ts';
export { pinReferenceModel } from './queries/pin-reference-model.ts';
export { confirmedModelIds } from './queries/confirmed-model-ids.ts';
export { listPublishedComparisonNotes } from './queries/list-published-comparison-notes.ts';
export { listPublishedInstruments } from './queries/list-published-instruments.ts';
export { getInstrumentDetail } from './queries/get-instrument-detail.ts';
export { listCatalogFacets } from './queries/list-catalog-facets.ts';
export {
  seedDatabase,
  seedCatalogRows,
  SEED_QUESTION_SET_ID,
  SEED_RULE_SET_ID,
  SEED_FAMILY_IDS,
  SEED_MODEL_IDS,
  SEED_RULES,
} from './seed.ts';
