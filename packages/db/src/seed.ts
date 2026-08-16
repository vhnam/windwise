import type { ConditionAst, RuleEffect } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import {
  instrumentFamilies,
  instrumentModels,
  pricePoints,
  questionSets,
  questions,
  ruleSets,
  rules,
} from '#/schema/index.ts';

export const SEED_QUESTION_SET_ID = '11111111-1111-4111-8111-111111111111';
export const SEED_RULE_SET_ID = '22222222-2222-4222-8222-222222222222';
export const SEED_BRAND_ID = '33333333-3333-4333-8333-333333333333';

export const SEED_FAMILY_IDS = {
  trumpet: '44444444-4444-4444-8444-444444444401',
  clarinet: '44444444-4444-4444-8444-444444444402',
  flute: '44444444-4444-4444-8444-444444444403',
  'alto-sax': '44444444-4444-4444-8444-444444444404',
} as const;

export const SEED_MODEL_IDS = {
  yamahaTrumpetStudent: '55555555-5555-4555-8555-555555555501',
  bachTrumpetPro: '55555555-5555-4555-8555-555555555502',
  yamahaClarinetStudent: '55555555-5555-4555-8555-555555555503',
  buffetClarinetInt: '55555555-5555-4555-8555-555555555504',
  yamahaFluteStudent: '55555555-5555-4555-8555-555555555505',
  yamahaAltoSaxStudent: '55555555-5555-4555-8555-555555555506',
  yamahaAltoSaxPro: '55555555-5555-4555-8555-555555555507',
} as const;

const VERIFIED_AT = new Date('2026-01-15T00:00:00.000Z');

type SeedRule = {
  id: string;
  kind: 'constraint' | 'modifier';
  target: 'family' | 'model' | 'brand';
  condition: ConditionAst;
  effect: RuleEffect;
  reasonTemplateVi: string;
  reasonTemplateEn: string;
};

export const SEED_RULES: SeedRule[] = [
  {
    id: '66666666-6666-4666-8666-666666666601',
    kind: 'constraint',
    target: 'model',
    condition: {
      op: 'and',
      conditions: [
        { op: 'equals', field: 'criteria.level', value: 'beginner' },
        { op: 'equals', field: 'model.levelTier', value: 'professional' },
      ],
    },
    effect: { type: 'exclude', reasonKey: 'beginner_excludes_professional' },
    reasonTemplateVi: 'Người mới bắt đầu không nên bắt đầu với kèn chuyên nghiệp.',
    reasonTemplateEn: 'Beginners are excluded from professional-tier instruments.',
  },
  {
    id: '66666666-6666-4666-8666-666666666602',
    kind: 'constraint',
    target: 'family',
    condition: {
      op: 'and',
      conditions: [
        { op: 'includes', field: 'criteria.physicalNotes', value: 'asthma' },
        { op: 'gte', field: 'family.physicalDemand', value: 4 },
      ],
    },
    effect: { type: 'exclude', reasonKey: 'asthma_high_demand' },
    reasonTemplateVi: 'Ghi chú hen suyễn loại trừ các họ kèn đòi hỏi thổi mạnh.',
    reasonTemplateEn: 'Asthma notes exclude high physical-demand families.',
  },
  {
    id: '66666666-6666-4666-8666-666666666603',
    kind: 'constraint',
    target: 'family',
    condition: {
      op: 'and',
      conditions: [
        { op: 'equals', field: 'criteria.age', value: 'under_8' },
        { op: 'gte', field: 'family.minRecommendedAge', value: 8 },
      ],
    },
    effect: { type: 'exclude', reasonKey: 'age_too_young' },
    reasonTemplateVi: 'Độ tuổi hiện tại thấp hơn tuổi tối thiểu của các họ kèn trong danh mục.',
    reasonTemplateEn: 'This age band is below the minimum recommended age for available families.',
  },
  {
    id: '66666666-6666-4666-8666-666666666604',
    kind: 'modifier',
    target: 'family',
    condition: {
      op: 'and',
      conditions: [
        { op: 'includes', field: 'criteria.physicalNotes', value: 'braces' },
        { op: 'equals', field: 'family.section', value: 'brass' },
      ],
    },
    effect: { type: 'score', delta: -40 },
    reasonTemplateVi: 'Niềng răng thường khó chịu hơn với kèn đồng miệng cup, nên ưu tiên kèn gỗ.',
    reasonTemplateEn: 'Braces make cup-mouthpiece brass less comfortable, so woodwind is preferred.',
  },
  {
    id: '66666666-6666-4666-8666-666666666605',
    kind: 'modifier',
    target: 'family',
    condition: { op: 'includes', field: 'family.typicalEnsembles', value: 'school' },
    effect: { type: 'score', delta: 12 },
    reasonTemplateVi: 'Phù hợp với mục đích học đường / đội kèn trường.',
    reasonTemplateEn: 'Fits a school / concert-band purpose.',
  },
  {
    id: '66666666-6666-4666-8666-666666666606',
    kind: 'modifier',
    target: 'family',
    condition: {
      op: 'and',
      conditions: [
        { op: 'equals', field: 'criteria.purpose', value: 'jazz' },
        { op: 'in', field: 'family.slug', value: ['alto-sax', 'clarinet'] },
      ],
    },
    effect: { type: 'score', delta: 16 },
    reasonTemplateVi: 'Saxophone alto và clarinet thường phù hợp jazz hơn.',
    reasonTemplateEn: 'Alto sax and clarinet are a strong jazz fit.',
  },
  {
    id: '66666666-6666-4666-8666-666666666607',
    kind: 'modifier',
    target: 'model',
    condition: { op: 'equals', field: 'model.levelTier', value: 'student' },
    effect: { type: 'score', delta: 8 },
    reasonTemplateVi: 'Mẫu học sinh phù hợp trình độ người mới / 1-3 năm.',
    reasonTemplateEn: 'Student-tier models fit beginner and early-year players.',
  },
];

