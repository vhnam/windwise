---
work_item: 001-project-codebase-bootstrap
sequence: 001
slug: project-codebase-bootstrap
---

# SPDD Analysis: Project Codebase Bootstrap

## Original Business Requirement

# Feature Specification: Project Codebase Bootstrap

**Feature Branch**: `chore/bootstrap-workspace`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Project codebase bootstrap: set up the Windwise
monorepo based on the current diff on chore/bootstrap-workspace — pnpm workspace
with apps/consumer-application and apps/manager-dashboard, shared packages/,
PowerSync integration, env/config conventions, and workspace tooling (vp runner,
lint/build/test wiring)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Clone and run both apps locally (Priority: P1)

A developer joining the project clones the repository, installs dependencies
once, and can start either the consumer-facing app or the manager dashboard
without manual per-app configuration beyond providing secrets.

**Why this priority**: Nothing else in the workflow (spec-kit, task tracking,
code review) matters if a new contributor can't get the workspace running. This
is the floor requirement for the codebase to be usable.

**Independent Test**: On a clean checkout, run the documented install command
once, then start each app with its documented dev command; both must serve
without editing config files (only environment variable values).

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** the developer runs the
   workspace install command, **Then** all app and shared-package dependencies
   resolve without manual per-package installs.
2. **Given** dependencies are installed and required environment variables are
   set, **When** the developer starts the consumer application, **Then** it
   serves locally and loads without build errors.
3. **Given** dependencies are installed and required environment variables are
   set, **When** the developer starts the manager dashboard, **Then** it serves
   locally and loads without build errors.

---

### User Story 2 - Validate the whole workspace with one command (Priority: P1)

A developer (or CI) runs a single top-level command to confirm the entire
workspace — every app and shared package — is internally consistent: builds
succeed, tests pass, and formatting/lint/type rules are satisfied.

**Why this priority**: This is the mechanism the constitution's Code Quality and
Testing Standards principles rely on (`vp run ready` before PRs,
`vp run -r build`/`vp run -r test` in CI). Without it, quality gates can't be
enforced consistently across a multi-app, multi-package repo.

**Independent Test**: Run the documented "ready" command against the current
workspace state; it must execute checks, tests, and builds across all workspace
members and exit non-zero on any failure.

**Acceptance Scenarios**:

1. **Given** a workspace where all packages build and tests pass, **When** the
   developer runs the validation command, **Then** it completes successfully and
   reports success for every workspace member.
2. **Given** a workspace where one package fails a lint, type, or test check,
   **When** the developer runs the validation command, **Then** it fails with
   output identifying which package and which check failed.

---

### User Story 3 - Consume shared packages from both apps (Priority: P2)

A developer changes shared code (UI components, data/query layer, or shared Vite
config) in `packages/` and both apps pick up the change without republishing or
manual linking.

**Why this priority**: This is what makes the `packages/` vs `apps/` split in
the constitution enforceable — shared logic must actually be shared, not
duplicated. It's P2 because it depends on User Story 1 (apps must run first) but
is required before real feature work can rely on shared packages.

**Independent Test**: Modify a component or utility in a shared package, restart
or hot-reload an app that depends on it, and confirm the change is reflected
without touching the app's own source.

**Acceptance Scenarios**:

1. **Given** both apps declare a dependency on a shared package via the
   workspace's internal linking mechanism, **When** the shared package's source
   changes, **Then** both apps reflect the change on their next build or
   dev-server reload.
2. **Given** a new shared package is added under `packages/`, **When** an app
   declares a dependency on it, **Then** the app can import from it without
   additional workspace configuration beyond the dependency declaration.

---

### User Story 4 - Configure environment-specific secrets and endpoints safely (Priority: P2)

A developer configures per-environment values (API keys, sync-service URL/token,
feature endpoints) through environment variables, and the app fails fast with a
clear error if a required value is missing, rather than failing silently or
leaking an undefined value into the UI.

**Why this priority**: The consumer app depends on external services (a
data-sync backend, AI provider keys) that differ per environment.
Misconfiguration here is a common source of hard-to-diagnose local-dev and
deployment failures, so it's core to "setting up the codebase" even though it's
not the first thing a developer touches.

