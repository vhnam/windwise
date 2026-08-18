import type { AuditTrailEntry } from '@windwise/schemas';
import { Button } from '@windwise/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@windwise/ui/components/dialog';

import { AUDIT_ACTION_LABEL, formatAuditValue, formatAuditWhen } from './catalog-audit-format';

type CatalogAuditDiffDialogProps = {
  entry: AuditTrailEntry;
};

export function CatalogAuditDiffDialog({ entry }: CatalogAuditDiffDialogProps) {
  const fieldCount = entry.diff.length;
  const whenLabel = formatAuditWhen(entry.at);
  const actionLabel = AUDIT_ACTION_LABEL[entry.action];

  if (fieldCount === 0) {
    return <span className="text-muted-foreground">None</span>;
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" />}
        aria-label={`View ${fieldCount} changed ${fieldCount === 1 ? 'field' : 'fields'} from ${actionLabel} at ${whenLabel}`}
      >
        View changes
      </DialogTrigger>
      <DialogContent className="max-h-[min(32rem,calc(100vh-2rem))] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Changed fields</DialogTitle>
          <DialogDescription>
            {actionLabel} by {entry.actorDisplayName} on {whenLabel}.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-4 text-sm">
          {entry.diff.map((change) => (
            <div key={change.field} className="space-y-1.5 border-b border-border pb-4 last:border-b-0 last:pb-0">
              <dt className="font-medium">{change.field}</dt>
              <dd className="grid gap-1 text-xs/relaxed">
                <p className="min-w-0">
                  <span className="text-muted-foreground">Before: </span>
                  <span className="wrap-anywhere">{formatAuditValue(change.before)}</span>
                </p>
                <p className="min-w-0">
                  <span className="text-muted-foreground">After: </span>
                  <span className="wrap-anywhere">{formatAuditValue(change.after)}</span>
                </p>
              </dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
