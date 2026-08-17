import { Link, createFileRoute } from '@tanstack/react-router';
import * as v from 'valibot';

import type { ModelStatus } from '@windwise/schemas';
import { Badge } from '@windwise/ui/components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import { listCatalogRecordsFn } from '#/lib/server/catalog';

type CatalogSearch = { status?: ModelStatus };

export const Route = createFileRoute('/_protected/catalog/')({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
    const parsed = v.safeParse(v.picklist(['draft', 'in_review', 'published', 'archived']), search.status);
    return { status: parsed.success ? parsed.output : undefined };
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => listCatalogRecordsFn({ data: { status: deps.status } }),
  component: CatalogListRoute,
});

const STATUS_LABEL: Record<ModelStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  published: 'Published',
  archived: 'Archived',
};

function CatalogListRoute() {
  const records = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Catalog records</h1>
        <Link to="/catalog/$modelId/edit" params={{ modelId: 'new' }} className="text-sm underline">
          + New record
        </Link>
      </div>
      <div className="flex gap-2 mb-4">
        {(['draft', 'in_review', 'published', 'archived'] as const).map((status) => (
          <Link
            key={status}
            to="/catalog"
            search={{ status: search.status === status ? undefined : status }}
            className="text-sm"
          >
            <Badge variant={search.status === status ? 'default' : 'outline'}>{STATUS_LABEL[status]}</Badge>
          </Link>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Display name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Completeness</TableHead>
            <TableHead>Last verified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <Link to="/catalog/$modelId/edit" params={{ modelId: record.id }} className="underline">
                  {record.displayName}
                </Link>
              </TableCell>
              <TableCell>
                <Badge>{STATUS_LABEL[record.status]}</Badge>
              </TableCell>
              <TableCell>{record.dataCompleteness}%</TableCell>
              <TableCell>{record.lastVerifiedAt.toString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
