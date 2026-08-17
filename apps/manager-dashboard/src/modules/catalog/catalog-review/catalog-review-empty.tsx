import { Link } from '@tanstack/react-router';
import { ListChecksIcon, LockIcon } from 'lucide-react';

import { Button } from '@windwise/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@windwise/ui/components/empty';

type CatalogReviewEmptyProps = {
  kind: 'denied' | 'idle';
};

export function CatalogReviewEmpty({ kind }: CatalogReviewEmptyProps) {
  const isDenied = kind === 'denied';

  return (
    <Empty className="border min-h-64">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isDenied ? <LockIcon aria-hidden="true" /> : <ListChecksIcon aria-hidden="true" />}
        </EmptyMedia>
        <EmptyTitle>{isDenied ? 'You don’t have permission to review' : 'Nothing waiting for review'}</EmptyTitle>
        <EmptyDescription>
          {isDenied
            ? 'Only reviewers and above can approve records or return them to draft.'
            : 'Records marked ready appear here until a reviewer approves or requests changes.'}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} variant="outline" render={<Link to="/catalog" />}>
          Back to catalog
        </Button>
      </EmptyContent>
    </Empty>
  );
}
