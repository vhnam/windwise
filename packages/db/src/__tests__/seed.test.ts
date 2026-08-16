import { describe, expect, it } from 'vite-plus/test';

import { seedCatalogRows, SEED_RULES } from '../seed.ts';

describe('seed catalog', () => {
  it('includes four published families and both price scopes', () => {
    const { families, models, prices, questions } = seedCatalogRows();

    expect(families).toHaveLength(4);
    expect(models.every((model) => model.status === 'published')).toBe(true);
    expect(prices.some((price) => price.scope === 'vn_street')).toBe(true);
    expect(prices.some((price) => price.scope === 'msrp_global')).toBe(true);
    expect(questions).toHaveLength(6);
    expect(SEED_RULES.some((rule) => rule.kind === 'constraint')).toBe(true);
    expect(SEED_RULES.some((rule) => rule.kind === 'modifier')).toBe(true);
  });
});
