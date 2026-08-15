# Phase 1 Data Model: Project Codebase Bootstrap

This feature is infrastructure/workspace configuration, not application data.
The "entities" are workspace/config concepts rather than persisted records;
documented here for traceability to the Key Entities in spec.md.

## App

Represents a deployable unit under `apps/`.

| Field             | Type                                  | Notes                                                                      |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| name              | string                                | `package.json` `name`, scoped `@windwise/*`                                |
| directory         | path                                  | `apps/<name>`                                                              |
| devCommand        | string                                | `vp dev` (invoked via root `dev:<name>` script or directly in the app dir) |
| buildCommand      | string                                | `vp build`                                                                 |
| envSchema         | reference → Environment Configuration | one per app, `src/env.ts`                                                  |
| sharedPackageDeps | reference[] → Shared Package          | via `workspace:*` in `package.json` dependencies                           |

Current instances: `consumer-application`, `manager-dashboard`.

## Shared Package

Represents a non-deployable unit under `packages/` consumed by one or more apps.

| Field     | Type              | Notes                                                     |
| --------- | ----------------- | --------------------------------------------------------- |
| name      | string            | `@windwise/<name>`                                        |
| directory | path              | `packages/<name>`                                         |
| exports   | map               | `package.json` `exports` field — what the package exposes |
| consumers | reference[] → App | apps declaring `"@windwise/<name>": "workspace:*"`        |

Current instances: `ui` (styles.css export), `query` (query-client factory),
`vite-config` (Vite plugin composition).

## Environment Configuration

Represents one app's `env.ts` schema (not a persisted entity — a
build/runtime-validated config object).

| Field            | Type                | Notes                                                                               |
| ---------------- | ------------------- | ----------------------------------------------------------------------------------- |
| serverVars       | map\<name, schema\> | validated only in server context, never sent to client                              |
| clientVars       | map\<name, schema\> | must be prefixed `VITE_`, embedded in client bundle                                 |
| exampleFile      | path                | `.env.example` at app root; MUST list every var referenced by serverVars/clientVars |
| validationTiming | enum                | "at import/startup" (fail-fast, per FR-006)                                         |

State transition: missing/invalid required var at startup → process throws
before server/dev-server accepts requests (no partial-started state).

## Workspace Validation Run

Represents one execution of `vp run ready` (or its constituent `vp check` /
`vp run -r test` / `vp run -r build`).

| Field           | Type                          | Notes                                                |
| --------------- | ----------------------------- | ---------------------------------------------------- |
| scope           | enum                          | full workspace (`-r` = recursive across all members) |
| steps           | ordered list                  | check (lint/fmt/type) → test → build                 |
| perMemberResult | map\<memberName, pass\|fail\> | must be attributable per FR-011                      |
| exitCode        | int                           | non-zero if any member/step fails                    |

No new persisted storage, migrations, or database entities are introduced by
this feature.
