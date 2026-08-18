import { Link, createFileRoute } from '@tanstack/react-router';

import { Button } from '@windwise/ui/components/button';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 p-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">WindWise</p>
        <h1 className="text-3xl font-semibold tracking-tight">Manager dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to review catalog records, verification, and staff access.
        </p>
      </div>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link to="/auth/login" />}>
          Sign in
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link to="/catalog" />}>
          Open catalog
        </Button>
      </div>
    </div>
  );
}
