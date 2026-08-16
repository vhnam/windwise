import * as v from 'valibot';

import {
  AgeBandSchema,
  BudgetSchema,
  LevelSchema,
  PhysicalNoteSchema,
  PurposeSchema,
  SectionPreferenceSchema,
  type PartialCriteria,
} from '@windwise/schemas';

import { UnmappedCriteriaError } from '#/errors.ts';

type Level = v.InferOutput<typeof LevelSchema>;
type Purpose = v.InferOutput<typeof PurposeSchema>;
type Budget = v.InferOutput<typeof BudgetSchema>;
type AgeBand = v.InferOutput<typeof AgeBandSchema>;
type SectionPreference = v.InferOutput<typeof SectionPreferenceSchema>;
type PhysicalNote = v.InferOutput<typeof PhysicalNoteSchema>;

const LEVEL_HINTS: Array<[RegExp, Level]> = [
  [/beginner|mới bắt đầu|mới chơi|mới tập|người mới|chưa chơi|newbie/i, 'beginner'],
  [/1[-\s_]*3\s*năm|vài năm|trung cấp/i, 'intermediate'],
  [/professional|chuyên nghiệp/i, 'professional'],
  [/advanced|nâng cao/i, 'advanced'],
];

const PURPOSE_HINTS: Array<[RegExp, Purpose]> = [
  [/school|trường|học đường|đội kèn trường|học tập|đi học/i, 'school'],
  [/jazz/i, 'jazz'],
  [/orchestra|giao hưởng/i, 'orchestra'],
  [/marching|diễu hành/i, 'marching'],
  [/concert band|hòa tấu|biểu diễn/i, 'concert_band'],
  [/personal|tự chơi|giải trí|cá nhân|chơi nhà|tự học/i, 'personal'],
];

const BUDGET_HINTS: Array<[RegExp, Budget]> = [
  [/under[_\s-]?20|dưới 20|<( )?20/i, 'under_20m'],
  [/20[_\s-]*50/i, '20_50m'],
  [/50[_\s-]*100/i, '50_100m'],
  [/over[_\s-]?100|trên 100|>100/i, 'over_100m'],
];

const AGE_HINTS: Array<[RegExp, AgeBand]> = [
  [/under[_\s-]?8|dưới 8|nhỏ hơn 8/i, 'under_8'],
  [/8[_\s-]*11/i, '8_11'],
  [/12[_\s-]*14/i, '12_14'],
  [/15(\+| plus)|từ 15/i, '15_plus'],
];

const SECTION_HINTS: Array<[RegExp, SectionPreference]> = [
  [/undecided|chưa quyết/i, 'undecided'],
  [/trumpet|kèn trumpet/i, 'trumpet'],
  [/trombone|kèn trombone/i, 'brass'],
  [/clarinet/i, 'clarinet'],
  [/flute|sáo/i, 'flute'],
  [/alto[-\s]?sax|saxophone alto/i, 'alto-sax'],
  [/brass|kèn đồng/i, 'brass'],
  [/woodwind|kèn gỗ/i, 'woodwind'],
];

const BRASS_SECTIONS = new Set<SectionPreference>(['trumpet', 'brass']);
const WOODWIND_SECTIONS = new Set<SectionPreference>(['clarinet', 'flute', 'alto-sax', 'woodwind']);

const PHYSICAL_HINTS: Array<[RegExp, PhysicalNote]> = [
  [/braces|niềng/i, 'braces'],
  [/small hands|tay nhỏ/i, 'small_hands'],
  [/asthma|hen/i, 'asthma'],
];

function firstMatch<T>(message: string, hints: Array<[RegExp, T]>): T | undefined {
  for (const [pattern, value] of hints) {
    if (pattern.test(message)) {
      return value;
    }
  }
  return undefined;
}

function parseTrieuAmount(message: string): number | undefined {
  const match = message.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|tr(?![a-zà-ỹ]))/i);
  if (!match) {
    return undefined;
  }
  const amount = Number(match[1].replace(',', '.'));
  return Number.isFinite(amount) ? amount : undefined;
}

function bandFromTrieu(amount: number): Budget {
  if (amount < 20) {
    return 'under_20m';
  }
  if (amount < 50) {
    return '20_50m';
  }
  if (amount < 100) {
    return '50_100m';
  }
  return 'over_100m';
}

function matchBudget(message: string): { budget?: Budget; budgetCeilingVnd?: number } {
  const trieu = parseTrieuAmount(message);
  const budget = firstMatch(message, BUDGET_HINTS) ?? (trieu === undefined ? undefined : bandFromTrieu(trieu));
  return {
    budget,
    budgetCeilingVnd: trieu === undefined ? undefined : Math.round(trieu * 1_000_000),
  };
}

function matchSection(message: string): SectionPreference | undefined {
  const matched = [...new Set(SECTION_HINTS.filter(([pattern]) => pattern.test(message)).map(([, value]) => value))];
  if (matched.length === 0) {
    return undefined;
  }
  if (matched.length === 1) {
    return matched[0];
  }

  const hasBrass = matched.some((value) => BRASS_SECTIONS.has(value));
  const hasWoodwind = matched.some((value) => WOODWIND_SECTIONS.has(value));
  if (hasBrass && hasWoodwind) {
    return 'undecided';
  }
  if (hasBrass) {
    return 'brass';
  }
  if (hasWoodwind) {
    return 'woodwind';
  }
  return 'undecided';
}

export function heuristicNormalize(message: string): PartialCriteria {
  const physicalNotes = PHYSICAL_HINTS.filter(([pattern]) => pattern.test(message)).map(([, value]) => value);
  const budget = matchBudget(message);

  const criteria: PartialCriteria = {
    level: firstMatch(message, LEVEL_HINTS),
    purpose: firstMatch(message, PURPOSE_HINTS),
    budget: budget.budget,
    budgetCeilingVnd: budget.budgetCeilingVnd,
    age: firstMatch(message, AGE_HINTS),
    sectionPreference: matchSection(message),
    physicalNotes: physicalNotes.length > 0 ? physicalNotes : undefined,
  };

  const defined = Object.values(criteria).filter((value) => value !== undefined);
  if (defined.length === 0) {
    throw new UnmappedCriteriaError();
  }

  return criteria;
}

export type CriteriaNormalizer = (message: string) => Promise<PartialCriteria> | PartialCriteria;
