import { Link, createFileRoute } from '@tanstack/react-router';

import { Badge } from '@windwise/ui/components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import { getVerificationQueueFn } from '#/lib/server/catalog';

export const Route = createFileRoute('/_protected/verification-queue')({
  loader: async () => getVerificationQueueFn(),
  component: VerificationQueueRoute,
});

const REASON_LABEL: Record<string, string> = {
  stale: 'Stale',
  missing_fields: 'Missing fields',
  broken_source: 'Broken source',
};

function VerificationQueueRoute() {
  const { items } = Route.useLoaderData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Verification queue</h1>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published records need attention.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record</TableHead>
              <TableHead>Reasons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.modelId}>
                <TableCell>
                  <Link to="/catalog/$modelId/edit" params={{ modelId: item.modelId }} className="underline">
                    {item.displayName}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {item.reasons.map((reason) => (
                      <Badge key={reason.type} variant="destructive">
                        {REASON_LABEL[reason.type]}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
