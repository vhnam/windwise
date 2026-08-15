# Implementation Plan: Project Codebase Bootstrap

**Branch**: `001-project-codebase-bootstrap` | **Date**: 2026-08-15 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/001-project-codebase-bootstrap/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Finish and document the pnpm-workspace monorepo already scaffolded on
`chore/bootstrap-workspace`: two Vite+/TanStack Start apps
(`consumer-application`, `manager-dashboard`) consuming three shared packages
(`ui`, `query`, `vite-config`) through workspace-internal dependencies, with a
single top-level `vp run ready` validation command, catalog-pinned dependencies,
and per-app environment validation via `@t3-oss/env-core`. The primary gap to
close is consistency: `consumer-application` has a `.env.example` but
`manager-dashboard` does not, even though it also has required server-only
variables (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).

## Technical Context

**Language/Version**: TypeScript ^7.0.2, Node.js >=22.18.0

**Primary Dependencies**: Vite+ (`vite-plus`, wraps
Vite/Rolldown/Vitest/Oxlint/Oxfmt) via the `vp` CLI, TanStack Start/React
Router/React Query, React 19, Tailwind CSS 4, `@t3-oss/env-core` + `valibot` for
env validation, `@powersync/web` + `@powersync/react` (consumer app),
`better-auth` (manager dashboard)

**Storage**: PowerSync (offline-first client-side sync database, consumer app
only); manager dashboard has no local storage layer configured yet

**Testing**: Vitest via `vp test` / `vp run -r test` — now exercises all 5
workspace members (`consumer-application`, `manager-dashboard`,
`packages/query`, `packages/ui`, `packages/vite-config`), up from 1/5 at
planning time

**Target Platform**: Browser (Vite dev/build for both apps); TanStack Start also
emits a server entry per app

**Project Type**: Web application monorepo — two frontend apps + shared
packages, no standalone backend service (manager dashboard's `better-auth` runs
as TanStack Start server routes, not a separate deployable)

**Performance Goals**: Not explicitly required by this spec; SC-001 (15 min to
running) and SC-004 (5s to actionable env error) are the only timed criteria

**Constraints**: Dependency versions MUST be pinned via the pnpm `catalog:`
mechanism in `pnpm-workspace.yaml` (constitution: Additional Constraints);
shared logic MUST live in `packages/*`, not be duplicated across apps

**Scale/Scope**: 2 apps, 3 shared packages, workspace glob also reserves
`tools/*` (currently empty/unused)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle             | Gate                                                                                    | Status                                                                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Code Quality       | Lint/type-check MUST run with zero errors before merge                                  | PASS — `vp check` clean across 28 files as of implementation                                                                                                                                                        |
| I. Code Quality       | No duplication between apps; shared logic factored into packages                        | PASS — `packages/{ui,query,vite-config}` remain the sole shared surface; implementation added only tests/config, no new app-level duplication introduced                                                            |
| II. Testing Standards | `vp run -r test` MUST pass across the monorepo                                          | PASS (post-implementation) — all 5 workspace members now have a `test` script and at least one real test; `vp run -r test` attributes results per member (verified, see Operations task T011 in the REASONS Canvas) |
| II. Testing Standards | Integration tests required for cross-boundary changes (app ↔ shared package, PowerSync) | DEFERRED — no PowerSync or auth integration tests exist yet; out of scope to author here but flagged as a known gap for follow-up feature work, not this bootstrap                                                  |
| III. UX Consistency   | Reuse shared design system across apps                                                  | PASS — both apps depend on `@windwise/ui` for styles; no divergent component libraries observed                                                                                                                     |
| IV. Performance       | New dependencies justified against bundle size/maintenance cost                         | N/A for this feature — no new runtime dependencies added; `packages/ui` gained `vite-plus`/`typescript`/`@types/node` as devDependencies only, mirroring sibling packages, to run its new test                      |

No unjustified violations. The Testing Standards gap identified at planning time
is now closed (see Post-Implementation Findings below for what was learned while
closing it).

## Post-Implementation Findings

Recorded after implementation and validation (`pnpm run ready`) completed. Per
SPDD/spec-kit practice, these are logged here rather than silently fixed, since
they either fall outside this feature's Safeguards-defined scope or are
pre-existing issues this feature happened to surface.

