import * as v from 'valibot';

import { ENGINE_VERSION, recommend, toPublicSlice } from '@windwise/core';
import type { Database } from '@windwise/db';
import { getPublishedCatalog, getPublishedRuleSet, getSessionState, persistRun, saveAnswers } from '@windwise/db';
import { CriteriaSchema, missingRequiredCriteria, type Criteria, type RecommendationResult } from '@windwise/schemas';

import { criteriaToAnswers } from '#/answers.ts';
import { DEFAULT_LLM_MODEL, FORM_LLM_MODEL_PIN, PROMPT_VERSION_ID, PUBLIC_RESULT_LIMIT } from '#/constants.ts';
import { MissingRequiredCriteriaError } from '#/errors.ts';

export async function runRecommendation(
  db: Database,
  criteriaInput: Criteria,
  sessionId: string,
  llmModel = DEFAULT_LLM_MODEL,
): Promise<RecommendationResult> {
  const criteria = v.parse(CriteriaSchema, criteriaInput);
  const missing = missingRequiredCriteria(criteria);
  if (missing.length > 0) {
    throw new MissingRequiredCriteriaError(missing);
  }

  const { session } = await getSessionState(db, sessionId);
  if (!session) {
    throw new Error(`Unknown consultation session ${sessionId}`);
  }

  const catalog = await getPublishedCatalog(db);
  const ruleSet = await getPublishedRuleSet(db);
  const started = Date.now();
  const fullResult = recommend(criteria, catalog, ruleSet);
  const latencyMs = Math.max(0, Date.now() - started);

  const { runId } = await persistRun(db, fullResult, {
    sessionId,
    criteria,
    ruleSetId: ruleSet.ruleSetId,
    questionSetId: session.questionSetId,
    promptVersionId: PROMPT_VERSION_ID,
    engineVersion: ENGINE_VERSION,
    llmModel,
    latencyMs,
  });

  return toPublicSlice({ ...fullResult, runId }, PUBLIC_RESULT_LIMIT);
}

export async function submitFormConsultation(
  db: Database,
  criteria: Criteria,
  sessionId: string,
): Promise<RecommendationResult> {
  await saveAnswers(db, sessionId, criteriaToAnswers(sessionId, criteria, 'form'));
  return runRecommendation(db, criteria, sessionId, FORM_LLM_MODEL_PIN);
}
