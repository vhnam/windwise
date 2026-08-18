import type { ModelStatus } from '@windwise/schemas';

import { listCatalogRecordsFn } from '#/lib/server/catalog';

export const CATALOG_PAGE_SIZE = 20;

export type CatalogRecord = {
  id: string;
  displayName: string;
  status: ModelStatus;
  dataCompleteness: number;
  lastVerifiedAt: string;
};

export type CatalogListResult = {
  items: CatalogRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
};

const toIsoString = (value: Date | string) => (value instanceof Date ? value.toISOString() : String(value));

export const listCatalogRecords = async (filters: {
  status?: ModelStatus;
  page?: number;
  pageSize?: number;
}): Promise<CatalogListResult> => {
  const result = await listCatalogRecordsFn({
    data: {
      status: filters.status,
      page: filters.page,
      pageSize: filters.pageSize ?? CATALOG_PAGE_SIZE,
    },
  });

  return {
    items: result.items.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      status: row.status,
      dataCompleteness: row.dataCompleteness,
      lastVerifiedAt: toIsoString(row.lastVerifiedAt),
    })),
    totalCount: result.totalCount,
    page: result.page,
    pageSize: result.pageSize,
  };
};
