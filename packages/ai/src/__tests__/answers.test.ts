import { describe, expect, it } from 'vite-plus/test';

import type { PartialCriteria } from '@windwise/schemas';

import { answersToCriteria, criteriaToAnswers } from '../answers.ts';

describe('criteria answer mapping', () => {
  it('round-trips form criteria without the consumer listing field names', () => {
    const criteria = {
      level: 'beginner',
      purpose: 'school',
      budget: 'under_20m',
      age: '8_11',
      physicalNotes: ['braces', 'small_hands'],
    } satisfies PartialCriteria;

    const answers = criteriaToAnswers('session-1', criteria, 'form');

    expect(answers.map((answer) => answer.questionKey)).toEqual(['level', 'purpose', 'budget', 'age', 'physicalNotes']);
    expect(answersToCriteria(answers)).toEqual({
      level: 'beginner',
      purpose: 'school',
      budget: 'under_20m',
      age: '8_11',
      physicalNotes: ['braces', 'small_hands'],
    });
  });

  it('parses numeric stored answers from the field schema', () => {
    expect(answersToCriteria([{ questionKey: 'budgetCeilingVnd', normalizedValue: '5000000' }])).toEqual({
      budgetCeilingVnd: 5_000_000,
    });
  });
});
