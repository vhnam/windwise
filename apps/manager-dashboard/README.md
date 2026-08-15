# Manager dashboard

Staff-facing [TanStack Start](https://tanstack.com/start) app
(`@windwise/manager-dashboard`). Dev server: **http://localhost:4000**.

Shared Query, styles, and Vite plugins come from workspace packages.
App-specific code lives here: Better Auth, env, and staff-facing UI. Do not put
Windwise domain components in `@windwise/ui`.

Workflow and naming: [AGENTS.md](../../AGENTS.md).

## Setup

From the repo root:

```bash
vp install
cp apps/manager-dashboard/.env.example apps/manager-dashboard/.env.local
```

Fill in `.env.local`. `BETTER_AUTH_SECRET` needs a real generated value:

```bash
vp dlx @better-auth/cli secret
```

Then:

```bash
vp run dev:manager
```

Or from this directory: `vp dev`. Production build: `vp build`. Tests:
`vp test`.

## Environment

Defined in `src/env.ts` ([T3 Env](https://env.t3.gg/) + Valibot). Import with
`#/env`. Required variables are listed in `.env.example`.

| Variable             | Where  | Purpose                            |
| -------------------- | ------ | ---------------------------------- |
| `BETTER_AUTH_SECRET` | server | Auth signing secret (min 32 chars) |
| `BETTER_AUTH_URL`    | server | Public origin of this app          |
| `VITE_APP_TITLE`     | client | Optional document title override   |
| `SERVER_URL`         | server | Optional absolute server URL       |

## Stack

- TanStack Start + file-based Router (`src/routes`)
- TanStack Query via [`@windwise/query`](../../packages/query/README.md)
  (`createQueryRouter` in `src/router.tsx`)
- React Compiler, Tailwind, and Start plugins via
  [`@windwise/vite-config`](../../packages/vite-config/README.md)
- Base CSS from [`@windwise/ui`](../../packages/ui/README.md)
- [Better Auth](https://www.better-auth.com) with the TanStack Start cookies
  plugin (`src/lib/auth.ts`, `src/lib/auth-client.ts`)
- Auth HTTP handler: `src/routes/api/auth/$.ts`

Email/password is enabled. The current config is stateless (no database). To
persist users, add a Better Auth database adapter in `src/lib/auth.ts` and run:

```bash
vp dlx @better-auth/cli migrate
```

## Routing and data

Routes are files under `src/routes`. The shell is `src/routes/__root.tsx`.

- Router: [TanStack Router](https://tanstack.com/router)
- Start (server functions, SSR): [TanStack Start](https://tanstack.com/start)
- Query SSR:
  [Router Query integration](https://tanstack.com/router/latest/docs/integrations/query)

Use `context.queryClient` in loaders (`ensureQueryData` / `prefetchQuery`).
Prefer `useSuspenseQuery` for data that should run during SSR.
