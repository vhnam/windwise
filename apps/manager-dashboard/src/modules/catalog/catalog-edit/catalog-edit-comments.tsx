import { MessageSquareIcon } from 'lucide-react';

import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@windwise/ui/components/card';
import { Field, FieldError, FieldLabel } from '@windwise/ui/components/field';
import { Textarea } from '@windwise/ui/components/textarea';

import { useCatalogEditComments } from './catalog-edit-comments.actions';

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function CatalogEditComments() {
  const { isNew, comments, isPending, body, setBody, submitError, isSubmitting, submitComment } =
    useCatalogEditComments();

  if (isNew) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <MessageSquareIcon className="size-4" aria-hidden="true" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Any workspace member can leave one.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-md border px-3 py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{comment.authorDisplayName}</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        <Field data-invalid={submitError ? true : undefined}>
          <FieldLabel htmlFor="catalog-comment-body">Add a comment</FieldLabel>
          <Textarea
            id="catalog-comment-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share a note for the team…"
            rows={3}
            disabled={isSubmitting}
            aria-invalid={submitError ? true : undefined}
          />
          {submitError ? <FieldError>{submitError}</FieldError> : null}
        </Field>
        <Button type="button" size="sm" disabled={isSubmitting || body.trim().length === 0} onClick={submitComment}>
          {isSubmitting ? 'Posting…' : 'Post comment'}
        </Button>
      </CardContent>
    </Card>
  );
}
