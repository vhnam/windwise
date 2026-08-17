import * as v from 'valibot';

import { PriceScopeSchema, SourceKindSchema } from '@windwise/schemas';

const requiredSelection = (label: string) =>
  v.pipe(v.string(`Please select a ${label}.`), v.trim(), v.nonEmpty(`Please select a ${label}.`));

const optionalText = v.pipe(v.string(), v.trim());

const optionalUrl = v.pipe(
  v.string(),
  v.trim(),
  v.union([v.literal(''), v.pipe(v.string(), v.url('Enter a valid URL.'))]),
);

const optionalImageUrl = v.pipe(
  v.string(),
  v.trim(),
  v.union([
    v.literal(''),
    v.pipe(v.string(), v.startsWith('data:image/')),
    v.pipe(v.string(), v.url('Enter a valid URL.')),
  ]),
);

export const CatalogEditSchema = v.object({
  brandId: requiredSelection('brand'),
  familyId: requiredSelection('family'),
  modelCode: v.pipe(v.string('Please enter a model code.'), v.trim(), v.nonEmpty('Please enter a model code.')),
  displayName: v.pipe(v.string('Please enter a display name.'), v.trim(), v.nonEmpty('Please enter a display name.')),
  priceScope: v.union([v.literal(''), PriceScopeSchema]),
  priceAmountMin: optionalText,
  priceAmountMax: optionalText,
  imageUrl: optionalImageUrl,
  imageAltEn: optionalText,
  imageCredit: optionalText,
  sourceKind: v.union([v.literal(''), SourceKindSchema]),
  sourceUrl: optionalUrl,
  sourcePublisher: optionalText,
});

export type CatalogEditSchemaType = v.InferOutput<typeof CatalogEditSchema>;
