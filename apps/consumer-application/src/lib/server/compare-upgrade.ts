import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import * as v from 'valibot';

import { CompareInput, ConfirmInput, MentionInput, UpgradeCriteriaSchema } from '@windwise/schemas';

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

export const startIntentSession = createServerFn({ method: 'POST' })
  .validator(v.object({ intent: v.picklist(['compare', 'upgrade']) }))
  .handler(async ({ data }) => {
    const { ENGINE_VERSION } = await import('@windwise/core');
    const { createSession, getDb, getPublishedQuestionSetId } = await import('@windwise/db');
    const db = getDb();
    const session = await createSession(db, {
      questionSetId: await getPublishedQuestionSetId(db),
      intent: data.intent,
      locale: 'vi',
      anonId: ensureAnonId(),
    });
    return { sessionId: session.id, engineVersion: ENGINE_VERSION };
  });

export const resolveMentionFn = createServerFn({ method: 'POST' })
  .validator(MentionInput)
  .handler(async ({ data }) => {
    const { resolveMention } = await import('@windwise/ai');
    const { getDb } = await import('@windwise/db');
    return resolveMention(getDb(), data);
  });

export const confirmMentionFn = createServerFn({ method: 'POST' })
  .validator(ConfirmInput)
  .handler(async ({ data }) => {
    const { confirmMention } = await import('@windwise/ai');
    const { getDb } = await import('@windwise/db');
    return confirmMention(getDb(), data);
  });

export const compareModelsFn = createServerFn({ method: 'POST' })
  .validator(CompareInput)
  .handler(async ({ data }) => {
    const { compareModels } = await import('@windwise/ai');
    const { getDb } = await import('@windwise/db');
    return compareModels(getDb(), data);
  });

export const suggestUpgradeFn = createServerFn({ method: 'POST' })
  .validator(UpgradeCriteriaSchema)
  .handler(async ({ data }) => {
    const { suggestUpgrade } = await import('@windwise/ai');
    const { getDb } = await import('@windwise/db');
    return suggestUpgrade(getDb(), data);
  });
