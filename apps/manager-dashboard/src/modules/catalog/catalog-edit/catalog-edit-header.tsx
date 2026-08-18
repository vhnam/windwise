import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';

import { Button } from '@windwise/ui/components/button';
import { Separator } from '@windwise/ui/components/separator';

import { STATUS_DOT, STATUS_LABEL } from '../catalog-status';
import type { useCatalogEditActions } from './catalog-edit.actions';

type CatalogEditHeaderProps = {
  record: ReturnType<typeof useCatalogEditActions>['record'];
  isNew: boolean;
  isSubmitting: boolean;
  onTransition: (targetStatus: 'in_review' | 'published' | 'draft' | 'archived') => void;
};

export function CatalogEditHeader({ record, isNew, isSubmitting, onTransition }: CatalogEditHeaderProps) {
  const pageTitle = isNew ? 'Untitled' : (record?.displayName ?? 'Edit record');
  const collectionLabel = isNew ? 'Create an entry' : 'Edit an entry';

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex flex-wrap items-center gap-3 px-4 lg:px-6 py-3 lg:py-4">
        <Button nativeButton={false} variant="ghost" size="sm" className="-ml-2" render={<Link to="/catalog" />}>
          <ChevronLeftIcon aria-hidden="true" />
          Catalog
        </Button>
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{collectionLabel}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-sm font-heading font-semibold">{pageTitle}</h1>
            {record ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-1.5 shrink-0 ${STATUS_DOT[record.status]}`} aria-hidden="true" />
                {STATUS_LABEL[record.status]}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-1.5 shrink-0 ${STATUS_DOT.draft}`} aria-hidden="true" />
                Draft
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {record?.status === 'draft' && (
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onTransition('in_review')}>
              Mark ready
            </Button>
          )}
          {record?.status === 'in_review' && (
            <Button type="button" disabled={isSubmitting} onClick={() => onTransition('published')}>
              Publish
            </Button>
          )}
          <Button
            type="submit"
            variant={record?.status === 'in_review' ? 'outline' : 'default'}
            disabled={isSubmitting}
          >
            {isSubmitting ? (isNew ? 'Creating…' : 'Saving…') : 'Save'}
          </Button>
        </div>
      </div>
    </header>
  );
}
