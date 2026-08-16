import * as v from 'valibot';

import { PriceScopeSchema, type PricePoint } from './catalog.ts';
import type { Budget } from './criteria.ts';

export const ResolvedPriceSchema = v.object({
  scope: PriceScopeSchema,
  isEstimate: v.boolean(),
  amountMin: v.number(),
  amountMax: v.number(),
});
export type ResolvedPrice = v.InferOutput<typeof ResolvedPriceSchema>;

export const BUDGET_BOUNDS: Record<Budget, { min: number; max: number }> = {
  under_20m: { min: 0, max: 20_000_000 },
  '20_50m': { min: 20_000_000, max: 50_000_000 },
  '50_100m': { min: 50_000_000, max: 100_000_000 },
  over_100m: { min: 100_000_000, max: Number.POSITIVE_INFINITY },
};

export function resolveDisplayPrice(prices: PricePoint[]): ResolvedPrice | undefined {
  const current = prices.filter((price) => price.isCurrent);
  const price = current.find((candidate) => candidate.scope === 'vn_street') ?? current[0];
  if (!price) {
    return undefined;
  }
  return {
    scope: price.scope,
    isEstimate: price.scope !== 'vn_street',
    amountMin: price.amountMin,
    amountMax: price.amountMax,
  };
}

export function priceOverlapsBudget(price: { amountMin: number; amountMax: number }, budget: Budget): boolean {
  const bounds = BUDGET_BOUNDS[budget];
  return price.amountMin <= bounds.max && price.amountMax >= bounds.min;
}
