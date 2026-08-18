import { SidebarTrigger } from '@windwise/ui/components/sidebar';

import { authClient } from '#/lib/auth-client';

export const ProtectedLayoutHeader = () => {
  const { data: session } = authClient.useSession();
  const name = session?.user.name;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-4">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <p className="text-sm text-muted-foreground">{name ? `Good day, ${name}` : 'WindWise'}</p>
    </header>
  );
};
