export type InstrumentModelCompleteness = {
  brandId: string | null | undefined;
  familyId: string | null | undefined;
  modelCode: string | null | undefined;
  displayName: string | null | undefined;
  hasCurrentPrice: boolean;
  hasPrimaryImage: boolean;
  hasSource: boolean;
};

const REQUIRED_FIELDS = ['brandId', 'familyId', 'modelCode', 'displayName', 'price', 'primaryImage', 'source'] as const;

export function getRequiredFields(entityType: 'instrument_model'): readonly string[] {
  void entityType;
  return REQUIRED_FIELDS;
}

export function computeMissingFields(entityType: 'instrument_model', record: InstrumentModelCompleteness): string[] {
  void entityType;
  const missing: string[] = [];

  if (!record.brandId) missing.push('brandId');
  if (!record.familyId) missing.push('familyId');
  if (!record.modelCode) missing.push('modelCode');
  if (!record.displayName) missing.push('displayName');
  if (!record.hasCurrentPrice) missing.push('price');
  if (!record.hasPrimaryImage) missing.push('primaryImage');
  if (!record.hasSource) missing.push('source');

  return missing;
}

export function computeDataCompleteness(record: InstrumentModelCompleteness): number {
  const total = REQUIRED_FIELDS.length;
  const missing = computeMissingFields('instrument_model', record).length;
  return Math.round(((total - missing) / total) * 100);
}
