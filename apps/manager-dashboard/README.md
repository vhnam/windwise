# Manager dashboard

Staff-facing [TanStack Start](https://tanstack.com/start) app
(`@windwise/manager-dashboard`). Dev server: **http://localhost:4000**.

Shared Query, styles, and Vite plugins come from workspace packages.
App-specific code lives here: Better Auth, catalog authoring, env, and
staff-facing UI. Do not put Windwise domain components in `@windwise/ui`.

Workflow and naming: [AGENTS.md](../../AGENTS.md).

## Setup

From the repo root:

```bash
vp install
cp apps/manager-dashboard/.env.example apps/manager-dashboard/.env.local
cp packages/db/.env.example packages/db/.env.local
```

Fill in `.env.local`. `BETTER_AUTH_SECRET` needs a real generated value:

```bash
vp dlx @better-auth/cli secret
```

Set `DATABASE_URL` in **both** `apps/manager-dashboard/.env.local` (app
requests) and `packages/db/.env.local` (migrate / seed / source checks). Then:

```bash
vp -C packages/db run db:migrate
vp run db:seed
vp run dev:manager
```

Or from this directory: `vp dev`. Production build: `vp build`. Tests:
`vp test`.

Local seed owner: `admin@windwise.io` / `P@ssw0rd!!`. Email sign-up is disabled;
new staff accounts are seeded or invited.

## Environment

Defined in `src/env.ts` ([T3 Env](https://env.t3.gg/) + Valibot). Import with
`#/env`. Required variables are listed in `.env.example`. `@windwise/db` also
reads `DATABASE_URL` from the process environment.

| Variable             | Where  | Purpose                            |
| -------------------- | ------ | ---------------------------------- |
| `BETTER_AUTH_SECRET` | server | Auth signing secret (min 32 chars) |
| `BETTER_AUTH_URL`    | server | Public origin of this app          |
| `DATABASE_URL`       | server | Postgres URL for `@windwise/db`    |
| `VITE_APP_TITLE`     | client | Optional document title override   |
| `SERVER_URL`         | server | Optional absolute server URL       |

## Stack

- TanStack Start + file-based Router (`src/routes`)
- TanStack Query via [`@windwise/query`](../../packages/query/README.md)
  (`createQueryRouter` in `src/router.tsx`)
- React Compiler, Tailwind, and Start plugins via
  [`@windwise/vite-config`](../../packages/vite-config/README.md)
- Base CSS from [`@windwise/ui`](../../packages/ui/README.md)
- [Better Auth](https://www.better-auth.com) with the organization plugin,
  Drizzle adapter on `getDb()`, TanStack Start cookies, and
  `emailAndPassword.disableSignUp: true` (`src/lib/auth.ts`,
  `src/lib/auth-client.ts`)
- Auth HTTP handler: `src/routes/api/auth/$.ts`
- Catalog writes and role checks via
  [`@windwise/db`](../../packages/db/README.md)
- Formisch + Valibot on the catalog editor
  (`src/schemas/catalog-edit.schema.ts`)

`getActorContext()` (`src/lib/server/session.ts`) re-reads
`organization_members` using `session.activeOrganizationId` (or a unique
membership). Catalog and audit **reads** require that actor; a signed-in user
with no member row gets empty results.

## Screens

Product UI lives under `src/modules/` (not in route files):

| Path                     | Module                 |
| ------------------------ | ---------------------- |
| `/catalog`               | catalog list           |
| `/catalog/$modelId/edit` | catalog editor         |
| `/catalog/review`        | reviewer queue         |
| `/verification-queue`    | published stale/broken |
| `/audit/$entityId`       | audit history          |
| `/settings/members`      | roles + staleness      |

Lifecycle is Draft → In Review → Published → Archived. Status changes go through
`transitionStatusFn`; clearing price, image, or source in the editor sends
`null` so related rows are deleted.

## Routing and data

Routes are files under `src/routes`. The shell is `src/routes/__root.tsx`.

- Router: [TanStack Router](https://tanstack.com/router)
- Start (server functions, SSR): [TanStack Start](https://tanstack.com/start)
- Query SSR:
  [Router Query integration](https://tanstack.com/router/latest/docs/integrations/query)

Use `context.queryClient` in loaders (`ensureQueryData` / `prefetchQuery`).
Prefer `useSuspenseQuery` for data that should run during SSR.