**Independent Test**: Unset a required environment variable and start the app;
startup must fail immediately with a message naming the missing variable, not
proceed with a broken runtime state.

**Acceptance Scenarios**:

1. **Given** all required environment variables are set to valid values,
   **When** the app starts, **Then** it starts successfully and the values are
   available to the code that needs them.
2. **Given** a required environment variable is missing or invalid, **When** the
   app starts, **Then** startup fails immediately with an error naming the
   specific missing/invalid variable.
3. **Given** an example environment file exists in the repository, **When** a
   developer copies it to create their local environment file, **Then** every
   variable the app requires at startup is represented in that example file.

### Edge Cases

- What happens when a developer runs the validation command on a machine that
  has never run the install step? It MUST fail with a clear "install first"
  message rather than an obscure module-resolution error.
- What happens when two apps declare conflicting versions of the same
  third-party dependency? The workspace's dependency resolution strategy MUST
  surface this as a resolvable, visible conflict (e.g., a single pinned/catalog
  version) rather than silently letting each app use a different version.
- What happens when a shared package under `packages/` is deleted or renamed
  while an app still imports from it? The build/validation command MUST fail
  with an error identifying the missing package, not succeed silently.
- What happens when the data-sync (PowerSync) service is unreachable during
  local development? The consumer app MUST surface a visible connection/error
  state rather than hanging or crashing the whole app.
- What happens when a new app or package is added to the monorepo but not
  registered in the workspace member list? It MUST be excluded from
  installs/builds until registered, and this exclusion should be discoverable
  (not a silent no-op).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The workspace MUST define its member packages (apps and shared
  packages) in a single top-level configuration so that one install command
  resolves dependencies for all of them.
- **FR-002**: The workspace MUST provide one command per app to start that app's
  local development server.
- **FR-003**: The workspace MUST provide one top-level command that runs checks
  (lint/format/type-check), tests, and builds across every workspace member and
  fails if any member fails.
- **FR-004**: Shared code MUST live in dedicated shared packages, and apps MUST
  consume shared code through a workspace-internal dependency reference rather
  than by copying source files.
- **FR-005**: Each app MUST declare its required environment variables in one
  place per app, distinguishing values needed only at build/server time from
  values exposed to client-side code.
- **FR-006**: Each app MUST validate its required environment variables at
  startup and fail with a specific, actionable error when a required value is
  missing or malformed.
- **FR-007**: Each app MUST ship an example environment file listing every
  variable it requires, with placeholder (non-secret) values, kept in sync with
  what the app's startup validation actually requires.
- **FR-008**: The workspace MUST pin shared third-party dependency versions in
  one place so multiple apps/packages don't silently diverge on the same
  dependency's version.
- **FR-009**: The consumer application MUST integrate with the offline-capable
  data-sync service (PowerSync) such that the local dev build can connect to a
  configured sync endpoint.
- **FR-010**: The workspace MUST document, in a discoverable location (e.g.,
  root README), the install command, the per-app dev commands, and the top-level
  validation command.
- **FR-011**: The build/validation command MUST distinguish failures by
  workspace member (app or package) so a failure in one member doesn't require
  inspecting the whole workspace output to locate.

### Key Entities

- **App**: A deployable unit under `apps/` (currently `consumer-application`,
  `manager-dashboard`) with its own dev/build/preview commands and environment
  configuration, consuming shared packages.
- **Shared Package**: A non-deployable unit under `packages/` (currently `ui`,
  `query`, `vite-config`) exposing reusable code to one or more apps via
  workspace-internal dependency references.
- **Environment Configuration**: The set of required/optional variables an app
  needs at build- or run-time, split into server-only and client-exposed values,
  validated at startup.
- **Workspace Validation Run**: The result of the single top-level
  check/test/build command, scoped per workspace member, used both locally
  before a PR and in CI as a merge gate.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A developer with no prior repo-specific knowledge can get from a
  fresh clone to both apps running locally in under 15 minutes, following only
  the root documentation.
- **SC-002**: The top-level validation command reports pass/fail for 100% of
  workspace members (every app and package) in a single run, with no member
  silently skipped.
- **SC-003**: A change made to a shared package is reflected in a consuming
  app's local dev server without any change to the app's own source files,
  verified for at least one shared package per app.
