import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@windwise/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@windwise/ui/components/dialog';
import { Field, FieldLabel } from '@windwise/ui/components/field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@windwise/ui/components/table';
import { Textarea } from '@windwise/ui/components/textarea';

import { CatalogReviewEmpty } from './catalog-review-empty';
import { CatalogReviewHeader } from './catalog-review-header';
import { useCatalogReviewActions } from './catalog-review.actions';

function CatalogReview() {
  const { records, canReview, pendingId, actionError, missingFields, approve, requestChanges } =
    useCatalogReviewActions();
  const [noteRecord, setNoteRecord] = useState<{ id: string; version: number; displayName: string } | null>(null);
  const [note, setNote] = useState('');

  return (
    <div className="-mx-4 flex min-h-full flex-col">
      <CatalogReviewHeader />

      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6 lg:py-8">
        {!canReview ? (
          <CatalogReviewEmpty kind="denied" />
        ) : (
          <>
            {actionError ? <p className="mb-4 text-sm text-destructive">{actionError}</p> : null}
            {missingFields.length > 0 ? (
              <p className="mb-4 text-sm text-muted-foreground">Missing: {missingFields.join(', ')}</p>
            ) : null}
            {records.length === 0 ? (
              <CatalogReviewEmpty kind="idle" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record</TableHead>
                    <TableHead>Completeness</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pendingId === record.id}
                            onClick={() => {
                              setNote('');
                              setNoteRecord({
                                id: record.id,
                                version: record.version,
                                displayName: record.displayName,
                              });
                            }}
                          >
                            Request changes
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={pendingId === record.id}
                            onClick={() => {
                              void approve(record.id, record.version);
                            }}
                          >
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Dialog
              open={noteRecord !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setNoteRecord(null);
                  setNote('');
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request changes</DialogTitle>
                  <DialogDescription>
                    {noteRecord
                      ? `Return ${noteRecord.displayName} to draft. The editor will see this note.`
                      : 'Return this record to draft.'}
                  </DialogDescription>
                </DialogHeader>
                <Field>
                  <FieldLabel htmlFor="review-notes">Review notes</FieldLabel>
                  <Textarea id="review-notes" value={note} required onChange={(event) => setNote(event.target.value)} />
                </Field>
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
                  <Button
                    type="button"
                    disabled={!note.trim() || !noteRecord}
                    onClick={() => {
                      if (!noteRecord || !note.trim()) {
                        return;
                      }
                      const current = noteRecord;
                      const currentNote = note.trim();
                      setNoteRecord(null);
                      setNote('');
                      void requestChanges(current.id, current.version, currentNote);
                    }}
                  >
                    Return to draft
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

export default CatalogReview;
