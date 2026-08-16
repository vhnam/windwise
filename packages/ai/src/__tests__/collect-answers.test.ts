import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@windwise/db', () => ({
  getSessionState: vi.fn(),
  saveAnswers: vi.fn(),
}));

import { getSessionState, saveAnswers } from '@windwise/db';

import { collectAnswers } from '../tools.ts';

describe('collectAnswers', () => {
  it('persists heuristic-normalized chat answers and reports missing required keys', async () => {
    vi.mocked(getSessionState).mockResolvedValue({
      session: {
        id: 'session-1',
        anonId: 'anon-1',
        questionSetId: 'qs-1',
        intent: 'discover',
        locale: 'vi',
        status: 'in_progress',
        startedAt: new Date('2026-01-01T00:00:00.000Z'),
        completedAt: null,
      },
      answers: [],
    });
    vi.mocked(saveAnswers).mockResolvedValue(undefined);

    const output = await collectAnswers({} as never, {
      sessionId: 'session-1',
      message: 'Mới bắt đầu, học ở trường, dưới 20 triệu',
    });

    expect(output.criteria).toMatchObject({
      level: 'beginner',
      purpose: 'school',
      budget: 'under_20m',
    });
    expect(output.missingRequired).toEqual([]);
    expect(saveAnswers).toHaveBeenCalledWith(
      {},
      'session-1',
      expect.arrayContaining([
        expect.objectContaining({ questionKey: 'level', normalizedValue: 'beginner', source: 'chat' }),
        expect.objectContaining({ questionKey: 'purpose', normalizedValue: 'school', source: 'chat' }),
        expect.objectContaining({ questionKey: 'budget', normalizedValue: 'under_20m', source: 'chat' }),
      ]),
    );
  });
});
