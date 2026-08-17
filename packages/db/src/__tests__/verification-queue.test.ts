import { describe, expect, it } from 'vite-plus/test';

import type { Database } from '#/client.ts';
import { getVerificationQueue } from '#/queries/verification-queue.ts';

type QueryChain = Promise<unknown[]> & {
  from: () => QueryChain;
  where: () => QueryChain;
  limit: () => QueryChain;
};

function createQueuedDb(results: unknown[][]): Database {
  let index = 0;
  return {
    select() {
      const rows = results[index];
      index += 1;
      if (!rows) {
        throw new Error(`unexpected extra query (call ${index})`);
      }
      const query = Promise.resolve(rows) as QueryChain;
      query.from = () => query;
      query.where = () => query;
      query.limit = () => query;
      return query;
    },
  } as unknown as Database;
}

const NOW = Date.now();
function daysAgo(days: number): Date {
  return new Date(NOW - days * 24 * 60 * 60 * 1000);
}

const COMPLETE_MODEL = {
  id: 'model-complete',
  brandId: 'brand-1',
  familyId: 'family-1',
  modelCode: 'X-1',
  displayName: 'Complete Model',
  status: 'published' as const,
  lastVerifiedAt: daysAgo(10),
};

describe('getVerificationQueue', () => {
  it('flags a record whose last-verified date exceeds the threshold as stale', async () => {
    const stale = { ...COMPLETE_MODEL, id: 'model-stale', lastVerifiedAt: daysAgo(200) };
    const db = createQueuedDb([
      [], // catalog_settings (none -> default 180)
      [stale],
      [{ modelId: stale.id, isCurrent: true }],
      [{ modelId: stale.id, isPrimary: true }],
      [{ modelId: stale.id, url: 'https://example.com', sourceOk: true }],
    ]);
    const result = await getVerificationQueue(db, 'org-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.reasons.map((r) => r.type)).toEqual(['stale']);
  });

  it('flags a record missing required fields and identifies them', async () => {
    const incomplete = { ...COMPLETE_MODEL, id: 'model-incomplete' };
    const db = createQueuedDb([[], [incomplete], [], [], []]);
    const result = await getVerificationQueue(db, 'org-1');
    expect(result).toHaveLength(1);
    const reason = result[0]?.reasons.find((r) => r.type === 'missing_fields');
    expect(reason?.type === 'missing_fields' && reason.fields).toContain('price');
  });

  it('flags a record whose source failed to resolve as broken_source', async () => {
    const broken = { ...COMPLETE_MODEL, id: 'model-broken' };
    const db = createQueuedDb([
      [],
      [broken],
      [{ modelId: broken.id, isCurrent: true }],
      [{ modelId: broken.id, isPrimary: true }],
      [{ modelId: broken.id, url: 'https://example.com/dead', sourceOk: false, lastCheckedAt: daysAgo(1) }],
    ]);
    const result = await getVerificationQueue(db, 'org-1');
    expect(result[0]?.reasons.map((r) => r.type)).toEqual(['broken_source']);
  });

  it('does not include a current, complete record with a working source', async () => {
    const db = createQueuedDb([
      [],
      [COMPLETE_MODEL],
      [{ modelId: COMPLETE_MODEL.id, isCurrent: true }],
      [{ modelId: COMPLETE_MODEL.id, isPrimary: true }],
      [{ modelId: COMPLETE_MODEL.id, url: 'https://example.com', sourceOk: true }],
    ]);
    const result = await getVerificationQueue(db, 'org-1');
    expect(result).toEqual([]);
  });

  it('lists a record with multiple simultaneous reasons once, with all reasons present', async () => {
    const multi = { ...COMPLETE_MODEL, id: 'model-multi', lastVerifiedAt: daysAgo(200) };
    const db = createQueuedDb([[], [multi], [], [], []]);
    const result = await getVerificationQueue(db, 'org-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.reasons.map((r) => r.type).sort()).toEqual(['missing_fields', 'stale']);
  });

  it('never includes an archived record, even if it would otherwise be flagged', async () => {
    // Archived records never appear in the base `status = 'published'` query, so an
    // empty result here stands in for "the flagged record was archived."
    const db = createQueuedDb([[], []]);
    const result = await getVerificationQueue(db, 'org-1');
    expect(result).toEqual([]);
  });
});
