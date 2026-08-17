import { ShieldAlertIcon } from 'lucide-react';

export function CatalogVerificationHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
        <ShieldAlertIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Published catalog</p>
          <h1 className="truncate text-sm font-heading font-semibold">Verification queue</h1>
        </div>
      </div>
    </header>
  );
}