- **SC-004**: Starting an app with a missing required environment variable
  produces an actionable error identifying that variable in under 5 seconds,
  rather than an unrelated runtime failure.
- **SC-005**: Zero instances of duplicated component/utility logic exist between
  the two apps for functionality already available in a shared package (verified
  by review, not automated in v1).

## Assumptions

- "Users" of this bootstrap feature are developers/contributors working in the
  repository, not end users of the consumer or manager applications.
- The workspace tooling (`vp` / Vite+) referenced in the current diff and
  `AGENTS.md` is treated as an accepted dependency of the workspace; this spec
  covers how apps/packages are organized and wired for it, not evaluation of the
  tool itself.
- Two apps (`consumer-application`, `manager-dashboard`) and three shared
  packages (`ui`, `query`, `vite-config`) are in scope as reflected in the
  current branch diff; additional apps/packages follow the same conventions but
  are out of scope for this spec.
- PowerSync (or an equivalent offline-first sync service) is an accepted
  external dependency for the consumer application; evaluating alternative sync
  strategies is out of scope.
- Secret values (API keys, tokens) are supplied via local environment files that
  are never committed; this spec covers the validation contract for those
  values, not a secrets-management system.
- CI wiring (which platform, how the validation command is invoked in CI) is out
  of scope for this spec — FR-003/SC-002 only require that a single local
  command exists and is CI-runnable, not that CI itself is configured here.

_(Note: this is the full text of
`docs/specs/001-project-codebase-bootstrap/spec.md` as produced by
`/speckit-specify`, reproduced verbatim as the business requirement input for
this analysis. The same feature directory also contains `plan.md`,
`research.md`, `data-model.md`, `contracts/workspace-commands.md`, and
`quickstart.md` from `/speckit-plan` — these were read as supporting design
context, not as the requirement itself, and are referenced below where they
change the picture.)_

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **App** (`apps/*`): a deployable TanStack Start unit. Two instances exist —
  `consumer-application` (port 3000, member-facing) and `manager-dashboard`
  (port 4000, staff-facing) — each with its own `package.json`,
  `vite.config.ts`, `src/env.ts`, and README.
- **Shared Package** (`packages/*`): a non-deployable unit exposed via
  `package.json` `exports` and consumed through `workspace:*`. Three instances:
  `@windwise/ui` (Tailwind entry CSS only), `@windwise/query` (TanStack Query
  client factory + SSR router helper — the only package with a test file),
  `@windwise/vite-config` (composes Start/React-Compiler/Tailwind Vite plugins
  as `tanstackAppPlugins(...)`).
- **Workspace Catalog** (`pnpm-workspace.yaml` `catalog:`): the single place
  third-party dependency versions are pinned; every app/package `package.json`
  already references `catalog:` instead of literal versions, plus an explicit
  `overrides: { vite: "catalog:" }` showing deliberate anti-drift intent.
- **Environment Configuration** (`src/env.ts` per app, via `@t3-oss/env-core` +
  `valibot`): splits `server` (never sent to client) from `client` (must be
  `VITE_`-prefixed) variables, validated eagerly at import time. Both apps
  already follow this exact pattern independently — the pattern itself is a de
  facto convention, not yet a shared abstraction.
