import { createFileRoute } from '@tanstack/react-router';
import * as v from 'valibot';

import { STATUS_FILTERS, type ModelStatus } from '@windwise/schemas';

import { CatalogList } from '#/modules/catalog/catalog-list';

type CatalogSearch = { status?: ModelStatus; page?: number };

const readPage = (value: unknown): number | undefined => {
  const page = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isInteger(page) && page > 1 ? page : undefined;
};

export const Route = createFileRoute('/_protected/catalog/')({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
    const parsed = v.safeParse(v.picklist(STATUS_FILTERS), search.status);
    return {
      status: parsed.success ? parsed.output : undefined,
      page: readPage(search.page),
    };
  },
  component: CatalogList,
});