1. **Real secret leaked into local test output (security, addressed within
   scope)**: The first draft of `env.test.ts` simulated a "missing variable" by
   omitting it from `vi.stubEnv` calls rather than explicitly clearing it. On
   this machine, a real-looking OpenAI API key was already present in the
   ambient environment (a `.env`/`.env.local` or shell var), so the
   omitted-not-cleared variable let that real value flow through into a failing
   test's assertion output. Fixed within this feature by changing the test
   convention: every variable must be explicitly stubbed in every case, with the
   "missing" case set to `""` rather than left unset (see updated Norms §3 and
   Operations for T007/T008 in the REASONS Canvas prompt). The user was advised
   to rotate the exposed key as a precaution; no further action needed in this
   repo since the fix is a test-code change already applied.
2. **`vp run ready` is not idempotent across a build (tooling, out of scope —
   new follow-up needed)**: `vp build` regenerates `apps/*/src/routeTree.gen.ts`
   via TanStack Router's generator, and the generator's output formatting
   doesn't match what `vp check`'s Oxfmt formatter expects — so immediately
   after a build, `vp check` reports the two generated files as needing
   reformatting again, even though nothing meaningful changed. This is a
   pre-existing mismatch between the route-tree generator and the formatter
   config, unrelated to this feature's scope (env parity + test coverage) and
   not something the Safeguards for this feature authorized touching. **Needs
   its own follow-up spec**: either configure the generator's output style to
   match Oxfmt, or exclude generated `routeTree.gen.ts` files from `vp check`'s
   formatting pass.

Both findings are also tracked as Notion tasks (see Tasks database, Spec ID
`001-project-codebase-bootstrap`) for visibility outside the repo.

## Project Structure

### Documentation (this feature)

```text
docs/specs/001-project-codebase-bootstrap/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/
├── consumer-application/        # TanStack Start app, PowerSync-backed, AI chat integrations
│   ├── src/
│   │   ├── env.ts                # @t3-oss/env-core schema (OPENAI_API_KEY, GEMINI_API_KEY, VITE_POWERSYNC_URL, VITE_POWERSYNC_TOKEN, ...)
│   │   ├── env.test.ts           # fail-fast contract tests (added)
│   │   ├── integrations/powersync/
│   │   ├── integrations/tanstack-query/
│   │   ├── lib/powersync/
│   │   ├── router.tsx
│   │   └── routes/
│   ├── powersync-vite-plugin.ts
│   ├── .env.example               # exists
│   └── vite.config.ts
│
├── manager-dashboard/            # TanStack Start app, better-auth-backed
│   ├── src/
│   │   ├── env.ts                 # @t3-oss/env-core schema (BETTER_AUTH_SECRET, BETTER_AUTH_URL, ...)
│   │   ├── env.test.ts            # fail-fast contract tests (added)
│   │   ├── integrations/better-auth/
│   │   ├── integrations/tanstack-query/
│   │   ├── lib/auth.ts, auth-client.ts
│   │   ├── router.tsx
│   │   └── routes/ (incl. routes/api)
│   ├── .env.example               # added — closes FR-007 gap
│   └── vite.config.ts
│
packages/
├── ui/                # exports ./src/styles.css only; gained tsconfig.json + styles.test.ts + test script
├── query/              # exports createQueryClient + related; original reference test pattern
└── vite-config/        # exports tanstackAppPlugins(...); gained index.test.ts + test script

tools/                  # reserved in pnpm-workspace.yaml globs, currently empty — not populated by this feature

# Workspace-level
package.json             # root scripts: ready, dev:consumer, dev:manager, prepare (vp config)
pnpm-workspace.yaml       # workspace globs + catalog (pinned dependency versions)
vite.config.ts            # root Vite+ task config: staged hooks, fmt, lint, run cache
tsconfig.json             # root TS config (noEmit, nodenext)
docs/cspell/              # per-app spellcheck dictionaries (consumer-application.txt, manager-dashboard.txt)
```

**Structure Decision**: Standard pnpm-workspace monorepo (apps + packages), no
separate backend/frontend split — both apps are full-stack via TanStack Start.
No changes to top-level layout were required; both identified gaps (missing
`manager-dashboard/.env.example`, near-zero test coverage) are closed within the
existing structure — no new top-level directories, only new files within
existing app/package directories plus one new `packages/ui/tsconfig.json`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No entries — no constitution violations requiring justification. The
testing-coverage gap identified at planning time is now closed (see
Post-Implementation Findings above); the two newly-discovered issues found while
closing it are tracked there and as follow-up tasks, not folded into this plan's
scope.
