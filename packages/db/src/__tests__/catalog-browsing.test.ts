import { describe, expect, it } from 'vite-plus/test';

import type { Database } from '#/client.ts';
import { getInstrumentDetail } from '#/queries/get-instrument-detail.ts';
import { listCatalogFacets } from '#/queries/list-catalog-facets.ts';
import { listPublishedInstruments } from '#/queries/list-published-instruments.ts';

type QueryChain = Promise<unknown[]> & {
  from: () => QueryChain;
  innerJoin: () => QueryChain;
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
      query.innerJoin = () => query;
      query.where = () => query;
      query.limit = () => query;
      return query;
    },
  } as unknown as Database;
}

const BASE_MODEL = {
  modelId: 'model-base',
  displayName: 'Yamaha YAS-280',
  familySlug: 'alto-sax',
  brandSlug: 'yamaha',
  tier: 'student' as const,
};

function streetPrice(modelId: string, min = 12_000_000, max = 16_000_000) {
  return {
    id: `price-${modelId}-street`,
    modelId,
    scope: 'vn_street' as const,
    amountMin: String(min),
    amountMax: String(max),
    isCurrent: true,
  };
}

function msrpPrice(modelId: string) {
  return {
    id: `price-${modelId}-msrp`,
    modelId,
    scope: 'msrp_global' as const,
    amountMin: '500',
    amountMax: '700',
    isCurrent: true,
  };
}

function primaryImage(modelId: string, sortOrder = 0) {
  return {
    id: `img-${modelId}-${sortOrder}`,
    modelId,
    url: `https://cdn.example/${modelId}.jpg`,
    altVi: 'Ảnh nhạc cụ',
    altEn: 'Instrument photo',
    credit: 'Yamaha',
    licenseNote: 'Used with permission',
    isPrimary: true,
    sortOrder,
  };
}

describe('listPublishedInstruments', () => {
  it('returns an empty listing when no base models match', async () => {
    const db = createQueuedDb([[]]);
    await expect(listPublishedInstruments(db, {})).resolves.toEqual({ items: [], totalCount: 0 });
  });

  it('maps resolved street price, lowest-sort primary image, and published variant count', async () => {
    const db = createQueuedDb([
      [BASE_MODEL],
      [msrpPrice(BASE_MODEL.modelId), streetPrice(BASE_MODEL.modelId)],
      [primaryImage(BASE_MODEL.modelId, 2), primaryImage(BASE_MODEL.modelId, 0)],
      [{ modelId: BASE_MODEL.modelId }, { modelId: BASE_MODEL.modelId }],
    ]);

    const result = await listPublishedInstruments(db, {});
    expect(result.totalCount).toBe(1);
    expect(result.items[0]).toMatchObject({
      modelId: BASE_MODEL.modelId,
      displayName: BASE_MODEL.displayName,
      familySlug: 'alto-sax',
      brandSlug: 'yamaha',
      tier: 'student',
      variantCount: 2,
      price: {
        scope: 'vn_street',
        isEstimate: false,
        amountMin: 12_000_000,
        amountMax: 16_000_000,
      },
      primaryImage: {
        id: `img-${BASE_MODEL.modelId}-0`,
        sortOrder: 0,
        credit: 'Yamaha',
        licenseNote: 'Used with permission',
      },
    });
  });

  it('keeps models with no current price in unfiltered listings', async () => {
    const db = createQueuedDb([[BASE_MODEL], [], [], []]);
    const result = await listPublishedInstruments(db, {});
    expect(result.items[0]?.price).toBeUndefined();
    expect(result.items[0]?.primaryImage).toBeNull();
    expect(result.totalCount).toBe(1);
  });

  it('excludes models that cannot be verified against an active budget band', async () => {
    const expensive = { ...BASE_MODEL, modelId: 'model-expensive', displayName: 'Pro' };
    const db = createQueuedDb([
      [BASE_MODEL, expensive],
      [streetPrice(BASE_MODEL.modelId), streetPrice(expensive.modelId, 120_000_000, 140_000_000)],
      [],
      [],
    ]);

    const result = await listPublishedInstruments(db, { budgetBand: 'under_20m' });
    expect(result.items.map((item) => item.modelId)).toEqual([BASE_MODEL.modelId]);
    expect(result.totalCount).toBe(1);
  });

  it('excludes models with no resolvable price when a budget band is set', async () => {
    const db = createQueuedDb([[BASE_MODEL], [], [], []]);
    const result = await listPublishedInstruments(db, { budgetBand: 'under_20m' });
    expect(result).toEqual({ items: [], totalCount: 0 });
  });
});

