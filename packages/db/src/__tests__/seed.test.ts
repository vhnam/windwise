import { describe, expect, it } from 'vite-plus/test';

import { SEED_ADMIN_EMAIL, SEED_ORGANIZATION_SLUG, SEED_RULES, seedCatalogRows } from '../seed.ts';

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

  it('defines the manager-dashboard admin login identity', () => {
    expect(SEED_ADMIN_EMAIL).toBe('admin@windwise.io');
    expect(SEED_ORGANIZATION_SLUG).toBe('windwise');
  });
});
