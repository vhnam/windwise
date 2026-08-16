import type { ConditionAst, InstrumentFamily, InstrumentModel, PartialCriteria, RuleEffect } from '@windwise/schemas';

export type EvaluationContext = {
  criteria: PartialCriteria;
  family: InstrumentFamily;
  model: InstrumentModel;
};

export type WorkingItem = {
  family: InstrumentFamily;
  model: InstrumentModel;
  score: number;
  reasons: string[];
  excluded: boolean;
  reasonKey?: string;
  adjustments: Array<{ reasonKey: string; delta: number }>;
};

function readField(ctx: EvaluationContext, field: string): unknown {
  const [root, key] = field.split('.') as [string, string | undefined];
  if (!key) {
    return undefined;
  }
  if (root === 'criteria') {
    return ctx.criteria[key as keyof PartialCriteria];
  }
  if (root === 'family') {
    return ctx.family[key as keyof InstrumentFamily];
  }
  if (root === 'model') {
    return ctx.model[key as keyof InstrumentModel];
  }
  return undefined;
}

function collectCriteriaFields(condition: ConditionAst, into: Set<string>): void {
  if (condition.op === 'and' || condition.op === 'or') {
    for (const child of condition.conditions) {
      collectCriteriaFields(child, into);
    }
    return;
  }
  if (condition.field.startsWith('criteria.')) {
    into.add(condition.field.slice('criteria.'.length));
  }
}

export function conditionReferencesAbsentCriteria(condition: ConditionAst, criteria: PartialCriteria): boolean {
  const fields = new Set<string>();
  collectCriteriaFields(condition, fields);
  for (const field of fields) {
    const value = criteria[field as keyof PartialCriteria];
    if (value === undefined) {
      return true;
    }
  }
  return false;
}

export function evaluateCondition(condition: ConditionAst, ctx: EvaluationContext): boolean {
  switch (condition.op) {
    case 'equals':
      return readField(ctx, condition.field) === condition.value;
    case 'in': {
      const value = readField(ctx, condition.field);
      return condition.value.includes(value);
    }
    case 'includes': {
      const value = readField(ctx, condition.field);
      if (Array.isArray(value)) {
        return value.includes(condition.value);
      }
      return false;
    }
    case 'gte': {
      const value = readField(ctx, condition.field);
      return typeof value === 'number' && value >= condition.value;
    }
    case 'lte': {
      const value = readField(ctx, condition.field);
      return typeof value === 'number' && value <= condition.value;
    }
    case 'and':
      return condition.conditions.every((child) => evaluateCondition(child, ctx));
    case 'or':
      return condition.conditions.some((child) => evaluateCondition(child, ctx));
  }
}

export function applyEffect(effect: RuleEffect, item: WorkingItem): WorkingItem {
  if (effect.type === 'score') {
    return {
      ...item,
      score: item.score + effect.delta,
      adjustments: [...item.adjustments, { reasonKey: 'score', delta: effect.delta }],
    };
  }

  return {
    ...item,
    excluded: true,
    reasonKey: effect.reasonKey,
  };
}
