import {
  compareModelsCore,
  resolveMention as rankMentions,
  suggestUpgrade as suggestUpgradeCore,
} from '@windwise/core';
import type { Database } from '@windwise/db';
import {
  confirmedModelIds,
  fuzzyMatchCatalog,
  getCurrentPricesForModels,
  getModelById,
  getModelsByIds,
  getPublishedCatalog,
  getPublishedRuleSet,
  getSessionState,
  listPublishedComparisonNotes,
  pinReferenceModel,
  saveAnswers,
} from '@windwise/db';
import {
  missingRequiredCriteria,
  type CollectAnswersOutput,
  type CompareInput,
  type CompareModelsOutput,
  type ConfirmInput,
  type ConfirmOutput,
  type Criteria,
  type MentionCandidate,
  type MentionInput,
  type RecommendationResult,
  type SuggestUpgradeOutput,
  type UpgradeCriteria,
} from '@windwise/schemas';

import { answersToCriteria, criteriaToAnswers, mergeCriteria } from '#/answers.ts';
import { DEFAULT_LLM_MODEL } from '#/constants.ts';
import { MissingRequiredCriteriaError } from '#/errors.ts';
import { heuristicNormalize, type CriteriaNormalizer } from '#/normalize.ts';
import { runRecommendation } from '#/run-recommendation.ts';
import {
  collectAnswersToolDef,
  compareModelsToolDef,
  confirmMentionToolDef,
  recommendInstrumentsToolDef,
  resolveMentionToolDef,
  suggestUpgradeToolDef,
} from '#/tool-defs.ts';

export async function collectAnswers(
  db: Database,
  input: { sessionId: string; message: string },
  normalize: CriteriaNormalizer = heuristicNormalize,
): Promise<CollectAnswersOutput> {
  const { session, answers } = await getSessionState(db, input.sessionId);
  if (!session) {
    throw new Error(`Unknown consultation session ${input.sessionId}`);
  }

  const mapped = await normalize(input.message);
  const current = answersToCriteria(answers);
  const merged = mergeCriteria(current, mapped);

  await saveAnswers(db, input.sessionId, criteriaToAnswers(input.sessionId, mapped, 'chat', input.message));

  return {
    criteria: merged,
    missingRequired: missingRequiredCriteria(merged),
  };
}

export async function recommendInstruments(
  db: Database,
  input: { sessionId: string },
  llmModel = DEFAULT_LLM_MODEL,
): Promise<RecommendationResult> {
  const { session, answers } = await getSessionState(db, input.sessionId);
  if (!session) {
    throw new Error(`Unknown consultation session ${input.sessionId}`);
  }

  const criteria = answersToCriteria(answers);
  const missing = missingRequiredCriteria(criteria);
  if (missing.length > 0) {
    throw new MissingRequiredCriteriaError(missing);
  }

  return runRecommendation(db, criteria as Criteria, input.sessionId, llmModel);
}

export async function resolveMention(db: Database, input: MentionInput): Promise<MentionCandidate[]> {
  const rawCandidates = await fuzzyMatchCatalog(db, input.rawText);
  return rankMentions(rawCandidates);
}

export async function confirmMention(db: Database, input: ConfirmInput): Promise<ConfirmOutput> {
  await pinReferenceModel(db, input.sessionId, input.modelId);
  return { confirmed: true, modelId: input.modelId };
}

export async function compareModels(db: Database, input: CompareInput): Promise<CompareModelsOutput> {
  const confirmed = await confirmedModelIds(db, input.sessionId);
  const unconfirmed = input.modelIds.find((modelId) => !confirmed.has(modelId));
  if (unconfirmed) {
    return { error: 'unconfirmed_reference', modelId: unconfirmed };
  }

  const models = await getModelsByIds(db, input.modelIds);
  const prices = await getCurrentPricesForModels(db, input.modelIds);
  const notes = await listPublishedComparisonNotes(db, input.modelIds);
  return compareModelsCore(models, prices, notes, input.priority);
}

export async function suggestUpgrade(db: Database, input: UpgradeCriteria): Promise<SuggestUpgradeOutput> {
  const confirmed = await confirmedModelIds(db, input.sessionId);
  if (!confirmed.has(input.currentModelId)) {
    return { error: 'unconfirmed_reference', modelId: input.currentModelId };
  }

  const currentModel = await getModelById(db, input.currentModelId);
  if (!currentModel) {
    return { error: 'unconfirmed_reference', modelId: input.currentModelId };
  }

  const catalog = await getPublishedCatalog(db);
  const ruleSet = await getPublishedRuleSet(db);
  return suggestUpgradeCore(currentModel, input, catalog, ruleSet);
}

export function createConsultationTools(db: Database, defaultSessionId?: string) {
  return [
    collectAnswersToolDef.server(async (input) =>
      collectAnswers(db, { ...input, sessionId: input.sessionId || defaultSessionId || '' }),
    ),
    recommendInstrumentsToolDef.server(async (input) =>
      recommendInstruments(db, { sessionId: input.sessionId || defaultSessionId || '' }),
    ),
    resolveMentionToolDef.server(async (input) =>
      resolveMention(db, { ...input, sessionId: input.sessionId || defaultSessionId || '' }),
    ),
    confirmMentionToolDef.server(async (input) =>
      confirmMention(db, { ...input, sessionId: input.sessionId || defaultSessionId || '' }),
    ),
    compareModelsToolDef.server(async (input) =>
      compareModels(db, { ...input, sessionId: input.sessionId || defaultSessionId || '' }),
    ),
    suggestUpgradeToolDef.server(async (input) =>
      suggestUpgrade(db, { ...input, sessionId: input.sessionId || defaultSessionId || '' }),
    ),
  ];
}

export {
  collectAnswersToolDef,
  compareModelsToolDef,
  confirmMentionToolDef,
  recommendInstrumentsToolDef,
  resolveMentionToolDef,
  suggestUpgradeToolDef,
};
