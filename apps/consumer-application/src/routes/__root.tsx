import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import type { QueryRouterContext } from '@windwise/query';
import { Toaster } from '@windwise/ui/components/toast';
import { ThemeProvider } from '@windwise/ui/lib/theme-provider';

import faviconPng from '#/assets/favicon.png?url';
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
        name: 'description',
        content: 'WindWise is a platform for consulting with AI, woodwind and brass instruments.',
      },
      {
        name: 'keywords',
        content: 'WindWise, AI, consulting, woodwind, brass, instrument',
      },
      {
        title: 'WindWise',
      },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/png',
        href: faviconPng,
      },
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
