import { createServerFn } from '@tanstack/react-start';
import * as v from 'valibot';

import { ListingFiltersSchema } from '@windwise/schemas';

export const listInstrumentsFn = createServerFn({ method: 'GET' })
  .validator(ListingFiltersSchema)
  .handler(async ({ data }) => {
    const { getDb, listPublishedInstruments } = await import('@windwise/db');
    return listPublishedInstruments(getDb(), data);
  });

export const getInstrumentDetailFn = createServerFn({ method: 'GET' })
  .validator(v.object({ modelId: v.string() }))
  .handler(async ({ data }) => {
    const { getDb, getInstrumentDetail } = await import('@windwise/db');
    return getInstrumentDetail(getDb(), data.modelId);
  });

export const getCatalogFacetsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getDb, listCatalogFacets } = await import('@windwise/db');
  return listCatalogFacets(getDb());
});

export type ListInstrumentsResult = Awaited<ReturnType<typeof listInstrumentsFn>>;
export type InstrumentDetailResult = Awaited<ReturnType<typeof getInstrumentDetailFn>>;
