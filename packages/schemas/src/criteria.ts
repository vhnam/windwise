import * as v from 'valibot';

import { isOptionalCriteriaSchema } from './criteria-inspect.ts';

export const LevelSchema = v.picklist(['beginner', 'intermediate', 'advanced', 'professional']);
export type Level = v.InferOutput<typeof LevelSchema>;

export const PurposeSchema = v.picklist(['school', 'concert_band', 'jazz', 'orchestra', 'marching', 'personal']);
export type Purpose = v.InferOutput<typeof PurposeSchema>;

export const BudgetSchema = v.picklist(['under_20m', '20_50m', '50_100m', 'over_100m']);
export type Budget = v.InferOutput<typeof BudgetSchema>;

export const AgeBandSchema = v.picklist(['under_8', '8_11', '12_14', '15_plus']);
export type AgeBand = v.InferOutput<typeof AgeBandSchema>;

export const SectionPreferenceSchema = v.picklist([
  'undecided',
  'brass',
  'woodwind',
  'trumpet',
  'clarinet',
  'flute',
  'alto-sax',
]);
export type SectionPreference = v.InferOutput<typeof SectionPreferenceSchema>;

export const PhysicalNoteSchema = v.picklist(['braces', 'small_hands', 'asthma']);
export type PhysicalNote = v.InferOutput<typeof PhysicalNoteSchema>;

export const CriteriaSchema = v.object({
  level: LevelSchema,
  purpose: PurposeSchema,
  budget: BudgetSchema,
  age: v.optional(AgeBandSchema),
  sectionPreference: v.optional(SectionPreferenceSchema),
  physicalNotes: v.optional(v.array(PhysicalNoteSchema)),
  // Chat-only: a stated VND amount (e.g. "tầm 5 triệu") used as a hard ceiling
  // inside the budget band. The form never sets this.
  budgetCeilingVnd: v.optional(v.number()),
});
export type Criteria = v.InferOutput<typeof CriteriaSchema>;

export const PartialCriteriaSchema = v.partial(CriteriaSchema);
export type PartialCriteria = v.InferOutput<typeof PartialCriteriaSchema>;

export const CriteriaKeys = Object.keys(CriteriaSchema.entries) as Array<keyof Criteria>;

export type RequiredCriteriaKey = {
  [Key in keyof Criteria]-?: undefined extends Criteria[Key] ? never : Key;
}[keyof Criteria];

export function isRequiredCriteriaKey(key: keyof Criteria): key is RequiredCriteriaKey {
  return !isOptionalCriteriaSchema(CriteriaSchema.entries[key]);
}

export const RequiredCriteriaKeys = CriteriaKeys.filter(isRequiredCriteriaKey);
export const RequiredCriteriaKeysSchema = RequiredCriteriaKeys;

export function missingRequiredCriteria(criteria: PartialCriteria): RequiredCriteriaKey[] {
  return RequiredCriteriaKeys.filter((key) => criteria[key] === undefined);
}