- **Workspace Validation Run** (`vp run ready` =
  `vp check && vp run -r test && vp run -r build`): already named explicitly in
  the constitution ("Before opening a PR, contributors MUST run `vp run ready`
  locally") and already implemented as a root `package.json` script.
- **PowerSync integration** (consumer app only): offline-first client-side sync
  DB (`src/lib/powersync/AppSchema.ts`, `BackendConnector.ts`,
  `src/integrations/powersync/provider.tsx`, plus a dedicated
  `powersync-vite-plugin.ts` that excludes `@powersync/web` from dep
  pre-bundling and forces ES-format workers).
- **Better Auth integration** (manager-dashboard only): `src/lib/auth.ts`,
  `auth-client.ts`, HTTP handler at `src/routes/api/auth/$.ts`. Per the app's
  own README, it is currently **stateless — no database adapter configured**, so
  registered users do not persist across restarts.
- **Root/App READMEs**: FR-010 ("document install/dev/validate commands in a
  discoverable location") is already substantially satisfied — the root README
  has a Layout section, a Commands table (`vp run ready`, `vp check`, `vp test`,
  `vp run -r test`, `vp run -r build`, `vp run dev:consumer`,
  `vp run dev:manager`), and links to each app's own README.

#### New Concepts Required (status: implemented since original analysis)

- **`apps/manager-dashboard/.env.example`**: was a missing _instance_ of the
  existing Environment Configuration concept — **closed**. The file now exists,
  generated from the app's own README variable table and cross-checked against
  `src/env.ts` as source of truth; the README's Setup section was updated to
  `cp .env.example .env.local`, matching `consumer-application`'s pattern.
- **Baseline test per untested workspace member**: `consumer-application`,
  `manager-dashboard`, `packages/ui`, and `packages/vite-config` had zero test
  files — **closed**. All 4 members gained a `"test": "vp test"` script and one
  real test each; `vp run -r test` now validates 5/5 members and reports
  individually per member (verified as its own Operations task).
- **Better Auth persistence decision**: not in the original spec's scope at all,
  but surfaced by codebase exploration — whether/when to add a database adapter
  to `better-auth` is an open concept the requirement doesn't address. **Still
  open** — explicitly kept out of scope during implementation (Safeguards §6)
  and not addressed here.
- **Test-isolation discipline for env-schema tests** _(new concept, surfaced
  during implementation)_: writing a test that asserts "app fails when variable
  X is missing" is not as simple as omitting a `vi.stubEnv` call — the
  developer's real ambient environment (a loaded `.env.local`, a shell-exported
  var) can silently supply a real value in its place. The concept that had to be
  introduced was **explicit-stub-to-empty-string** as the only reliable way to
  simulate "missing" in a test, regardless of ambient state. This is now encoded
  as a project Norm, not just a one-off fix — and its absence caused a real API
  key to leak into local test output during implementation (see Risk & Gap
  Analysis).
- **Non-idempotent validation pipeline** _(new concept, surfaced during
  implementation)_: `vp run ready`'s three steps (`check` → `test` → `build`)
  are not fully order-independent — `build` regenerates
  `apps/*/src/routeTree.gen.ts` in a format `check`'s formatter then flags, so a
  second `check` immediately after a `build` fails again on files nothing
  meaningfully changed in. The original data model assumed each step's effects
  were independent; this remains open as a follow-up (tracked as Notion task
  T013).

#### Key Business Rules

- **Single install, single validation surface** (governs App, Shared Package):
  one `pnpm install` and one `vp run ready` must cover every workspace member —
  no member may require a bespoke install or validation step (FR-001, FR-003,
  FR-011).
- **No cross-boundary copying** (governs App ↔ Shared Package): apps must
  reference `packages/*` via `workspace:*`, never via relative imports or
  duplicated source (FR-004; constitution "Additional Constraints").
- **Fail-fast, named-variable errors** (governs Environment Configuration): a
  missing/invalid required variable must abort startup with the specific
  variable name, not proceed into a partially-configured runtime (FR-006,
  SC-004).
- **Documentation parity between apps** (implicit, surfaced by exploration, not
  stated in the spec): whatever config surface one app documents (example file,
  README table), the other app should document to the same standard — currently
  violated by the `.env.example` asymmetry.

## Strategic Approach

#### Solution Direction

This was a **gap-closing bootstrap**, not new construction — nearly every
functional requirement already had a working implementation in the diff
(`pnpm-workspace.yaml` catalog, `vp run ready`, per-app `env.ts`, `workspace:*`
package references, root/app READMEs). The direction taken: (1) verify each FR
against the actual current repo state, (2) close the two concrete gaps codebase
exploration surfaced — the missing `manager-dashboard/.env.example` and the
near-total absence of tests outside `packages/query` — and (3) leave everything
already conforming untouched. **Status: executed.** Both gaps are closed,
`pnpm run ready` passes clean, and the implementation surfaced two additional
issues not visible from static analysis alone (a test-isolation bug and a
validation-pipeline non-idempotency), both now tracked as follow-up work rather
than folded into this feature.

#### Key Design Decisions

- **Fix the `.env.example` gap by mirroring the existing pattern, not inventing
  a new one**: **done as planned** — `.env.example` generated from
  `manager-dashboard`'s own README table, cross-checked against `env.ts`;
  README's Setup section updated to `cp .env.example .env.local` for parity with
  `consumer-application`.
- **Scope the testing gap to "one real test per untested member," not full
  coverage**: **done as planned** — all 5 workspace members now have exactly one
  meaningful test each. One design decision emerged only during execution, not
  anticipated in the original plan: tests asserting "fails when a variable is
  missing" needed an explicit-stub-to-empty-string convention rather than simply
  omitting the variable, because omitting it let the developer's real ambient
  environment (a `.env.local`, a shell var) supply a real value instead — which
  is what actually happened once, leaking a real API key into test output. This
  is now a documented Norm, not just a fix applied once.
- **Leave the Better Auth persistence question out of this feature's scope, but
  record it as a named follow-up**: **held as planned** — not touched during
  implementation, remains an open, explicitly out-of-scope item.
- **New decision surfaced during implementation, not present in original
  analysis — treat pipeline non-idempotency as a separate follow-up, not a
  blocker**: discovering that `vp build` regenerates `routeTree.gen.ts` in a
  format `vp check` then re-flags meant `pnpm run ready` had to be run twice
  (with an intermediate `vp check --fix`) to reach a clean state. Trade-off: fix
  the generator/formatter mismatch now vs. defer. Recommendation: defer — it's a
  pre-existing, unrelated tooling issue (not introduced by this feature, not
  something its Safeguards authorized touching), tracked as Notion task T013 for
  its own investigation.

#### Alternatives Considered

- **Introduce a shared `@windwise/env` package to centralize the two apps'
  `env.ts` schemas**: rejected (already rejected in `research.md`) — the two
  apps' required variables barely overlap (PowerSync vs. Better Auth), so
  centralizing now would be a speculative abstraction ahead of a real third
  consumer, conflicting with the constitution's implicit YAGNI stance alongside
  its no-duplication rule.
- **Author full integration test suites for PowerSync and Better Auth as part of
  this feature**: rejected — the constitution requires integration tests for
  _changes_ that cross boundaries going forward, not retroactive full coverage
  of already-merged infra code as part of a bootstrap; this belongs to whichever
  future feature next touches those integration points.
- **Fix Better Auth statelessness now (add a DB adapter)**: rejected for this
  feature — out of the original requirement's scope, and changes a real
  architectural decision (which DB, which adapter) that the current spec never
  raised; flagged instead as a risk for a follow-up spec.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **"Documented, in a discoverable location" (FR-010) has no explicit acceptance
  bar**: **resolved by implementation** — `.env.example` was made mandatory for
  every app with server-only secrets, closing the ambiguity that let
  `manager-dashboard` previously ship without one.
- **"Baseline test" bar for SC-002/FR-003 is undefined**: **resolved by
  implementation** — the bar applied was "one test exercising the member's most
  spec-relevant behavior" (env fail-fast contract for the two apps, plugin
  composition for `vite-config`, file-content check for `ui`), not a trivial
  smoke test. This precedent should inform future features that need to define
  "baseline test" again.

