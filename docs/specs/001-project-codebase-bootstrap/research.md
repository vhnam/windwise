# Phase 0 Research: Project Codebase Bootstrap

No `[NEEDS CLARIFICATION]` markers were left in spec.md, so this phase focuses
on confirming the existing conventions in the diff are sound to build on top of,
rather than resolving open unknowns.

## Decision: Keep pnpm workspace + `catalog:` as the dependency-pinning mechanism

- **Decision**: Continue using `pnpm-workspace.yaml`'s `catalog:` field (FR-008)
  as the single place third-party dependency versions are pinned; apps/packages
  reference `catalog:` in their own `package.json` instead of hardcoded
  versions.
- **Rationale**: Already adopted across every `package.json` in the diff
  (`vite: catalog:`, `react: catalog:`, etc.); this is pnpm's native mechanism
  for exactly the constraint the constitution states ("changes MUST remain
  compatible with this stack"). No reason to introduce an alternative (e.g.,
  Renovate config or manual version syncing) for this bootstrap.
- **Alternatives considered**: Per-package pinned versions (rejected — this is
  what `catalog:` was adopted specifically to avoid, per the existing
  `overrides: { vite: "catalog:" }` entry which shows an explicit effort to
  prevent version drift).

## Decision: `vp run ready` remains the single top-level validation command

- **Decision**: FR-003's "one top-level command" is `vp run ready` (already
  defined in root `package.json` as
  `vp check && vp run -r test && vp run -r build`), not a new command.
- **Rationale**: Already referenced by name in the constitution's Development
  Workflow section ("Before opening a PR, contributors MUST run `vp run ready`
  locally"). Building a second command would fragment the single-source-of-truth
  this spec's SC-002 requires.
- **Alternatives considered**: A new custom script wrapping the same three steps
  — rejected as redundant.

## Decision: Environment validation stays on `@t3-oss/env-core` + `valibot`, per-app `env.ts`

- **Decision**: FR-005/FR-006 (declare + validate env vars) are satisfied by the
  existing pattern: each app has its own `src/env.ts` calling `createEnv()` with
  `server`/`client` schemas and a `clientPrefix: "VITE_"` split, validated
  eagerly at import time (fails fast, satisfies SC-004).
- **Rationale**: Both apps already use this pattern; it cleanly separates
  server-only secrets from `VITE_`-prefixed client-exposed values, matching
  FR-005's requirement. No new library needed.
- **Alternatives considered**: A shared `@windwise/env` package centralizing
  schema-building — reasonable future refactor if a third app appears with
  overlapping variables, but out of scope here since only 2 apps exist with
  mostly non-overlapping variables (PowerSync vs. better-auth); premature to
  abstract now (constitution: avoid duplication, but also avoid speculative
  abstraction).

## Decision: Close the `.env.example` gap for `manager-dashboard` (FR-007)

- **Decision**: Add `apps/manager-dashboard/.env.example` listing `SERVER_URL`
  (optional), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `VITE_APP_TITLE`
  (optional) — mirroring the shape of `consumer-application/.env.example`.
- **Rationale**: `consumer-application` already has this file;
  `manager-dashboard`'s `env.ts` requires two secrets (`BETTER_AUTH_SECRET`
  min-length 32, `BETTER_AUTH_URL`) with no example file to guide a new
  developer, which directly violates FR-007 and blocks SC-001 (15-minute
  clone-to-running).
- **Alternatives considered**: None — this is a straightforward parity fix, not
  a design decision.

## Decision: Test-coverage gap is tracked but not exhaustively fixed in this feature

- **Decision**: Add one baseline test per workspace member that currently has
  none, sufficient to make `vp run -r test` exercise every member (satisfies
  SC-002's "100% of workspace members" for the validation run itself), rather
  than achieving full coverage of application logic.
- **Rationale**: The constitution requires `vp run -r test` to pass across the
  monorepo and requires integration tests for cross-boundary changes going
  forward — it does not require retroactively achieving full coverage of
  pre-existing code as part of an infra bootstrap. Scoping to "every member has
  at least one real test" closes the immediate gap (a member silently having
  zero tests is indistinguishable from a member whose tests are all passing)
  without turning this into a full test-writing effort.
- **Alternatives considered**: Full unit/integration coverage per app — rejected
  as disproportionate scope for a bootstrap feature; defer to feature-specific
  specs as functionality is built out.

## Outcome

All items resolved with defaults consistent with the existing diff; no
`[NEEDS CLARIFICATION]` markers remain going into Phase 1.
