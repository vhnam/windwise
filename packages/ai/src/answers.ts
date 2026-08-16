import type { ConsultationAnswerRecord } from '@windwise/db';
import { CriteriaKeys, parseStoredCriteriaValue, type Criteria, type PartialCriteria } from '@windwise/schemas';

export function mergeCriteria(base: PartialCriteria, patch: PartialCriteria): PartialCriteria {
  return {
    ...base,
    ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
  };
}

function serializeCriteriaValue(value: NonNullable<PartialCriteria[keyof PartialCriteria]>): string {
  return Array.isArray(value) ? value.join(',') : String(value);
}

function isCriteriaKey(key: string): key is keyof Criteria {
  return (CriteriaKeys as string[]).includes(key);
}

export function criteriaToAnswers(
  sessionId: string,
  criteria: PartialCriteria,
  source: ConsultationAnswerRecord['source'],
  rawValue?: string,
): ConsultationAnswerRecord[] {
  return CriteriaKeys.flatMap((key) => {
    const value = criteria[key];
    if (value === undefined) {
      return [];
    }
    const normalizedValue = serializeCriteriaValue(value);
    return [
      {
        sessionId,
        questionKey: key,
        rawValue: rawValue ?? normalizedValue,
        normalizedValue,
        source,
      },
    ];
  });
}

export function answersToCriteria(answers: Array<{ questionKey: string; normalizedValue: string }>): PartialCriteria {
  const criteria: PartialCriteria = {};
  for (const answer of answers) {
    if (!isCriteriaKey(answer.questionKey)) {
      continue;
    }
    try {
      (criteria as Record<string, unknown>)[answer.questionKey] = parseStoredCriteriaValue(
        answer.questionKey,
        answer.normalizedValue,
      );
    } catch {
      continue;
    }
  }
  return criteria;
}