function priceRow(modelId: string, scope: 'msrp_global' | 'vn_street', amountMin: number, amountMax: number) {
  const prefix = scope === 'vn_street' ? 'aaaaaaa1' : 'aaaaaaa2';
  return {
    id: modelId.replace('55555555', prefix),
    modelId,
    scope,
    amountMin: String(amountMin),
    amountMax: String(amountMax),
    isCurrent: true,
  };
}

export function seedCatalogRows() {
  return {
    families: [
      {
        id: SEED_FAMILY_IDS.trumpet,
        slug: 'trumpet',
        section: 'brass' as const,
        nameVi: 'Kèn trumpet',
        nameEn: 'Trumpet',
        beginnerDifficulty: 3,
        minRecommendedAge: 8,
        physicalDemand: 4,
        typicalEnsembles: ['school', 'concert_band', 'jazz', 'orchestra', 'marching'],
      },
      {
        id: SEED_FAMILY_IDS.clarinet,
        slug: 'clarinet',
        section: 'woodwind' as const,
        nameVi: 'Kèn clarinet',
        nameEn: 'Clarinet',
        beginnerDifficulty: 2,
        minRecommendedAge: 8,
        physicalDemand: 2,
        typicalEnsembles: ['school', 'concert_band', 'orchestra', 'jazz'],
      },
      {
        id: SEED_FAMILY_IDS.flute,
        slug: 'flute',
        section: 'woodwind' as const,
        nameVi: 'Sáo flute',
        nameEn: 'Flute',
        beginnerDifficulty: 2,
        minRecommendedAge: 8,
        physicalDemand: 2,
        typicalEnsembles: ['school', 'concert_band', 'orchestra'],
      },
      {
        id: SEED_FAMILY_IDS['alto-sax'],
        slug: 'alto-sax',
        section: 'woodwind' as const,
        nameVi: 'Saxophone alto',
        nameEn: 'Alto saxophone',
        beginnerDifficulty: 2,
        minRecommendedAge: 10,
        physicalDemand: 3,
        typicalEnsembles: ['school', 'concert_band', 'jazz'],
      },
    ],
    models: [
      {
        id: SEED_MODEL_IDS.yamahaTrumpetStudent,
        brandId: SEED_BRAND_ID,
        familyId: SEED_FAMILY_IDS.trumpet,
        modelCode: 'YTR-2330',
        displayName: 'Yamaha YTR-2330',
        levelTier: 'student' as const,
        status: 'published' as const,
        lastVerifiedAt: VERIFIED_AT,
        variantOfModelId: null,
      },
      {
        id: SEED_MODEL_IDS.bachTrumpetPro,
        brandId: SEED_BRAND_ID,
        familyId: SEED_FAMILY_IDS.trumpet,
        modelCode: '180S37',
        displayName: 'Bach Stradivarius 180S37',
        levelTier: 'professional' as const,
        status: 'published' as const,
        lastVerifiedAt: VERIFIED_AT,
        variantOfModelId: null,
      },
      {
        id: SEED_MODEL_IDS.yamahaClarinetStudent,
        brandId: SEED_BRAND_ID,
        familyId: SEED_FAMILY_IDS.clarinet,
        modelCode: 'YCL-255',
        displayName: 'Yamaha YCL-255',
        levelTier: 'student' as const,
        status: 'published' as const,
        lastVerifiedAt: VERIFIED_AT,
        variantOfModelId: null,
      },
      {
        id: SEED_MODEL_IDS.buffetClarinetInt,
        brandId: SEED_BRAND_ID,
        familyId: SEED_FAMILY_IDS.clarinet,
        modelCode: 'E11',
        displayName: 'Buffet Crampon E11',
        levelTier: 'intermediate' as const,
        status: 'published' as const,
        lastVerifiedAt: VERIFIED_AT,
        variantOfModelId: null,
      },
      {
        id: SEED_MODEL_IDS.yamahaFluteStudent,
        brandId: SEED_BRAND_ID,
        familyId: SEED_FAMILY_IDS.flute,
        modelCode: 'YFL-222',
        displayName: 'Yamaha YFL-222',
        levelTier: 'student' as const,
        status: 'published' as const,
        lastVerifiedAt: VERIFIED_AT,
        variantOfModelId: null,
      },
      {
        id: SEED_MODEL_IDS.yamahaAltoSaxStudent,
        brandId: SEED_BRAND_ID,
        familyId: SEED_FAMILY_IDS['alto-sax'],
        modelCode: 'YAS-280',
        displayName: 'Yamaha YAS-280',
        levelTier: 'student' as const,
        status: 'published' as const,
        lastVerifiedAt: VERIFIED_AT,
        variantOfModelId: null,
      },
      {
        id: SEED_MODEL_IDS.yamahaAltoSaxPro,
        brandId: SEED_BRAND_ID,
        familyId: SEED_FAMILY_IDS['alto-sax'],
        modelCode: 'YAS-82Z',
        displayName: 'Yamaha YAS-82Z',
        levelTier: 'professional' as const,
        status: 'published' as const,
        lastVerifiedAt: VERIFIED_AT,
        variantOfModelId: null,
      },
    ],
    prices: [
      priceRow(SEED_MODEL_IDS.yamahaTrumpetStudent, 'vn_street', 12_000_000, 16_000_000),
      priceRow(SEED_MODEL_IDS.yamahaTrumpetStudent, 'msrp_global', 500, 700),
      priceRow(SEED_MODEL_IDS.bachTrumpetPro, 'vn_street', 80_000_000, 95_000_000),
      priceRow(SEED_MODEL_IDS.bachTrumpetPro, 'msrp_global', 2800, 3500),
      priceRow(SEED_MODEL_IDS.yamahaClarinetStudent, 'vn_street', 11_000_000, 15_000_000),
      priceRow(SEED_MODEL_IDS.yamahaClarinetStudent, 'msrp_global', 450, 650),
      priceRow(SEED_MODEL_IDS.buffetClarinetInt, 'vn_street', 28_000_000, 36_000_000),
      priceRow(SEED_MODEL_IDS.buffetClarinetInt, 'msrp_global', 1100, 1400),
      priceRow(SEED_MODEL_IDS.yamahaFluteStudent, 'vn_street', 10_000_000, 14_000_000),
      priceRow(SEED_MODEL_IDS.yamahaFluteStudent, 'msrp_global', 400, 600),
      priceRow(SEED_MODEL_IDS.yamahaAltoSaxStudent, 'vn_street', 18_000_000, 24_000_000),
      priceRow(SEED_MODEL_IDS.yamahaAltoSaxStudent, 'msrp_global', 700, 900),
      priceRow(SEED_MODEL_IDS.yamahaAltoSaxPro, 'vn_street', 70_000_000, 90_000_000),
      priceRow(SEED_MODEL_IDS.yamahaAltoSaxPro, 'msrp_global', 2500, 3200),
    ],
    questions: [
      { id: '77777777-7777-4777-8777-777777777701', key: 'level', required: 1, promptVi: 'Trình độ hiện tại của bạn?' },
      { id: '77777777-7777-4777-8777-777777777702', key: 'purpose', required: 1, promptVi: 'Bạn chơi kèn để làm gì?' },
      { id: '77777777-7777-4777-8777-777777777703', key: 'budget', required: 1, promptVi: 'Ngân sách dự kiến?' },
      { id: '77777777-7777-4777-8777-777777777704', key: 'age', required: 0, promptVi: 'Độ tuổi người chơi?' },
      {
        id: '77777777-7777-4777-8777-777777777705',
        key: 'sectionPreference',
        required: 0,
        promptVi: 'Bạn nghiêng về kèn đồng, kèn gỗ, hay chưa quyết định?',
      },
      {
        id: '77777777-7777-4777-8777-777777777706',
        key: 'physicalNotes',
        required: 0,
        promptVi: 'Có lưu ý thể chất nào không (niềng răng, tay nhỏ, hen suyễn)?',
      },
    ],
  };
}

export async function seedDatabase(db: Database): Promise<void> {
  const rows = seedCatalogRows();

  await db.insert(questionSets).values({ id: SEED_QUESTION_SET_ID, status: 'published' }).onConflictDoNothing();
  await db
    .insert(questions)
    .values(rows.questions.map((question) => ({ ...question, questionSetId: SEED_QUESTION_SET_ID })))
    .onConflictDoNothing();

  await db.insert(ruleSets).values({ id: SEED_RULE_SET_ID, status: 'published' }).onConflictDoNothing();
  await db
    .insert(rules)
    .values(
      SEED_RULES.map((rule) => ({
        id: rule.id,
        ruleSetId: SEED_RULE_SET_ID,
        kind: rule.kind,
        target: rule.target,
        condition: rule.condition,
        effect: rule.effect,
        reasonTemplateVi: rule.reasonTemplateVi,
        reasonTemplateEn: rule.reasonTemplateEn,
      })),
    )
    .onConflictDoNothing();

  await db.insert(instrumentFamilies).values(rows.families).onConflictDoNothing();
  await db.insert(instrumentModels).values(rows.models).onConflictDoNothing();
  await db.insert(pricePoints).values(rows.prices).onConflictDoNothing();
}
