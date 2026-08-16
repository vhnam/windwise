import { describe, expect, it } from 'vite-plus/test';

import { UnmappedCriteriaError } from '../errors.ts';
import { heuristicNormalize } from '../normalize.ts';

describe('heuristicNormalize', () => {
  it('maps a natural Vietnamese opener to level, budget, and brass — not purpose', () => {
    const criteria = heuristicNormalize(
      'tui mới chơi, đang phân vân giữa trumpet hoặc trombone. cần kèn đẹp, giá tầm 5 triệu',
    );

    expect(criteria).toMatchObject({
      level: 'beginner',
      budget: 'under_20m',
      budgetCeilingVnd: 5_000_000,
      sectionPreference: 'brass',
    });
    expect(criteria.purpose).toBeUndefined();
  });

  it('still accepts the explicit band phrases used by the form', () => {
    expect(heuristicNormalize('Mới bắt đầu, học ở trường, dưới 20 triệu')).toMatchObject({
      level: 'beginner',
      purpose: 'school',
      budget: 'under_20m',
    });
  });

  it('bands numeric triệu amounts', () => {
    expect(heuristicNormalize('ngân sách 25 triệu').budget).toBe('20_50m');
    expect(heuristicNormalize('khoảng 80tr').budget).toBe('50_100m');
    expect(heuristicNormalize('tầm 150 triệu').budget).toBe('over_100m');
  });

  it('keeps a single instrument family when only one is named', () => {
    expect(heuristicNormalize('muốn học trumpet').sectionPreference).toBe('trumpet');
  });

  it('throws when nothing maps', () => {
    expect(() => heuristicNormalize('kèn đẹp quá')).toThrow(UnmappedCriteriaError);
  });
});
