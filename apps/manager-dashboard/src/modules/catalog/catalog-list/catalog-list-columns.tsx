import { Link } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@windwise/ui/components/dropdown-menu';

import type { CatalogRecord } from '#/services/catalog.service';

import { STATUS_LABEL } from '../catalog-status';
import { type CatalogListColumnMeta, type CatalogListTableFeatures } from './catalog-list-features';

const columnHelper = createColumnHelper<CatalogListTableFeatures, CatalogRecord>();

const formatVerifiedAt = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export const catalogListColumns = columnHelper.columns([
  columnHelper.accessor('displayName', {
    header: 'Display name',
    cell: ({ row }) => (
      <Link to="/catalog/$modelId/edit" params={{ modelId: row.original.id }} className="hover:underline">
        {row.original.displayName}
      </Link>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'published' ? 'default' : 'secondary'}>
        {STATUS_LABEL[row.original.status]}
      </Badge>
    ),
  }),
  columnHelper.accessor('dataCompleteness', {
    header: 'Completeness',
    meta: {
      className: 'text-right',
    } satisfies CatalogListColumnMeta,
    cell: ({ row }) => `${row.original.dataCompleteness}%`,
  }),
  columnHelper.accessor('lastVerifiedAt', {
    header: 'Last verified',
    meta: {
      className: 'text-right',
    } satisfies CatalogListColumnMeta,
    cell: ({ row }) => formatVerifiedAt(row.original.lastVerifiedAt),
  }),
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    meta: {
      className: 'w-12 text-right',
    } satisfies CatalogListColumnMeta,
    cell: ({ row }) => {
      const record = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to="/catalog/$modelId/edit" params={{ modelId: record.id }} />}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/audit/$entityId" params={{ entityId: record.id }} />}>
                View history
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
