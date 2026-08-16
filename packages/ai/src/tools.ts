import type { Database } from '@windwise/db';
import { getSessionState, saveAnswers } from '@windwise/db';
import {
  missingRequiredCriteria,
  type CollectAnswersOutput,
  type Criteria,
  type RecommendationResult,
} from '@windwise/schemas';

import { answersToCriteria, criteriaToAnswers, mergeCriteria } from '#/answers.ts';
import { DEFAULT_LLM_MODEL } from '#/constants.ts';
import { MissingRequiredCriteriaError } from '#/errors.ts';
import { heuristicNormalize, type CriteriaNormalizer } from '#/normalize.ts';
import { runRecommendation } from '#/run-recommendation.ts';
import { collectAnswersToolDef, recommendInstrumentsToolDef } from '#/tool-defs.ts';

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

export function createConsultationTools(db: Database, defaultSessionId?: string) {
  return [
    collectAnswersToolDef.server(async (input) =>
      collectAnswers(db, { ...input, sessionId: input.sessionId || defaultSessionId || '' }),
    ),
    recommendInstrumentsToolDef.server(async (input) =>
      recommendInstruments(db, { sessionId: input.sessionId || defaultSessionId || '' }),
    ),
  ];
}

export { collectAnswersToolDef, recommendInstrumentsToolDef };
