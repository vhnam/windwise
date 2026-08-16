import type { CatalogSnapshot, Criteria, RuleSet } from '@windwise/schemas';

const verified = '2026-01-15T00:00:00.000Z';

export const fixtureCriteriaRequiredOnly: Criteria = {
  level: 'beginner',
  purpose: 'school',
  budget: 'under_20m',
};

export const fixtureCriteriaBraces: Criteria = {
  level: 'beginner',
  purpose: 'marching',
  budget: 'under_20m',
  physicalNotes: ['braces'],
};

export const fixtureCriteriaAgeExcluded: Criteria = {
  level: 'beginner',
  purpose: 'school',
  budget: 'under_20m',
  age: 'under_8',
};

export const fixtureCatalog: CatalogSnapshot = {
  families: [
    {
      id: 'fam-trumpet',
      slug: 'trumpet',
      section: 'brass',
      nameVi: 'Kèn trumpet',
      nameEn: 'Trumpet',
      beginnerDifficulty: 3,
      minRecommendedAge: 8,
      physicalDemand: 4,
      typicalEnsembles: ['school', 'marching', 'concert_band'],
    },
    {
      id: 'fam-clarinet',
      slug: 'clarinet',
      section: 'woodwind',
      nameVi: 'Kèn clarinet',
      nameEn: 'Clarinet',
      beginnerDifficulty: 2,
      minRecommendedAge: 8,
      physicalDemand: 2,
      typicalEnsembles: ['school', 'concert_band'],
    },
    {
      id: 'fam-flute',
      slug: 'flute',
      section: 'woodwind',
      nameVi: 'Sáo flute',
      nameEn: 'Flute',
      beginnerDifficulty: 2,
      minRecommendedAge: 8,
      physicalDemand: 2,
      typicalEnsembles: ['school', 'concert_band'],
    },
    {
      id: 'fam-alto-sax',
      slug: 'alto-sax',
      section: 'woodwind',
      nameVi: 'Saxophone alto',
      nameEn: 'Alto saxophone',
      beginnerDifficulty: 2,
      minRecommendedAge: 10,
      physicalDemand: 3,
      typicalEnsembles: ['school', 'jazz'],
    },
  ],
  models: [
    {
      id: 'mod-trumpet-student',
      brandId: 'brand-1',
      familyId: 'fam-trumpet',
      modelCode: 'YTR-2330',
      displayName: 'Yamaha YTR-2330',
      levelTier: 'student',
      status: 'published',
      lastVerifiedAt: verified,
      sourceUrl: 'https://example.com/instruments/YTR-2330',
    },
    {
      id: 'mod-trumpet-pro',
      brandId: 'brand-1',
      familyId: 'fam-trumpet',
      modelCode: '180S37',
      displayName: 'Bach 180S37',
      levelTier: 'professional',
      status: 'published',
      lastVerifiedAt: verified,
      sourceUrl: 'https://example.com/instruments/180S37',
    },
    {
      id: 'mod-clarinet-student',
      brandId: 'brand-1',
      familyId: 'fam-clarinet',
      modelCode: 'YCL-255',
      displayName: 'Yamaha YCL-255',
      levelTier: 'student',
      status: 'published',
      lastVerifiedAt: verified,
      sourceUrl: 'https://example.com/instruments/YCL-255',
    },
    {
      id: 'mod-flute-student',
      brandId: 'brand-1',
      familyId: 'fam-flute',
      modelCode: 'YFL-222',
      displayName: 'Yamaha YFL-222',
      levelTier: 'student',
      status: 'published',
      lastVerifiedAt: verified,
      sourceUrl: 'https://example.com/instruments/YFL-222',
    },
    {
      id: 'mod-alto-student',
      brandId: 'brand-1',
      familyId: 'fam-alto-sax',
      modelCode: 'YAS-280',
      displayName: 'Yamaha YAS-280',
      levelTier: 'student',
      status: 'published',
      lastVerifiedAt: verified,
      sourceUrl: 'https://example.com/instruments/YAS-280',
    },
    {
      id: 'mod-draft',
      brandId: 'brand-1',
      familyId: 'fam-flute',
      modelCode: 'DRAFT-1',
      displayName: 'Draft flute',
      levelTier: 'student',
      status: 'draft',
      lastVerifiedAt: verified,
      sourceUrl: 'https://example.com/instruments/DRAFT-1',
    },
  ],
  prices: [
    {
      modelId: 'mod-trumpet-student',
      scope: 'vn_street',
      amountMin: 12_000_000,
      amountMax: 16_000_000,
      isCurrent: true,
    },
    { modelId: 'mod-trumpet-pro', scope: 'vn_street', amountMin: 80_000_000, amountMax: 95_000_000, isCurrent: true },
    {
      modelId: 'mod-clarinet-student',
      scope: 'vn_street',
      amountMin: 11_000_000,
      amountMax: 15_000_000,
      isCurrent: true,
    },
    { modelId: 'mod-flute-student', scope: 'vn_street', amountMin: 10_000_000, amountMax: 14_000_000, isCurrent: true },
    { modelId: 'mod-alto-student', scope: 'vn_street', amountMin: 18_000_000, amountMax: 19_500_000, isCurrent: true },
    { modelId: 'mod-draft', scope: 'vn_street', amountMin: 9_000_000, amountMax: 12_000_000, isCurrent: true },
  ],
};

export const fixtureRuleSet: RuleSet = {
  ruleSetId: 'rules-v1',
  rules: [
    {
      id: 'rule-beginner-pro',
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
      id: 'rule-age',
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
      reasonTemplateVi: 'Hãy cân nhắc độ tuổi lớn hơn hoặc chọn họ kèn có tuổi tối thiểu thấp hơn.',
      reasonTemplateEn: 'Consider a higher age band or a family with a lower minimum age.',
    },
    {
      id: 'rule-braces',
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
      id: 'rule-school',
      kind: 'modifier',
      target: 'family',
      condition: { op: 'includes', field: 'family.typicalEnsembles', value: 'school' },
      effect: { type: 'score', delta: 12 },
      reasonTemplateVi: 'Phù hợp với mục đích học đường.',
      reasonTemplateEn: 'Fits a school purpose.',
    },
    {
      id: 'rule-student',
      kind: 'modifier',
      target: 'model',
      condition: { op: 'equals', field: 'model.levelTier', value: 'student' },
      effect: { type: 'score', delta: 8 },
      reasonTemplateVi: 'Mẫu học sinh phù hợp trình độ người mới.',
      reasonTemplateEn: 'Student-tier models fit beginners.',
    },
  ],
};
