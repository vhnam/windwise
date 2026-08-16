import { describe, expect, it } from 'vite-plus/test';

import type { CatalogSnapshot, UpgradeCriteria } from '@windwise/schemas';

import { suggestUpgrade } from '../suggest-upgrade.ts';
import { fixtureCatalog, fixtureRuleSet } from './fixtures.ts';

function withWidePrices(catalog: CatalogSnapshot): CatalogSnapshot {
  return {
    ...catalog,
    prices: catalog.models.map((model) => ({
      modelId: model.id,
      scope: 'vn_street' as const,
      amountMin: 110_000_000,
      amountMax: 130_000_000,
      isCurrent: true,
    })),
  };
}

const upgradeCriteria = (currentModelId: string): UpgradeCriteria => ({
  sessionId: 'session-upgrade',
  currentModelId,
  reason: 'want more projection',
  currentLevel: 'advanced',
  purpose: 'orchestra',
  upgradeBudget: 'over_100m',
});

const catalog = withWidePrices(fixtureCatalog);

describe('suggestUpgrade', () => {
  it('never returns a candidate outside the current family or below the tier floor', () => {
    const current = catalog.models.find((model) => model.id === 'mod-trumpet-pro');
    if (!current) {
      throw new Error('missing fixture');
    }

    const result = suggestUpgrade(current, upgradeCriteria(current.id), catalog, fixtureRuleSet);

    expect(result.items.every((item) => item.familyId === current.familyId)).toBe(true);
    expect(result.items.some((item) => item.modelId === 'mod-trumpet-student')).toBe(false);
    expect(result.items.some((item) => item.modelId === 'mod-clarinet-student')).toBe(false);
    expect(result.items.some((item) => item.scoreBreakdown.familySlug === 'clarinet')).toBe(false);
  });

  it('uses an archived current instrument for the floor and excludes it from candidates', () => {
    const archived = {
      ...catalog.models[0]!,
      id: 'mod-trumpet-archived',
      status: 'archived' as const,
      levelTier: 'student' as const,
      familyId: 'fam-trumpet',
    };
    const withArchived: CatalogSnapshot = {
      ...catalog,
      models: [...catalog.models, archived],
      prices: [
        ...catalog.prices,
        {
          modelId: archived.id,
          scope: 'vn_street',
          amountMin: 110_000_000,
          amountMax: 130_000_000,
          isCurrent: true,
        },
      ],
    };

    const result = suggestUpgrade(archived, upgradeCriteria(archived.id), withArchived, fixtureRuleSet);

    expect(result.floor.familyId).toBe('fam-trumpet');
    expect(result.floor.minTier).toBe('student');
    expect(result.floor.currentIsRecommendable).toBe(false);
    expect(result.items.some((item) => item.modelId === archived.id)).toBe(false);
    expect(result.items.every((item) => item.familyId === 'fam-trumpet')).toBe(true);
    expect(result.items.some((item) => item.modelId === 'mod-trumpet-student')).toBe(true);
  });

  it('returns hasQualifyingCandidate false with empty items when nothing matches', () => {
    const current = catalog.models.find((model) => model.id === 'mod-trumpet-pro');
    if (!current) {
      throw new Error('missing fixture');
    }

    const emptyFamily: CatalogSnapshot = {
      ...catalog,
      models: catalog.models.filter((model) => model.id === current.id),
      prices: catalog.prices.filter((price) => price.modelId === current.id),
    };

    const result = suggestUpgrade(current, upgradeCriteria(current.id), emptyFamily, fixtureRuleSet);

    expect(result.hasQualifyingCandidate).toBe(false);
    expect(result.items).toEqual([]);
  });

  it('keeps a same-family higher-or-equal tier candidate', () => {
    const current = catalog.models.find((model) => model.id === 'mod-trumpet-student');
    if (!current) {
      throw new Error('missing fixture');
    }

    const result = suggestUpgrade(current, upgradeCriteria(current.id), catalog, fixtureRuleSet);

    expect(result.hasQualifyingCandidate).toBe(true);
    expect(result.items.some((item) => item.modelId === 'mod-trumpet-pro')).toBe(true);
    expect(result.items.some((item) => item.modelId === 'mod-clarinet-student')).toBe(false);
  });
});
