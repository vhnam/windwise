import { Link } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';

import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@windwise/ui/components/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@windwise/ui/components/dialog';

import { STATUS_DOT, STATUS_LABEL } from '../catalog-status';
import type { useCatalogEditActions } from './catalog-edit.actions';

type CatalogEditSidebarProps = {
  record: ReturnType<typeof useCatalogEditActions>['record'];
  isSubmitting: boolean;
  canRestore: boolean;
  onTransition: (targetStatus: 'in_review' | 'published' | 'draft' | 'archived') => void;
  onRestore: () => void;
};

function formatTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all font-medium">{children}</dd>
    </div>
  );
}

export function CatalogEditSidebar({
  record,
  isSubmitting,
  canRestore,
  onTransition,
  onRestore,
}: CatalogEditSidebarProps) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  return (
    <div className="space-y-4 lg:space-y-6 lg:sticky lg:top-16">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-4 text-xs">
          <dl className="space-y-3">
            <InfoRow label="Status">
              {record ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className={`size-1.5 shrink-0 ${STATUS_DOT[record.status]}`} aria-hidden="true" />
                  {STATUS_LABEL[record.status]}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className={`size-1.5 shrink-0 ${STATUS_DOT.draft}`} aria-hidden="true" />
                  Draft
                </span>
              )}
            </InfoRow>
            <InfoRow label="Entry ID">{record?.id ?? '—'}</InfoRow>
            <InfoRow label="Version">{record ? String(record.version) : '—'}</InfoRow>
            <InfoRow label="Last verified">{formatTimestamp(record?.lastVerifiedAt)}</InfoRow>
            <InfoRow label="Completeness">{record ? `${record.dataCompleteness}%` : '—'}</InfoRow>
            {record?.reviewNotes ? <InfoRow label="Review notes">{record.reviewNotes}</InfoRow> : null}
          </dl>
          {record ? (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              className="w-full"
              render={<Link to="/audit/$entityId" params={{ entityId: record.id }} />}
            >
              View history
            </Button>
          ) : (
            <p className="text-muted-foreground">Save a draft to assign an entry ID and start history.</p>
          )}
        </CardContent>
      </Card>

      {record?.status === 'published' ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => setArchiveOpen(true)}
            >
              Archive
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {canRestore ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => setRestoreOpen(true)}
            >
              Restore to draft
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive this record?</DialogTitle>
            <DialogDescription>
              It will be removed from member-facing pages and kept in the catalog for history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setArchiveOpen(false);
                onTransition('archived');
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore this record?</DialogTitle>
            <DialogDescription>
              It will return to draft so editors can update it before sending it through review again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button
              type="button"
              onClick={() => {
                setRestoreOpen(false);
                onRestore();
              }}
            >
              Restore to draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
