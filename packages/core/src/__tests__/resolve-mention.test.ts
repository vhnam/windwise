import { describe, expect, it } from 'vite-plus/test';

import type { RawCandidateRow } from '@windwise/schemas';

import { resolveMention } from '../resolve-mention.ts';

const ambiguousYamaha: RawCandidateRow[] = [
  {
    modelId: 'mod-trumpet-student',
    displayName: 'Yamaha YTR-2330',
    matchedAlias: 'yamaha',
    similarity: 0.72,
  },
  {
    modelId: 'mod-clarinet-student',
    displayName: 'Yamaha YCL-255',
    matchedAlias: 'yamaha',
    similarity: 0.7,
  },
  {
    modelId: 'mod-flute-student',
    displayName: 'Yamaha YFL-222',
    matchedAlias: 'yamaha yfl',
    similarity: 0.68,
  },
];

describe('resolveMention', () => {
  it('is deterministic for identical raw candidates', () => {
    const first = resolveMention(ambiguousYamaha);
    const second = resolveMention(ambiguousYamaha);

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('never collapses ambiguous input to a single candidate', () => {
    const ranked = resolveMention(ambiguousYamaha);

    expect(ranked.length).toBeGreaterThan(1);
    expect(ranked.map((row) => row.modelId).sort()).toEqual([
      'mod-clarinet-student',
      'mod-flute-student',
      'mod-trumpet-student',
    ]);
    expect(ranked[0]?.confidence).toBeGreaterThanOrEqual(ranked[1]?.confidence ?? 0);
  });

  it('dedupes by modelId keeping the highest-scoring alias', () => {
    const ranked = resolveMention([
      {
        modelId: 'mod-trumpet-student',
        displayName: 'Yamaha YTR-2330',
        matchedAlias: 'ytr',
        similarity: 0.5,
      },
      {
        modelId: 'mod-trumpet-student',
        displayName: 'Yamaha YTR-2330',
        matchedAlias: 'ytr-2330',
        similarity: 0.95,
      },
    ]);

    expect(ranked).toEqual([
      {
        modelId: 'mod-trumpet-student',
        displayName: 'Yamaha YTR-2330',
        confidence: 0.95,
        matchedAlias: 'ytr-2330',
      },
    ]);
  });
});
