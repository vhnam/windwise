import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useTable } from '@tanstack/react-table';

import type { ModelStatus } from '@windwise/schemas';

import { listCatalogRecordsQueryOptions } from '#/queries/catalog';
import { CATALOG_PAGE_SIZE } from '#/services/catalog.service';

import { catalogListColumns } from './catalog-list-columns';
import { catalogListTableFeatures } from './catalog-list-features';

const catalogRoute = getRouteApi('/_protected/catalog/');

export const useCatalogListActions = () => {
  const search = catalogRoute.useSearch();
  const navigate = catalogRoute.useNavigate();
  const page = search.page ?? 1;

  const query = useQuery(
    listCatalogRecordsQueryOptions({
      status: search.status,
      page,
      pageSize: CATALOG_PAGE_SIZE,
    }),
  );

  const records = query.data?.items ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const pageSize = query.data?.pageSize ?? CATALOG_PAGE_SIZE;
  const currentPage = query.data?.page ?? page;

  const table = useTable({
    features: catalogListTableFeatures,
    data: records,
    columns: catalogListColumns,
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: totalCount,
    autoResetPageIndex: false,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const current = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === 'function' ? updater(current) : updater;

      void navigate({
        search: {
          status: search.status,
          page: next.pageIndex <= 0 ? undefined : next.pageIndex + 1,
        },
      });
    },
  });

  const setStatus = (status?: ModelStatus) => {
    void navigate({
      search: {
        status,
        page: undefined,
      },
    });
  };

  return {
    table,
    search,
    setStatus,
    isPending: query.isPending && !query.data,
    isError: query.isError,
    error: query.error,
    totalCount,
  };
};
