import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import * as v from 'valibot';

import { CriteriaSchema, type PublicRecommendationItem } from '@windwise/schemas';

const ANON_COOKIE = 'ww_anon';

function ensureAnonId(): string {
  const existing = getCookie(ANON_COOKIE);
  if (existing) {
    return existing;
  }
  const anonId = crypto.randomUUID();
  setCookie(ANON_COOKIE, anonId, { httpOnly: true, sameSite: 'lax', path: '/' });
  return anonId;
}

export const startConsultation = createServerFn({ method: 'POST' }).handler(async () => {
  const { ENGINE_VERSION } = await import('@windwise/core');
  const { createSession, getDb, getPublishedQuestionSetId } = await import('@windwise/db');
  const db = getDb();
  const anonId = ensureAnonId();
  const questionSetId = await getPublishedQuestionSetId(db);
  const session = await createSession(db, {
    questionSetId,
    intent: 'discover',
    locale: 'vi',
    anonId,
  });
  return { sessionId: session.id, questionSetId, engineVersion: ENGINE_VERSION };
});

export const submitForm = createServerFn({ method: 'POST' })
  .validator(CriteriaSchema)
  .handler(async ({ data }) => {
    const { submitFormConsultation } = await import('@windwise/ai');
    const { createSession, getDb, getPublishedQuestionSetId } = await import('@windwise/db');
    const db = getDb();
    const anonId = ensureAnonId();
    const questionSetId = await getPublishedQuestionSetId(db);
    const session = await createSession(db, {
      questionSetId,
      intent: 'discover',
      locale: 'vi',
      anonId,
    });

    return submitFormConsultation(db, data, session.id);
  });

export const getSharedResult = createServerFn({ method: 'GET' })
  .validator(v.object({ runId: v.string() }))
  .handler(async ({ data }) => {
    const { getDb, getRun } = await import('@windwise/db');
    const loaded = await getRun(getDb(), data.runId);
    if (!loaded.run) {
      return { error: 'NOT_FOUND' as const };
    }
    return {
      runId: loaded.run.id,
      criteria: loaded.run.criteria,
      items: loaded.items,
      createdAt: loaded.run.createdAt.toISOString(),
      noMatch: loaded.run.noMatch,
    };
  });

export const getOtherOptions = createServerFn({ method: 'GET' })
  .validator(v.object({ runId: v.string(), afterRank: v.number() }))
  .handler(async ({ data }): Promise<PublicRecommendationItem[]> => {
    const { getDb, getRun } = await import('@windwise/db');
    const loaded = await getRun(getDb(), data.runId);
    return loaded.items.filter((item) => item.rank > data.afterRank);
  });

export const getSessionCriteria = createServerFn({ method: 'GET' })
  .validator(v.object({ sessionId: v.string() }))
  .handler(async ({ data }) => {
    const { answersToCriteria } = await import('@windwise/ai');
    const { getDb, getSessionState } = await import('@windwise/db');
    const { answers } = await getSessionState(getDb(), data.sessionId);
    return answersToCriteria(answers);
  });

export type SubmitFormResult = Awaited<ReturnType<typeof submitForm>>;
export type SharedResult = Awaited<ReturnType<typeof getSharedResult>>;
