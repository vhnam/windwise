import { describe, expect, it, vi } from 'vite-plus/test';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgres://postgres:postgres@127.0.0.1:5432/windwise';
});

import { confirmedModelIds } from '@windwise/db';

import { compareModels, suggestUpgrade } from '../tools.ts';

function dbReturningConfirmed(modelIds: string[]) {
  return {
    select() {
      return {
        from() {
          return {
            async where() {
              return modelIds.map((modelId) => ({ modelId }));
            },
          };
        },
      };
    },
  } as never;
}

describe('confirmation gate', () => {
  it('refuses compareModels when a modelId is absent from confirmed_references', async () => {
    const db = dbReturningConfirmed(['confirmed-a']);
    const confirmed = await confirmedModelIds(db, 'session-1');
    expect(confirmed.has('unconfirmed-b')).toBe(false);

    const result = await compareModels(db, {
      sessionId: 'session-1',
      modelIds: ['confirmed-a', 'unconfirmed-b'],
    });

    expect(result).toEqual({ error: 'unconfirmed_reference', modelId: 'unconfirmed-b' });
  });

  it('refuses suggestUpgrade when currentModelId is absent from confirmed_references', async () => {
    const db = dbReturningConfirmed([]);

    const result = await suggestUpgrade(db, {
      sessionId: 'session-1',
      currentModelId: 'unconfirmed-current',
      reason: 'want a step up',
      currentLevel: 'intermediate',
      purpose: 'orchestra',
      upgradeBudget: '50_100m',
    });

    expect(result).toEqual({ error: 'unconfirmed_reference', modelId: 'unconfirmed-current' });
  });
});
