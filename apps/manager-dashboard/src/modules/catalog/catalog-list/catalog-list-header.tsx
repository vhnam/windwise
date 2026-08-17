import { Link } from '@tanstack/react-router';
import { BookOpenIcon, PlusIcon } from 'lucide-react';

import { Button } from '@windwise/ui/components/button';

type CatalogListHeaderProps = {
  canEdit: boolean;
};

export function CatalogListHeader({ canEdit }: CatalogListHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
        <BookOpenIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Workspace</p>
          <h1 className="truncate text-sm font-heading font-semibold">Catalog records</h1>
        </div>
        {canEdit ? (
          <Button nativeButton={false} render={<Link to="/catalog/$modelId/edit" params={{ modelId: 'new' }} />}>
            <PlusIcon aria-hidden="true" />
            New record
          </Button>
        ) : null}
      </div>
    </header>
  );
}