#### Edge Cases

- **Better Auth with no database adapter, in production-like use**: not
  addressed by the spec at all. If `manager-dashboard` is used beyond local dev
  without adding persistence, registered users/sessions vanish on every restart
  — a functional gap the requirement's edge-case list doesn't mention, surfaced
  only by reading the app's own README.
- **`tools/*` workspace glob is empty**: `pnpm-workspace.yaml` reserves a
  `tools/*` package glob that currently matches nothing. Not a bug, but worth
  flagging: if `vp run ready`'s recursive commands assume at least one match per
  glob for some reporting step, an empty glob could behave differently than an
  occupied one — worth a quick check during implementation, not just an
  assumption.
- **PowerSync dev token**: `consumer-application`'s README explicitly flags
  `VITE_POWERSYNC_TOKEN` as "Dev token only; replace with real auth before
  production" — this is a known, self-documented temporary state similar to
  Better Auth's statelessness, and probably deserves the same "tracked, not
  fixed here" treatment.

#### Technical Risks

- **`vp run -r test` "passing" was a false signal of health for 4 of 5
  members**: **resolved** — all members now have real tests; `vp run -r test`
  was verified post-implementation to attribute pass/fail individually per
  member (5/5 shown separately in output), confirming the contract note in
  `contracts/workspace-commands.md` rather than just assuming it.
