import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import type { QueryRouterContext } from '@windwise/query';
import appCss from '@windwise/ui?url';

import PowerSyncProvider from '#/integrations/powersync/provider';

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
});

function RootDocument({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <PowerSyncProvider>{children}</PowerSyncProvider>
        <Scripts />
      </body>
    </html>
  );
}
