import { Link } from '@tanstack/react-router';
import { ClockIcon, Link2OffIcon, ListXIcon, ShieldCheckIcon } from 'lucide-react';

import type { QueueReason, VerificationQueueItem } from '@windwise/schemas';
import { Badge } from '@windwise/ui/components/badge';
import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';

import { CatalogVerificationHeader } from './catalog-verification-header';
import { useCatalogVerificationActions } from './catalog-verification.actions';

const FIELD_LABEL: Record<string, string> = {
  brandId: 'Brand',
  familyId: 'Family',
  modelCode: 'Model code',
  displayName: 'Display name',
  price: 'Price',
  primaryImage: 'Primary image',
  source: 'Source',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const countByReason = (items: VerificationQueueItem[]) => {
  const counts = { stale: 0, missing_fields: 0, broken_source: 0 };
  for (const item of items) {
    for (const reason of item.reasons) {
      counts[reason.type] += 1;
    }
  }
  return counts;
};

function ReasonDetails({ reason }: { reason: QueueReason }) {
  if (reason.type === 'stale') {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="secondary" className="max-w-full">
          <ClockIcon aria-hidden="true" />
          <span className="min-w-0 truncate">Stale</span>
        </Badge>
        <p className="min-w-0 text-xs text-muted-foreground">
          Last verified {formatDate(reason.lastVerifiedAt)} · {reason.daysOverThreshold}{' '}
          {reason.daysOverThreshold === 1 ? 'day' : 'days'} past threshold
        </p>
      </div>
    );
  }

  if (reason.type === 'missing_fields') {
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        <Badge variant="outline" className="max-w-full">
          <ListXIcon aria-hidden="true" />
          <span className="min-w-0 truncate">Missing fields</span>
        </Badge>
        <ul className="flex min-w-0 flex-wrap gap-1">
          {reason.fields.map((field) => (
            <li key={field}>
              <Badge variant="outline">
                <span className="min-w-0 truncate">{FIELD_LABEL[field] ?? field}</span>
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Badge variant="destructive" className="max-w-full">
        <Link2OffIcon aria-hidden="true" />
        <span className="min-w-0 truncate">Broken source</span>
      </Badge>
      <p className="min-w-0 break-all text-xs text-muted-foreground">
        {reason.sourceUrl}
        {reason.lastCheckedAt ? ` · checked ${formatDate(reason.lastCheckedAt)}` : null}
      </p>
    </div>
  );
}

function CatalogVerification() {
  const { items } = useCatalogVerificationActions();
  const counts = countByReason(items);
  const total = items.length;

  return (
    <div className="-mx-4 flex min-h-full flex-col">
      <CatalogVerificationHeader />

      <div className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
        {total === 0 ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>
                <h2 className="text-sm font-medium">Attention needed</h2>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Stale records, missing required fields, and broken source links appear here.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <ShieldCheckIcon className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">No published records need attention</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Fully current, complete records with a working source stay off this queue.
              </p>
              <Button nativeButton={false} variant="outline" className="mt-4" render={<Link to="/catalog" />}>
                Back to catalog
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>
                <h2 className="text-sm font-medium">Attention needed</h2>
              </CardTitle>
              <p className="text-xs text-muted-foreground" role="status" aria-atomic="true">
                {total} {total === 1 ? 'record' : 'records'} · {counts.stale} stale · {counts.missing_fields} missing
                fields · {counts.broken_source} broken {counts.broken_source === 1 ? 'source' : 'sources'}
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto px-0 py-0">
              <Table>
                <caption className="sr-only">
                  Published catalog records that are stale, missing required fields, or have a broken source
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record</TableHead>
                    <TableHead>Reasons</TableHead>
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.modelId}>
                      <TableCell className="align-top">
                        <Link
                          to="/catalog/$modelId/edit"
                          params={{ modelId: item.modelId }}
                          className="font-medium transition-colors hover:underline focus-visible:rounded-none focus-visible:ring-1 focus-visible:ring-ring/50"
                        >
                          {item.displayName}
                        </Link>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-3">
                          {item.reasons.map((reason) => (
                            <ReasonDetails key={reason.type} reason={reason} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Button
                          nativeButton={false}
                          variant="outline"
                          size="sm"
                          render={<Link to="/catalog/$modelId/edit" params={{ modelId: item.modelId }} />}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CatalogVerification;
