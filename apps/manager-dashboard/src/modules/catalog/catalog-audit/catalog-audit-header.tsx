import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';

import { Button } from '@windwise/ui/components/button';
import { Separator } from '@windwise/ui/components/separator';

type CatalogAuditHeaderProps = {
  entityId: string;
};

export function CatalogAuditHeader({ entityId }: CatalogAuditHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link to="/catalog/$modelId/edit" params={{ modelId: entityId }} />}
        >
          <ChevronLeftIcon aria-hidden="true" />
          Record
        </Button>
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Audit trail</p>
          <h1 className="truncate text-sm font-heading font-semibold">History</h1>
        </div>
      </div>
    </header>
  );
}