describe('getInstrumentDetail', () => {
  it('returns not_available when the model row is missing', async () => {
    const db = createQueuedDb([[]]);
    await expect(getInstrumentDetail(db, 'missing')).resolves.toEqual({ status: 'not_available' });
  });

  it('returns not_available for unpublished models without distinguishing missing from unpublished', async () => {
    const db = createQueuedDb([
      [
        {
          ...BASE_MODEL,
          status: 'draft',
          lastVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    ]);
    await expect(getInstrumentDetail(db, BASE_MODEL.modelId)).resolves.toEqual({ status: 'not_available' });
  });

  it('projects a published model onto flattened available fields', async () => {
    const verifiedAt = new Date('2026-04-01T12:00:00.000Z');
    const olderSource = {
      id: 'src-old',
      modelId: BASE_MODEL.modelId,
      kind: 'editorial' as const,
      url: 'https://example.com/old',
      publisher: 'Old Mag',
      retrievedAt: new Date('2025-01-01T00:00:00.000Z'),
      isPrimary: false,
    };
    const primarySource = {
      id: 'src-primary',
      modelId: BASE_MODEL.modelId,
      kind: 'manufacturer' as const,
      url: 'https://example.com/yamaha',
      publisher: 'Yamaha',
      retrievedAt: new Date('2024-01-01T00:00:00.000Z'),
      isPrimary: true,
    };

    const db = createQueuedDb([
      [
        {
          ...BASE_MODEL,
          status: 'published',
          lastVerifiedAt: verifiedAt,
        },
      ],
      [msrpPrice(BASE_MODEL.modelId), streetPrice(BASE_MODEL.modelId)],
      [primaryImage(BASE_MODEL.modelId, 1), { ...primaryImage(BASE_MODEL.modelId, 0), isPrimary: false }],
      [olderSource, primarySource],
      [{ modelId: 'variant-1', displayName: 'YAS-280 Gold', modelCode: 'YAS-280G' }],
    ]);

    const result = await getInstrumentDetail(db, BASE_MODEL.modelId);
    expect(result).toMatchObject({
      status: 'available',
      modelId: BASE_MODEL.modelId,
      displayName: BASE_MODEL.displayName,
      familySlug: 'alto-sax',
      brandSlug: 'yamaha',
      tier: 'student',
      lastVerifiedAt: verifiedAt.toISOString(),
      price: { scope: 'vn_street', isEstimate: false },
      source: {
        id: 'src-primary',
        publisher: 'Yamaha',
        kind: 'manufacturer',
        retrievedAt: primarySource.retrievedAt.toISOString(),
      },
      variants: [{ modelId: 'variant-1', displayName: 'YAS-280 Gold', distinguishingFeature: 'YAS-280G' }],
    });
    if (result.status === 'available') {
      expect(result.images.map((image) => image.sortOrder)).toEqual([0, 1]);
    }
  });

  it('uses the most recently retrieved source when none is flagged primary, and null when none exist', async () => {
    const newer = {
      id: 'src-new',
      modelId: BASE_MODEL.modelId,
      kind: 'dealer' as const,
      url: 'https://example.com/new',
      publisher: 'Dealer',
      retrievedAt: new Date('2026-06-01T00:00:00.000Z'),
      isPrimary: false,
    };
    const older = {
      id: 'src-old',
      modelId: BASE_MODEL.modelId,
      kind: 'editorial' as const,
      url: 'https://example.com/old',
      publisher: 'Mag',
      retrievedAt: new Date('2025-06-01T00:00:00.000Z'),
      isPrimary: false,
    };

    const withSources = createQueuedDb([
      [{ ...BASE_MODEL, status: 'published', lastVerifiedAt: new Date('2026-01-01T00:00:00.000Z') }],
      [],
      [],
      [older, newer],
      [],
    ]);
    const withSourcesResult = await getInstrumentDetail(withSources, BASE_MODEL.modelId);
    expect(withSourcesResult.status === 'available' && withSourcesResult.source?.id).toBe('src-new');

    const withoutSources = createQueuedDb([
      [{ ...BASE_MODEL, status: 'published', lastVerifiedAt: new Date('2026-01-01T00:00:00.000Z') }],
      [],
      [],
      [],
      [],
    ]);
    const withoutSourcesResult = await getInstrumentDetail(withoutSources, BASE_MODEL.modelId);
    expect(withoutSourcesResult.status === 'available' && withoutSourcesResult.source).toBeNull();
  });
});

describe('listCatalogFacets', () => {
  it('returns family and brand option lists from the catalog tables', async () => {
    const db = createQueuedDb([[{ slug: 'trumpet', nameVi: 'Kèn trumpet' }], [{ slug: 'yamaha', name: 'Yamaha' }]]);
    await expect(listCatalogFacets(db)).resolves.toEqual({
      families: [{ slug: 'trumpet', nameVi: 'Kèn trumpet' }],
      brands: [{ slug: 'yamaha', name: 'Yamaha' }],
    });
  });
});
