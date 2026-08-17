import { createColumnHelper } from '@tanstack/react-table';

import type { AuditTrailEntry } from '@windwise/schemas';
import { Badge } from '@windwise/ui/components/badge';

import { CatalogAuditDiffDialog } from './catalog-audit-diff-dialog';
import { type CatalogAuditTableFeatures } from './catalog-audit-features';
import { AUDIT_ACTION_LABEL, AUDIT_ACTION_VARIANT, formatAuditWhen } from './catalog-audit-format';

const columnHelper = createColumnHelper<CatalogAuditTableFeatures, AuditTrailEntry>();

export const catalogAuditColumns = columnHelper.columns([
  columnHelper.accessor('at', {
    header: 'When',
    cell: ({ row }) => (
      <time className="whitespace-nowrap text-foreground" dateTime={row.original.at}>
        {formatAuditWhen(row.original.at)}
      </time>
    ),
  }),
  columnHelper.accessor('actorDisplayName', {
    header: 'Actor',
    cell: ({ row }) => <span className="wrap-anywhere">{row.original.actorDisplayName}</span>,
  }),
  columnHelper.accessor('action', {
    header: 'Action',
    cell: ({ row }) => (
      <Badge variant={AUDIT_ACTION_VARIANT[row.original.action]}>{AUDIT_ACTION_LABEL[row.original.action]}</Badge>
    ),
  }),
  columnHelper.display({
    id: 'changes',
    header: 'Changes',
    cell: ({ row }) => <CatalogAuditDiffDialog entry={row.original} />,
  }),
]);
