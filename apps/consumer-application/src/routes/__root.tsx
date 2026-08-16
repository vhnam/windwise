import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import type { QueryRouterContext } from '@windwise/query';
import { Toaster } from '@windwise/ui/components/toast';
import { ThemeProvider } from '@windwise/ui/lib/theme-provider';

import PowerSyncProvider from '#/integrations/powersync/provider';

import appCss from '@windwise/ui?url';

export const Route = createRootRouteWithContext<QueryRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'WindWise',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function NotFound() {
  return <p>Not Found</p>;
}

function RootDocument({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <PowerSyncProvider>{children}</PowerSyncProvider>
          <Toaster />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
