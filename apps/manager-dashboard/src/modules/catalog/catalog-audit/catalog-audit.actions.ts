import { getRouteApi } from '@tanstack/react-router';
import { useTable } from '@tanstack/react-table';

import { catalogAuditColumns } from './catalog-audit-columns';
import { catalogAuditTableFeatures } from './catalog-audit-features';

export const AUDIT_PAGE_SIZE = 10;

const auditRoute = getRouteApi('/_protected/audit/$entityId');

export const useCatalogAuditActions = () => {
  const { entityId } = auditRoute.useParams();
  const { entries } = auditRoute.useLoaderData();
  const search = auditRoute.useSearch();
  const navigate = auditRoute.useNavigate();

  const totalCount = entries.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / AUDIT_PAGE_SIZE));
  const currentPage = Math.min(search.page ?? 1, pageCount);

  const table = useTable({
    features: catalogAuditTableFeatures,
    data: entries,
    columns: catalogAuditColumns,
    getRowId: (row, index) => `${row.at}-${row.action}-${index}`,
    autoResetPageIndex: false,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: AUDIT_PAGE_SIZE,
      },
    },
    onPaginationChange: (updater) => {
      const current = { pageIndex: currentPage - 1, pageSize: AUDIT_PAGE_SIZE };
      const next = typeof updater === 'function' ? updater(current) : updater;

      void navigate({
        search: {
          page: next.pageIndex <= 0 ? undefined : next.pageIndex + 1,
        },
      });
    },
  });

  return {
    table,
    entityId,
    totalCount,
    pageCount,
    currentPage,
  };
};
