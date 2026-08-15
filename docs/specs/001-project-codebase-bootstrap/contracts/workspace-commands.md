# Contract: Workspace Commands

The interface this feature exposes is a set of top-level commands developers and
CI rely on. Each command's contract is its invocation, exit-code behavior, and
scope — not a network API.

## `pnpm install`

- **Scope**: entire workspace (all `apps/*`, `packages/*`, `tools/*` globs in
  `pnpm-workspace.yaml`)
- **Contract**: resolves and links all workspace member dependencies in one
  invocation; no member requires a separate install step (FR-001)
- **Failure mode**: non-zero exit on unresolvable dependency conflict

## `vp run ready` (root `package.json` script)

- **Definition**: `vp check && vp run -r test && vp run -r build`
- **Contract**: runs, in order, lint/format/type-check → tests → builds,
  recursively (`-r`) across every workspace member; exits non-zero if any step
  or member fails (FR-003, FR-011)
- **Per-member attribution**: `vp`'s recursive output MUST identify which member
  failed (Vite+ built-in behavior; verify during implementation, do not assume)

## `vp run dev:consumer` / `vp run dev:manager` (root `package.json` scripts)

- **Definition**: `vp run consumer-application#dev` /
  `vp run manager-dashboard#dev`
- **Contract**: starts exactly one app's local dev server; does not require the
  other app to be running (FR-002)
- **Precondition**: app's `src/env.ts` validation MUST pass or the process fails
  fast with a named variable (FR-006)

## Shared package export contract

Each `packages/*` package's `package.json` `exports` field is the contract apps
depend on:

| Package                 | Export                   | Consumers depend on                                                       |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `@windwise/ui`          | `.` → `./src/styles.css` | Tailwind entry point, imported for global styles                          |
| `@windwise/query`       | `.` → `./src/index.ts`   | query-client factory (typed)                                              |
| `@windwise/vite-config` | `.` → `./src/index.ts`   | `tanstackAppPlugins(...)` composition used in each app's `vite.config.ts` |

**Contract rule (FR-004)**: apps MUST reference these via
`"@windwise/<name>": "workspace:*"` in `package.json` dependencies, never via
relative path imports across the `apps/` → `packages/` boundary.
