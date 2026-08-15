# `@windwise/query`

Shared [TanStack Query](https://tanstack.com/query) setup for Windwise apps,
including SSR dehydration/hydration through
[`@tanstack/react-router-ssr-query`](https://tanstack.com/router/latest/docs/integrations/query).

This package is infrastructure, not domain logic. Recommendation and catalog
code does not belong here. Workflow: [AGENTS.md](../../AGENTS.md).

## Usage

In each app’s `src/router.tsx`:

```ts
import { createQueryRouter } from "@windwise/query";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createQueryRouter(routeTree);
}
```

Type the root route with `QueryRouterContext`:

```ts
import { createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryRouterContext } from "@windwise/query";

export const Route = createRootRouteWithContext<QueryRouterContext>()({
  /* ... */
});
```

`createQueryRouter` creates a **new `QueryClient` per request**, sets query
`staleTime` to 60s (avoids an immediate refetch after hydration), sets router
`defaultPreloadStaleTime` to `0` so Query owns cache freshness, and wraps the
tree with `QueryClientProvider`.

Apps that call `useQuery` / `useSuspenseQuery` should depend on
`@tanstack/react-query` themselves.

## Scripts

From the repo root:

```bash
vp -C packages/query test
vp -C packages/query check
```
