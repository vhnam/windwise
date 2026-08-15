import { QueryClient } from '@tanstack/react-query';
import { createRouter, type AnyRoute } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

export type { QueryClient } from '@tanstack/react-query';

const QUERY_STALE_TIME_MS = 60 * 1000;

export type QueryRouterContext = {
  queryClient: QueryClient;
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  });
}

export function createQueryRouter<TRouteTree extends AnyRoute>(routeTree: TRouteTree) {
  const queryClient = createQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}
