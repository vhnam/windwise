import { createFileRoute } from '@tanstack/react-router';

import { getAuditTrailFn } from '#/lib/server/catalog';
import { CatalogAudit } from '#/modules/catalog/catalog-audit';

type AuditSearch = { page?: number };

const readPage = (value: unknown): number | undefined => {
  const page = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isInteger(page) && page > 1 ? page : undefined;
};

export const Route = createFileRoute('/_protected/audit/$entityId')({
  validateSearch: (search: Record<string, unknown>): AuditSearch => ({
    page: readPage(search.page),
  }),
  loader: async ({ params }) => getAuditTrailFn({ data: { entity: 'instrument_model', entityId: params.entityId } }),
  component: CatalogAudit,
});