- **Catalog pinning is a convention, not an enforced gate**: unchanged, still
  true, still low risk — not addressed by this feature (no tooling gate was in
  scope).
- **New risk, discovered during implementation — test-isolation gaps can leak
  real secrets**: a test written to simulate "variable missing" by simply not
  stubbing it does not actually guarantee the variable is absent — the real
  ambient environment (a loaded `.env.local`, a shell-exported var) can supply a
  real value that then appears in test failure output. This happened once during
  implementation (a real-looking OpenAI API key surfaced in local terminal
  output while debugging a failing test). Mitigated going forward by a new Norm
  (explicit-stub-to-empty-string for every variable in every case), but the
  specific key that leaked still needs manual rotation by the developer —
  tracked as Notion task T012, not something the codebase can self-remediate.
- **New risk, discovered during implementation — `@t3-oss/env-core`'s default
  error does not name the failing variable in `error.message`**: the original
  analysis assumed (from reading `env.ts` alone, without executing it) that a
  validation failure would throw "a Valibot error naming the field." **This was
  incorrect.** The library's default `onValidationError` throws a generic
  `Error("Invalid environment variables")` and logs the actual field path via
  `console.error`, separately from the thrown error object. This matters beyond
  testing: a developer relying on the thrown exception's message alone (e.g., in
  error monitoring/Sentry breadcrumbs that capture `error.message` but not
  console output) would not see which variable was missing — only "Invalid
  environment variables." Worth flagging as a possible future UX gap (FR-006
  says errors must be "actionable"; today that actionability lives in
  `console.error`, not in the exception itself), though out of scope to fix here
  since `env.ts`'s runtime behavior was explicitly not to be altered by this
  feature.
- **New risk, discovered during implementation — the validation pipeline is not
  idempotent**: `vp build` regenerates `routeTree.gen.ts` in a format `vp check`
  then flags, so running `check → test → build` once is not equivalent to
  running it twice — a second `vp check` after `build` fails again on files
  nothing meaningfully changed in. This weakens confidence in "if `vp run ready`
  passes once, the workspace is clean," since a build step can leave the tree in
  a state the check step would reject. Tracked as Notion task T013; needs its
  own investigation into the router-generator/formatter config.

#### Acceptance Criteria Coverage

| AC#   | Description                                                                  | Addressable? | Gaps/Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----- | ---------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1-1 | Fresh clone → single install resolves all deps                               | Yes          | Already true (`pnpm-workspace.yaml` globs cover `apps/*`, `packages/*`, `tools/*`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| US1-2 | Consumer app serves after env set                                            | Yes          | Already true; `.env.example` exists and matches `env.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| US1-3 | Manager app serves after env set                                             | Yes          | **Closed** — `.env.example` now exists and README updated for parity with `consumer-application`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| US2-1 | Validation command succeeds when all members pass                            | Yes          | `vp run ready` already implements this                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| US2-2 | Validation command fails with attributable output when one member fails      | Yes          | **Closed and verified** — all 5 members have real tests; `vp run -r test` confirmed post-implementation to attribute results individually per member                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| US3-1 | Shared-package source change reflected in both apps without app-source edits | Yes          | Already true via `workspace:*` + Vite/pnpm linking; no code change needed, only verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| US3-2 | New shared package importable by apps with only a dependency declaration     | Yes          | Already true, demonstrated by the existing three packages following identical `exports`-based pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| US4-1 | App starts successfully with valid env                                       | Yes          | Already true for both apps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| US4-2 | App startup fails fast with named variable on invalid/missing env            | Partial      | **Correction from original analysis**: verified by execution that `@t3-oss/env-core` throws a **generic** `Error("Invalid environment variables")` — the variable name is NOT in the thrown message, only in a separate `console.error` call. The original "Yes" assessment was an untested assumption from reading the code alone. Functionally still fail-fast and the name is visible in terminal output, so treated as Partial rather than a hard gap — but any code path that only inspects `error.message` (e.g. error-monitoring integrations) would not see the variable name. |
| US4-3 | Example env file lists every required variable                               | Yes          | **Closed** — `manager-dashboard/.env.example` now exists and matches `env.ts` exactly                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
