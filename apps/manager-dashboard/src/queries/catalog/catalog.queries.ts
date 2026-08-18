import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { listCatalogRecords } from '#/services/catalog.service';

import { catalogQueryKeys, type CatalogListFilters } from './catalog.keys';

export const listCatalogRecordsQueryOptions = (filters: CatalogListFilters) =>
  queryOptions({
    queryKey: catalogQueryKeys.list(filters),
    queryFn: () => listCatalogRecords(filters),
    placeholderData: keepPreviousData,
    retry: false,
  });
