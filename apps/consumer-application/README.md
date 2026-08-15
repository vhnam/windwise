# Consumer application

Member-facing [TanStack Start](https://tanstack.com/start) app
(`@windwise/consumer-application`). Dev server: **http://localhost:3000**.

Shared Query, styles, and Vite plugins come from workspace packages.
App-specific code lives here: PowerSync, TanStack AI, env, and member-facing UI.
Do not put Windwise domain components in `@windwise/ui`.

Workflow and naming: [AGENTS.md](../../AGENTS.md).

## Setup

From the repo root:

```bash
vp install
cp apps/consumer-application/.env.example apps/consumer-application/.env.local
```

Fill in `.env.local`, then:

```bash
vp run dev:consumer
```

Or from this directory: `vp dev`. Production build: `vp build`. Tests:
`vp test`.

## Environment

Defined in `src/env.ts` ([T3 Env](https://env.t3.gg/) + Valibot). Import with
`#/env`. Required variables are listed in `.env.example`.

| Variable               | Where  | Purpose                                                  |
| ---------------------- | ------ | -------------------------------------------------------- |
| `OPENAI_API_KEY`       | server | OpenAI / ChatGPT                                         |
| `GEMINI_API_KEY`       | server | Gemini (`GOOGLE_API_KEY` is also accepted)               |
| `VITE_POWERSYNC_URL`   | client | PowerSync endpoint                                       |
| `VITE_POWERSYNC_TOKEN` | client | Dev token only; replace with real auth before production |
| `VITE_APP_TITLE`       | client | Optional document title override                         |
| `SERVER_URL`           | server | Optional absolute server URL                             |

Create API keys (paste into `.env.local`; do not commit them):

- `OPENAI_API_KEY` — [OpenAI API keys](https://platform.openai.com/api-keys)
  (account required; billing may apply)
- `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)
  (Google account required). `GOOGLE_API_KEY` is accepted as an alias.

## Stack

- TanStack Start + file-based Router (`src/routes`)
- TanStack Query via [`@windwise/query`](../../packages/query/README.md)
  (`createQueryRouter` in `src/router.tsx`)
- React Compiler, Tailwind, and Start plugins via
  [`@windwise/vite-config`](../../packages/vite-config/README.md)
- Base CSS from [`@windwise/ui`](../../packages/ui/README.md)
- PowerSync (`src/lib/powersync`, `src/integrations/powersync`)
- TanStack AI (`@tanstack/ai-openai`, `@tanstack/ai-gemini`)

The Vite config also registers `powersync-vite-plugin.ts` so PowerSync workers
resolve from the monorepo root.

## PowerSync

Included files:

- `src/lib/powersync/app-schema.ts`
- `src/lib/powersync/backend-connector.ts`
- `src/integrations/powersync/provider.tsx`

Before production:

1. Replace the development token flow in `backend-connector.ts` with real auth.
2. Update `app-schema.ts` to match synced tables.
3. Implement `uploadData()` so local mutations write back to your backend.

See [PowerSync JS Web](https://docs.powersync.com/client-sdk-references/js-web).

## Routing and data

Routes are files under `src/routes`. The shell is `src/routes/__root.tsx`.

- Router: [TanStack Router](https://tanstack.com/router)
- Start (server functions, SSR): [TanStack Start](https://tanstack.com/start)
- Query SSR:
  [Router Query integration](https://tanstack.com/router/latest/docs/integrations/query)

Use `context.queryClient` in loaders (`ensureQueryData` / `prefetchQuery`).
Prefer `useSuspenseQuery` for data that should run during SSR.
