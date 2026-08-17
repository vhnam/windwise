import { createFileRoute } from '@tanstack/react-router';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import { getAuditTrailFn } from '#/lib/server/catalog';

export const Route = createFileRoute('/_protected/audit/$entityId')({
  loader: async ({ params }) => getAuditTrailFn({ data: { entity: 'instrument_model', entityId: params.entityId } }),
  component: AuditTrailRoute,
});

function AuditTrailRoute() {
  const { entries } = Route.useLoaderData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">History</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Changed fields</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={`${entry.at}-${index}`}>
                <TableCell>{entry.at}</TableCell>
                <TableCell>{entry.actorDisplayName}</TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell>
                  {entry.diff.map((d) => (
                    <div key={d.field} className="text-xs">
                      <span className="font-medium">{d.field}</span>: {JSON.stringify(d.before)} →{' '}
                      {JSON.stringify(d.after)}
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
