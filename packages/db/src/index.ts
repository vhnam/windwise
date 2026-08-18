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
export { canTransition } from './auth/can-transition.ts';
export { computeDataCompleteness, computeMissingFields, getRequiredFields } from './auth/required-fields.ts';
export { writeAuditEntry } from './auth/write-audit-entry.ts';
export type { CreateInstrumentModelInput, EditInstrumentModelPatch } from './queries/catalog-write.ts';
export {
  archiveInstrumentModel,
  createInstrumentModel,
  editInstrumentModel,
  transitionInstrumentModel,
} from './queries/catalog-write.ts';
export { getVerificationQueue } from './queries/verification-queue.ts';
export { getAuditTrail } from './queries/audit-trail.ts';
export { getCatalogSettings, updateCatalogSettings } from './queries/catalog-settings.ts';
export { listOrganizationMembers, updateOrganizationMemberRole } from './queries/organization-members.ts';
export { addComment, listComments } from './queries/comments.ts';
export { checkSourceLiveness } from './jobs/check-source-liveness.ts';
export {
  seedDatabase,
  seedCatalogRows,
  seedAdminAccount,
  SEED_QUESTION_SET_ID,
  SEED_RULE_SET_ID,
  SEED_FAMILY_IDS,
  SEED_MODEL_IDS,
  SEED_RULES,
  SEED_ADMIN_USER_ID,
  SEED_ADMIN_EMAIL,
  SEED_ORGANIZATION_ID,
  SEED_ORGANIZATION_SLUG,
} from './seed.ts';
