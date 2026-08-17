import type { ModelStatus } from '@windwise/schemas';

export type CatalogListFilters = {
  status?: ModelStatus;
  page: number;
  pageSize: number;
};

export const catalogQueryKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogQueryKeys.all, 'list'] as const,
  list: (filters: CatalogListFilters) => [...catalogQueryKeys.lists(), filters] as const,
};
