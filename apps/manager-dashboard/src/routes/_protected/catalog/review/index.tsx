import { Link, createFileRoute } from '@tanstack/react-router';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import { listCatalogRecordsFn } from '#/lib/server/catalog';

export const Route = createFileRoute('/_protected/catalog/review/')({
  loader: async () => listCatalogRecordsFn({ data: { status: 'in_review' } }),
  component: ReviewQueueRoute,
});

function ReviewQueueRoute() {
  const { items: records } = Route.useLoaderData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Reviewer queue</h1>
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record</TableHead>
              <TableHead>Completeness</TableHead>
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
                <TableCell>{record.dataCompleteness}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
