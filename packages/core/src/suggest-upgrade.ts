import type {
  CatalogSnapshot,
  Criteria,
  InstrumentModel,
  LevelTier,
  RuleSet,
  SectionPreference,
  UpgradeCriteria,
  UpgradeRecommendation,
} from '@windwise/schemas';

import { recommend } from './recommend.ts';

const TIER_ORDER: LevelTier[] = ['student', 'intermediate', 'professional', 'custom'];

function tierRank(tier: LevelTier): number {
  return TIER_ORDER.indexOf(tier);
}

function familySectionPreference(catalog: CatalogSnapshot, familyId: string): SectionPreference | undefined {
  const family = catalog.families.find((entry) => entry.id === familyId);
  if (!family) {
    return undefined;
  }
  return family.slug as SectionPreference;
}

export function suggestUpgrade(
  currentModel: InstrumentModel,
  criteria: UpgradeCriteria,
  catalog: CatalogSnapshot,
  ruleSet: RuleSet,
): UpgradeRecommendation {
  const floor = {
    familyId: currentModel.familyId,
    minTier: currentModel.levelTier,
    currentIsRecommendable: currentModel.status === 'published',
  };

  const minRank = tierRank(floor.minTier);
  const filteredCatalog: CatalogSnapshot = {
    families: catalog.families,
    prices: catalog.prices,
    models: catalog.models.filter(
      (model) =>
        model.id !== currentModel.id && model.familyId === floor.familyId && tierRank(model.levelTier) >= minRank,
    ),
  };

  const fullCriteria: Criteria = {
    level: criteria.currentLevel,
    purpose: criteria.purpose,
    budget: criteria.upgradeBudget,
    sectionPreference: familySectionPreference(catalog, floor.familyId),
  };

  const result = recommend(fullCriteria, filteredCatalog, ruleSet);
  const items = result.items.filter((item) => item.familyId === floor.familyId && item.modelId !== currentModel.id);

  return {
    items,
    floor,
    hasQualifyingCandidate: items.length > 0,
  };
}
