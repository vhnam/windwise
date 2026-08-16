import { describe, expect, it, vi } from 'vite-plus/test';

import type { CatalogSnapshot, Criteria, RuleSet } from '@windwise/schemas';

const catalog: CatalogSnapshot = {
  families: [
    {
      id: 'fam-clarinet',
      slug: 'clarinet',
      section: 'woodwind',
      nameVi: 'Clarinet',
      nameEn: 'Clarinet',
      beginnerDifficulty: 2,
      minRecommendedAge: 8,
      physicalDemand: 2,
      typicalEnsembles: ['school'],
    },
    {
      id: 'fam-flute',
      slug: 'flute',
      section: 'woodwind',
      nameVi: 'Flute',
      nameEn: 'Flute',
      beginnerDifficulty: 2,
      minRecommendedAge: 8,
      physicalDemand: 2,
      typicalEnsembles: ['school'],
    },
    {
      id: 'fam-trumpet',
      slug: 'trumpet',
      section: 'brass',
      nameVi: 'Trumpet',
      nameEn: 'Trumpet',
      beginnerDifficulty: 3,
      minRecommendedAge: 8,
      physicalDemand: 4,
      typicalEnsembles: ['school'],
    },
  ],
  models: [
    {
      id: 'm1',
      brandId: 'b1',
      familyId: 'fam-clarinet',
      modelCode: 'YCL-255',
      displayName: 'Yamaha YCL-255',
      levelTier: 'student',
      status: 'published',
      lastVerifiedAt: '2026-01-15T00:00:00.000Z',
      sourceUrl: 'https://example.com/instruments/YCL-255',
    },
    {
      id: 'm2',
      brandId: 'b1',
      familyId: 'fam-flute',
      modelCode: 'YFL-222',
      displayName: 'Yamaha YFL-222',
      levelTier: 'student',
      status: 'published',
      lastVerifiedAt: '2026-01-15T00:00:00.000Z',
      sourceUrl: 'https://example.com/instruments/YFL-222',
    },
    {
      id: 'm3',
      brandId: 'b1',
      familyId: 'fam-trumpet',
      modelCode: 'YTR-2330',
      displayName: 'Yamaha YTR-2330',
      levelTier: 'student',
      status: 'published',
      lastVerifiedAt: '2026-01-15T00:00:00.000Z',
      sourceUrl: 'https://example.com/instruments/YTR-2330',
    },
  ],
  prices: [
    { modelId: 'm1', scope: 'vn_street', amountMin: 11_000_000, amountMax: 15_000_000, isCurrent: true },
    { modelId: 'm2', scope: 'vn_street', amountMin: 10_000_000, amountMax: 14_000_000, isCurrent: true },
    { modelId: 'm3', scope: 'vn_street', amountMin: 12_000_000, amountMax: 16_000_000, isCurrent: true },
  ],
};

const ruleSet: RuleSet = {
  ruleSetId: 'rules-v1',
  rules: [
    {
      id: 'school',
      kind: 'modifier',
      target: 'family',
      condition: { op: 'includes', field: 'family.typicalEnsembles', value: 'school' },
      effect: { type: 'score', delta: 10 },
      reasonTemplateVi: 'Phù hợp học đường.',
      reasonTemplateEn: 'Fits school.',
    },
  ],
};

vi.mock('@windwise/db', () => ({
  getSessionState: vi.fn(async () => ({
    session: {
      id: 'session-1',
      anonId: 'anon',
      questionSetId: 'qs-1',
      intent: 'discover',
      locale: 'vi',
      status: 'in_progress',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: null,
    },
    answers: [],
  })),
  getPublishedCatalog: vi.fn(async () => catalog),
  getPublishedRuleSet: vi.fn(async () => ruleSet),
  persistRun: vi.fn(async (_db: unknown, _result: unknown, _pins: unknown) => ({ runId: 'run-fixed' })),
}));

const criteria: Criteria = { level: 'beginner', purpose: 'school', budget: 'under_20m' };

describe('chat/form parity', () => {
  it('produces identical RecommendationResult for the same criteria', async () => {
    const { runRecommendation } = await import('@windwise/ai');

    const chatPath = await runRecommendation({} as never, criteria, 'session-1', 'chat');
    const formPath = await runRecommendation({} as never, criteria, 'session-1', 'form');

    const strip = (result: typeof chatPath) => {
      const { runId: _runId, ...rest } = result;
      return rest;
    };

    expect(strip(formPath)).toEqual(strip(chatPath));
    expect(chatPath.items.length).toBeGreaterThanOrEqual(2);
    expect(chatPath.items[0]?.reasons.length).toBeGreaterThan(0);
  });
});
