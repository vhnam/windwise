import type {
  CatalogSnapshot,
  Criteria,
  NoMatchInfo,
  PricePoint,
  PublicRecommendationItem,
  RecommendationResult,
  RuleSet,
} from '@windwise/schemas';

import {
  applyEffect,
  conditionReferencesAbsentCriteria,
  evaluateCondition,
  type WorkingItem,
} from '#/rules/interpreter.ts';

const BASE_SCORE = 50;
export const ENGINE_VERSION = '0.1.0';

const BUDGET_BOUNDS: Record<Criteria['budget'], { min: number; max: number }> = {
  under_20m: { min: 0, max: 20_000_000 },
  '20_50m': { min: 20_000_000, max: 50_000_000 },
  '50_100m': { min: 50_000_000, max: 100_000_000 },
  over_100m: { min: 100_000_000, max: Number.POSITIVE_INFINITY },
};

function renderTemplate(template: string, criteria: Criteria): string {
  return template.replaceAll(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = criteria[key as keyof Criteria];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value === undefined ? '' : String(value);
  });
}

function selectPrice(modelId: string, prices: PricePoint[]): PricePoint | undefined {
  const forModel = prices.filter((price) => price.modelId === modelId && price.isCurrent);
  return forModel.find((price) => price.scope === 'vn_street') ?? forModel[0];
}

function priceOverlapsBudget(price: PricePoint, budget: Criteria['budget']): boolean {
  const bounds = BUDGET_BOUNDS[budget];
  return price.amountMin <= bounds.max && price.amountMax >= bounds.min;
}

function priceFitsCeiling(price: PricePoint, ceilingVnd: number | undefined): boolean {
  if (ceilingVnd === undefined) {
    return true;
  }
  return price.amountMin <= ceilingVnd;
}

function matchesSectionPreference(criteria: Criteria, family: { slug: string; section: string }): boolean {
  const preference = criteria.sectionPreference;
  if (!preference || preference === 'undecided') {
    return true;
  }
  return preference === family.section || preference === family.slug;
}

export function recommend(criteria: Criteria, catalog: CatalogSnapshot, ruleSet: RuleSet): RecommendationResult {
  const published = catalog.models.filter((model) => model.status === 'published');
  const familyById = new Map(catalog.families.map((family) => [family.id, family]));
  const exclusionCounts = new Map<string, { count: number; suggestion: string }>();
  const constraintRules = ruleSet.rules.filter((rule) => rule.kind === 'constraint');
  const modifierRules = ruleSet.rules.filter((rule) => rule.kind === 'modifier');

  const surviving: WorkingItem[] = [];

  for (const model of published) {
    const family = familyById.get(model.familyId);
    if (!family) {
      continue;
    }

    const price = selectPrice(model.id, catalog.prices);
    if (!price || !priceOverlapsBudget(price, criteria.budget) || !priceFitsCeiling(price, criteria.budgetCeilingVnd)) {
      continue;
    }

    if (!matchesSectionPreference(criteria, family)) {
      continue;
    }

    let working: WorkingItem = {
      family,
      model,
      score: BASE_SCORE,
      reasons: [],
      excluded: false,
      adjustments: [],
    };

    const ctx = { criteria, family, model };

    for (const rule of constraintRules) {
      if (conditionReferencesAbsentCriteria(rule.condition, criteria)) {
        continue;
      }
      if (
        evaluateCondition(rule.condition, ctx) &&
        (rule.effect.type === 'exclude' || rule.effect.type === 'require')
      ) {
        working = applyEffect(rule.effect, working);
        const reasonKey = rule.effect.reasonKey;
        const current = exclusionCounts.get(reasonKey) ?? {
          count: 0,
          suggestion: renderTemplate(rule.reasonTemplateVi, criteria),
        };
        exclusionCounts.set(reasonKey, { count: current.count + 1, suggestion: current.suggestion });
        break;
      }
    }

    if (working.excluded) {
      continue;
    }

    for (const rule of modifierRules) {
      if (conditionReferencesAbsentCriteria(rule.condition, criteria)) {
        continue;
      }
      if (!evaluateCondition(rule.condition, ctx)) {
        continue;
      }
      working = applyEffect(rule.effect, working);
      if (rule.effect.type === 'score') {
        working = {
          ...working,
          reasons: [...working.reasons, renderTemplate(rule.reasonTemplateVi, criteria)],
          adjustments: [...working.adjustments.slice(0, -1), { reasonKey: rule.id, delta: rule.effect.delta }],
        };
      }
    }

    if (working.reasons.length === 0) {
      working = {
        ...working,
        reasons: [`Phù hợp ngân sách ${criteria.budget} và trình độ ${criteria.level}.`],
      };
    }

    surviving.push(working);
  }

  surviving.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.model.id.localeCompare(b.model.id);
  });

  const items: PublicRecommendationItem[] = surviving.map((item, index) => {
    const price = selectPrice(item.model.id, catalog.prices);
    if (!price) {
      throw new Error(`Missing current price for model ${item.model.id}`);
    }

    return {
      rank: index + 1,
      familyId: item.family.id,
      modelId: item.model.id,
      score: item.score,
      reasons: item.reasons,
      scoreBreakdown: {
        base: BASE_SCORE,
        adjustments: item.adjustments,
        lastVerifiedAt: item.model.lastVerifiedAt,
        sourceUrl: item.model.sourceUrl,
        price: {
          scope: price.scope,
          amountMin: price.amountMin,
          amountMax: price.amountMax,
        },
        familySlug: item.family.slug,
        familyNameVi: item.family.nameVi,
        familyNameEn: item.family.nameEn,
        modelCode: item.model.modelCode,
        displayName: item.model.displayName,
      },
    };
  });

  let noMatch: NoMatchInfo | undefined;
  if (items.length === 0) {
    let limiting = 'budget';
    let suggestion =
      criteria.budgetCeilingVnd !== undefined
        ? `Không có mẫu nào có giá khởi điểm trong khoảng ${criteria.budgetCeilingVnd.toLocaleString('vi-VN')} VND. Hãy nới ngân sách.`
        : 'Hãy nới ngân sách hoặc bỏ bớt ràng buộc tùy chọn.';
    let highest = -1;
    for (const [reasonKey, info] of exclusionCounts) {
      if (info.count > highest) {
        highest = info.count;
        limiting = reasonKey;
        suggestion = info.suggestion;
      }
    }
    noMatch = { limitingConstraint: limiting, suggestion };
  }

  return {
    runId: '',
    items,
    noMatch,
  };
}

export function toPublicSlice(result: RecommendationResult, limit = 3): RecommendationResult {
  return {
    ...result,
    items: result.items.slice(0, limit),
  };
}
