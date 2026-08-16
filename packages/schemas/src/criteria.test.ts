import * as v from 'valibot';
import { describe, expect, it } from 'vite-plus/test';

import { formCriteriaQuestions } from './criteria-form.ts';
import { CriteriaKeys, CriteriaSchema, RequiredCriteriaKeys, missingRequiredCriteria } from './criteria.ts';

describe('CriteriaSchema', () => {
  it('accepts required-only criteria', () => {
    const parsed = v.parse(CriteriaSchema, {
      level: 'beginner',
      purpose: 'school',
      budget: 'under_20m',
    });

    expect(parsed.level).toBe('beginner');
    expect(missingRequiredCriteria(parsed)).toEqual([]);
  });

  it('derives required keys from non-optional schema fields', () => {
    expect(RequiredCriteriaKeys).toEqual(['level', 'purpose', 'budget']);
  });

  it('lists every CriteriaSchema field so chat and form stay in lockstep', () => {
    expect(CriteriaKeys).toEqual(Object.keys(CriteriaSchema.entries));
  });

  it('builds form questions from picklist fields, not chat-only numbers', () => {
    expect(formCriteriaQuestions().map((question) => question.name)).toEqual([
      'level',
      'purpose',
      'budget',
      'age',
      'sectionPreference',
      'physicalNotes',
    ]);
  });
});
