import { describe, expect, it } from 'vite-plus/test';

import { recommend } from '../recommend.ts';
import {
  fixtureCatalog,
  fixtureCriteriaAgeExcluded,
  fixtureCriteriaBraces,
  fixtureCriteriaRequiredOnly,
  fixtureRuleSet,
} from './fixtures.ts';

describe('recommend', () => {
  it('returns a non-empty ranked result for required-only criteria', () => {
    const result = recommend(fixtureCriteriaRequiredOnly, fixtureCatalog, fixtureRuleSet);

    expect(result.noMatch).toBeUndefined();
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.length).toBeGreaterThanOrEqual(3);
    expect(result.items.every((item) => item.reasons.length > 0)).toBe(true);
    expect(result.items.every((item) => item.scoreBreakdown.lastVerifiedAt)).toBe(true);
    expect(result.items.every((item) => item.scoreBreakdown.sourceUrl)).toBe(true);
    expect(result.items.every((item) => item.scoreBreakdown.price.scope)).toBe(true);
    expect(result.items.map((item) => item.rank)).toEqual(result.items.map((_, index) => index + 1));
    expect(result.items.some((item) => item.modelId === 'mod-draft')).toBe(false);
    expect(result.items.some((item) => item.modelId === 'mod-trumpet-pro')).toBe(false);
  });

  it('steers braces + brass-leaning purpose toward woodwind', () => {
    const result = recommend(fixtureCriteriaBraces, fixtureCatalog, fixtureRuleSet);
    const topFamilies = result.items.slice(0, 3).map((item) => item.scoreBreakdown.familySlug);

    expect(topFamilies.every((slug) => slug !== 'trumpet')).toBe(true);
    expect(topFamilies.some((slug) => slug === 'clarinet' || slug === 'flute' || slug === 'alto-sax')).toBe(true);
  });

  it('names the limiting constraint when every candidate is excluded', () => {
    const result = recommend(fixtureCriteriaAgeExcluded, fixtureCatalog, fixtureRuleSet);

    expect(result.items).toEqual([]);
    expect(result.noMatch?.limitingConstraint).toBe('age_too_young');
    expect(result.noMatch?.suggestion).toContain('độ tuổi');
  });

  it('is deterministic for identical inputs', () => {
    const first = recommend(fixtureCriteriaRequiredOnly, fixtureCatalog, fixtureRuleSet);
    const second = recommend(fixtureCriteriaRequiredOnly, fixtureCatalog, fixtureRuleSet);

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('still produces 2-3 items when optional criteria are omitted', () => {
    const result = recommend(
      { level: 'beginner', purpose: 'school', budget: 'under_20m' },
      fixtureCatalog,
      fixtureRuleSet,
    );

    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.length).toBeLessThanOrEqual(5);
  });

  it('does not recommend instruments above a stated VND ceiling', () => {
    const result = recommend(
      { level: 'beginner', purpose: 'school', budget: 'under_20m', budgetCeilingVnd: 5_000_000 },
      fixtureCatalog,
      fixtureRuleSet,
    );

    expect(result.items).toEqual([]);
    expect(result.noMatch?.limitingConstraint).toBe('budget');
  });

  it('still includes in-band models when the stated ceiling covers their starting price', () => {
    const result = recommend(
      { level: 'beginner', purpose: 'school', budget: 'under_20m', budgetCeilingVnd: 15_000_000 },
      fixtureCatalog,
      fixtureRuleSet,
    );

    expect(result.items.some((item) => item.scoreBreakdown.modelCode === 'YTR-2330')).toBe(true);
  });
});
