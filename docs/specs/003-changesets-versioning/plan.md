# Implementation Plan: Per-Package Version Management with Changesets

**Branch**: `003-changesets-versioning` | **Date**: 2026-08-15 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/003-changesets-versioning/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Adopt Changesets (`@changesets/cli`) so every app and shared package in the pnpm
workspace versions independently: contributors record pending, package-scoped
change files (`vp run changeset`) as part of a PR, and maintainers later consume
them in one action (`vp run changeset:version`) to bump each affected package's
version, write its changelog, and keep in-workspace dependents' internal version
references in sync — without ever publishing any (private) package to a
registry.

## Technical Context

**Language/Version**: TypeScript / Node.js (workspace already targets Node
`>=22.18.0` per root `package.json`)

**Primary Dependencies**: `@changesets/cli` (pinned via the pnpm `catalog:`
entry `^2.31.0`), invoked through the existing `vp` (vite-plus) task runner

**Storage**: N/A — state lives in versioned files: `.changeset/*.md` (pending
change records), each package's `package.json` (`version`), and each package's
`CHANGELOG.md`

**Testing**: No new automated test suite — this is workspace tooling
configuration; validated via the manual quickstart scenarios in
[quickstart.md](./quickstart.md) (record → apply → verify independent version
deltas)

**Target Platform**: Local developer machines and CI, via pnpm workspace
commands (`vp run changeset`, `vp run changeset:version`)

**Project Type**: Monorepo tooling / dev-workflow configuration (not an app
feature) — pnpm workspace with `apps/*` and `packages/*`

**Performance Goals**: N/A — one-off CLI invocations by
contributors/maintainers, not a runtime-performance-sensitive path

**Constraints**: All packages MUST remain `"private": true` and MUST NOT be
published (`access: "restricted"` in `.changeset/config.json`); internal
`workspace:*` dependency references MUST be kept in sync via a conservative
(`patch`) bump policy rather than manual edits

**Scale/Scope**: Applies uniformly to every current and future workspace member
(currently: `windwise` root, `apps/consumer-application`,
`apps/manager-dashboard`, `packages/query`, `packages/ui`,
`packages/vite-config`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality**: No app/package logic changes; config-only. `.changeset/`
  files and docs updates go through normal PR review. PASS.
- **II. Testing Standards**: No new runtime behavior to unit/integration test;
  this is dev tooling. Validated via the manual quickstart scenarios instead of
  automated tests — acceptable because there is no user-facing code path. PASS
  (no test gap for shipped product behavior).
- **III. User Experience Consistency**: N/A — no UI surface. PASS (not
  applicable).
- **IV. Performance Requirements**: No runtime/bundle impact — `@changesets/cli`
  is a `devDependency` only, never shipped to app bundles. PASS.
- **Additional Constraints (tech stack)**: Uses pnpm workspaces + the existing
  `vp` runner, consistent with the mandated stack. PASS.

No violations; Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
docs/specs/003-changesets-versioning/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory: this feature exposes no API, CLI grammar, or service
boundary to other systems — it configures two existing `vp` scripts
(`changeset`, `changeset:version`) that wrap `@changesets/cli` directly. Skipped
per the Phase 1 instruction to omit contracts for purely internal tooling.

### Source Code (repository root)

```text
.changeset/
├── config.json               # access/commit/updateInternalDependencies policy
├── README.md                 # contributor-facing usage note
└── *.md                       # pending change records (created per PR, consumed on release)

package.json                   # root: "version", changeset/changeset:version scripts, @changesets/cli devDependency
pnpm-workspace.yaml             # catalog: entry pinning @changesets/cli version
apps/consumer-application/package.json  # "version" field added
apps/manager-dashboard/package.json     # "version" field added
packages/query/package.json             # "version" field added
packages/ui/package.json                # "version" field added
packages/vite-config/package.json       # "version" field added

AGENTS.md                       # "Package versions (Changesets)" contributor doc
README.md                        # command table entries for changeset / changeset:version
```

**Structure Decision**: No new source directories. This is workspace-root
tooling configuration living at the repo root (`.changeset/`) plus a `"version"`
field added to each existing package manifest under `apps/*` and `packages/*` —
matching the monorepo's existing structure rather than introducing a new project
type.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — this section is not applicable.
