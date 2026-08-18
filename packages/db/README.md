# `@windwise/db`

Drizzle schema and queries for Windwise. This package is the **first writer**
for catalog tables (008) and the read path for published instruments (005/007).
Apps import `getDb()` and query helpers; they must not add a second catalog
write path.

Workflow: [AGENTS.md](../../AGENTS.md).

## Setup

```bash
cp packages/db/.env.example packages/db/.env.local
```

Set `DATABASE_URL` (Postgres). The same URL must be in
`apps/manager-dashboard/.env.local` (and consumer env when that app calls
`getDb()`).

```bash
vp -C packages/db run db:generate
vp -C packages/db run db:migrate
vp run db:seed
```

Seed creates catalog rows plus the WindWise org owner `admin@windwise.io` /
`P@ssw0rd!!`.

## Scripts

From the repo root:

| Command                                  | What it does                            |
| ---------------------------------------- | --------------------------------------- |
| `vp -C packages/db test`                 | Unit tests                              |
| `vp -C packages/db check`                | Format, lint, typecheck                 |
| `vp -C packages/db run db:generate`      | Drizzle kit generate                    |
| `vp -C packages/db run db:migrate`       | Apply migrations                        |
| `vp run db:seed`                         | Seed catalog + staff owner              |
| `vp -C packages/db run db:check-sources` | HEAD/GET source URLs; write `source_ok` |

`db:check-sources` is the manual/cron entry for broken-source detection. Do not
run live HTTP checks inside verification-queue page loads. Optional:
`SOURCE_IDS=uuid1,uuid2`.

## Writes

`createInstrumentModel`, `editInstrumentModel`, `transitionInstrumentModel`, and
`archiveInstrumentModel` re-read the actor’s role from `organization_members` at
call time and write an audit row in the same transaction.

Related `price` / `primaryImage` / `source` on an edit patch:

- omit / `undefined` — leave the existing row
- object — upsert
- `null` — delete

Lifecycle checks live in `src/auth/can-transition.ts`. Publish uses
`src/auth/required-fields.ts`.
