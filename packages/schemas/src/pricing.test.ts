import { describe, expect, it } from 'vite-plus/test';

import { BUDGET_BOUNDS, priceOverlapsBudget, resolveDisplayPrice } from './pricing.ts';

describe('resolveDisplayPrice', () => {
  it('prefers a current vn_street price and marks it as not an estimate', () => {
    const resolved = resolveDisplayPrice([
      { modelId: 'm1', scope: 'msrp_global', amountMin: 500, amountMax: 700, isCurrent: true },
      { modelId: 'm1', scope: 'vn_street', amountMin: 12_000_000, amountMax: 16_000_000, isCurrent: true },
    ]);

    expect(resolved).toEqual({
      scope: 'vn_street',
      isEstimate: false,
      amountMin: 12_000_000,
      amountMax: 16_000_000,
    });
  });

  it('falls back to msrp_global flagged as an estimate when no vn_street price exists', () => {
    const resolved = resolveDisplayPrice([
      { modelId: 'm1', scope: 'msrp_global', amountMin: 500, amountMax: 700, isCurrent: true },
    ]);

    expect(resolved).toEqual({
      scope: 'msrp_global',
      isEstimate: true,
      amountMin: 500,
      amountMax: 700,
    });
  });

  it('ignores non-current price rows', () => {
    const resolved = resolveDisplayPrice([
      { modelId: 'm1', scope: 'vn_street', amountMin: 12_000_000, amountMax: 16_000_000, isCurrent: false },
    ]);

    expect(resolved).toBeUndefined();
  });

  it('returns undefined when there are no price rows at all', () => {
    expect(resolveDisplayPrice([])).toBeUndefined();
  });
});

describe('priceOverlapsBudget', () => {
  it('matches a price against the correct VND band', () => {
    expect(priceOverlapsBudget({ amountMin: 12_000_000, amountMax: 16_000_000 }, 'under_20m')).toBe(true);
    expect(priceOverlapsBudget({ amountMin: 12_000_000, amountMax: 16_000_000 }, 'over_100m')).toBe(false);
  });

  it('exposes the same four bands used by budget-based filtering', () => {
    expect(Object.keys(BUDGET_BOUNDS)).toEqual(['under_20m', '20_50m', '50_100m', 'over_100m']);
  });
});
