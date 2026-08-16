import { describe, expect, it } from 'vite-plus/test';

import type { InstrumentModel, ModelComparisonNote, PricePoint } from '@windwise/schemas';

import { compareModelsCore } from '../compare-models.ts';

const verified = '2026-01-15T00:00:00.000Z';

const yamaha: InstrumentModel = {
  id: 'mod-trumpet-student',
  brandId: 'brand-1',
  familyId: 'fam-trumpet',
  modelCode: 'YTR-2330',
  displayName: 'Yamaha YTR-2330',
  levelTier: 'student',
  status: 'published',
  lastVerifiedAt: verified,
  sourceUrl: 'https://example.com/instruments/YTR-2330',
};

const bach: InstrumentModel = {
  id: 'mod-trumpet-pro',
  brandId: 'brand-1',
  familyId: 'fam-trumpet',
  modelCode: '180S37',
  displayName: 'Bach 180S37',
  levelTier: 'professional',
  status: 'published',
  lastVerifiedAt: verified,
  sourceUrl: 'https://example.com/instruments/180S37',
};

const prices: PricePoint[] = [
  {
    modelId: yamaha.id,
    scope: 'vn_street',
    amountMin: 12_000_000,
    amountMax: 16_000_000,
    isCurrent: true,
  },
  {
    modelId: bach.id,
    scope: 'vn_street',
    amountMin: 80_000_000,
    amountMax: 95_000_000,
    isCurrent: true,
  },
];

const publishedNote: ModelComparisonNote = {
  id: 'note-1',
  modelAId: bach.id < yamaha.id ? bach.id : yamaha.id,
  modelBId: bach.id < yamaha.id ? yamaha.id : bach.id,
  aspect: 'tone',
  noteVi: 'Bach sáng hơn.',
  noteEn: 'Bach is brighter.',
  sourceUrl: 'https://example.com/note',
  author: 'reviewer',
  reviewedBy: 'editor',
  publishedAt: verified,
};

describe('compareModelsCore', () => {
  it('renders a published note for the compared pair', () => {
    const result = compareModelsCore([yamaha, bach], prices, [publishedNote]);

    expect(result.notes).toEqual([{ aspect: 'tone', noteVi: 'Bach sáng hơn.', noteEn: 'Bach is brighter.' }]);
  });

  it('yields an empty notes array when no published note exists', () => {
    const unpublished: ModelComparisonNote = { ...publishedNote, publishedAt: null };
    const result = compareModelsCore([yamaha, bach], prices, [unpublished]);

    expect(result.notes).toEqual([]);
    expect(result.notes.some((note) => note.noteVi.includes('placeholder'))).toBe(false);
  });

  it('uses priority only for highlightedAspects and never drops a model or spec', () => {
    const withoutPriority = compareModelsCore([yamaha, bach], prices, [publishedNote]);
    const withPriority = compareModelsCore([yamaha, bach], prices, [publishedNote], 'budget');

    expect(withoutPriority.highlightedAspects).toEqual([]);
    expect(withPriority.highlightedAspects).toEqual(['budget']);
    expect(withPriority.models).toEqual(withoutPriority.models);
    expect(withPriority.models).toHaveLength(2);
    expect(withPriority.models.every((model) => model.tier && model.specs.displayName && model.price)).toBe(true);
  });
});
