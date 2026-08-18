# Windwise

pnpm workspace with two [TanStack Start](https://tanstack.com/start) apps and
shared packages. Tooling is [Vite+](https://viteplus.dev/guide/) (`vp`).

Specification-first workflow (Notion → Spec Kit → Open-SPDD → Git → Notion) is
in [AGENTS.md](./AGENTS.md). Claude loads that via [CLAUDE.md](./CLAUDE.md).

## Layout

```text
apps/consumer-application   # member app (port 3000)
apps/manager-dashboard      # staff app (port 4000)
packages/ai                 # consultation tools / LLM adapter
packages/core               # deterministic recommend / compare / upgrade
packages/db                 # Drizzle schema, catalog writes, seed
packages/query              # TanStack Query + SSR router helper
packages/schemas            # Valibot shapes (no I/O)
packages/ui                 # shared Tailwind baseline (no domain UI)
packages/vite-config        # Vite plugins (Start, React Compiler, Tailwind)
docs/specs/<work_item>/     # Spec Kit (spec.md, plan.md, …)
docs/spdd/analysis/<work_item>/
docs/spdd/prompt/<work_item>/
```

Shared dependency versions live in the pnpm `catalog:` in `pnpm-workspace.yaml`.
App and package SemVer is independent via
[Changesets](https://github.com/changesets/changesets) (baseline `0.1.0`).
Cross-app logic belongs in `packages/`, not copied between apps. Canonical
work-item IDs are `<sequence>-<slug>` (see AGENTS.md); Git branches use `feat/`
/ `fix/` / `chore/` prefixes and do not have to match the work-item ID.

## Setup

```bash
vp install
```

Node `>=24.19.0`. Copy each app’s `.env.example` to `.env.local` (see that app’s
README) before running it. Catalog writes and staff sign-in also need Postgres:
copy `packages/db/.env.example` to `packages/db/.env.local`, set `DATABASE_URL`,
then migrate and seed (see [`packages/db/README.md`](packages/db/README.md)).
Put the same `DATABASE_URL` in `apps/manager-dashboard/.env.local` so the
dashboard can reach `@windwise/db`.

## Commands

Run these from the repo root. Prefer `vp` over calling Vite, pnpm scripts, or
linters directly.

| Command                    | What it does                                             |
| -------------------------- | -------------------------------------------------------- |
| `vp run ready`             | Format/lint/typecheck, then test and build the workspace |
| `vp check`                 | Format, lint, and typecheck                              |
| `vp test`                  | Tests (Vitest via Vite+)                                 |
| `vp run -r test`           | Tests in every workspace member that defines `test`      |
| `vp run -r build`          | Production builds                                        |
| `vp run dev:consumer`      | Consumer app at http://localhost:3000                    |
| `vp run dev:manager`       | Manager dashboard at http://localhost:4000               |
| `vp run db:seed`           | Seed catalog + staff owner (`admin@windwise.io`)         |
| `vp run changeset`         | Add a changeset for packages that changed                |
| `vp run changeset:version` | Apply changesets (bump versions, write changelogs)       |

Target a package with `-C`:

```bash
vp -C apps/consumer-application dev
vp -C apps/manager-dashboard build
vp -C packages/db run db:migrate
vp -C packages/db run db:check-sources
```

## Apps

- [Consumer application](apps/consumer-application/README.md) — published
  catalog, consultation (`@windwise/ai` / `@windwise/core`)
- [Manager dashboard](apps/manager-dashboard/README.md) — Better Auth
  organization plugin, catalog lifecycle

## Shared packages

- [`@windwise/ai`](packages/ai/README.md)
- [`@windwise/core`](packages/core/README.md)
- [`@windwise/db`](packages/db/README.md)
- [`@windwise/query`](packages/query/README.md)
- [`@windwise/schemas`](packages/schemas/README.md)
- [`@windwise/ui`](packages/ui/README.md)
- [`@windwise/vite-config`](packages/vite-config/README.md)
