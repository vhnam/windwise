import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import type { QueryRouterContext } from '@windwise/query';
import { Toaster } from '@windwise/ui/components/toast';
import { TooltipProvider } from '@windwise/ui/components/tooltip';
import { ThemeProvider } from '@windwise/ui/lib/theme-provider';

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
        title: 'WindWise | Dashboard',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
