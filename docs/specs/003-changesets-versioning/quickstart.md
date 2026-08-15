# Quickstart: Per-Package Version Management with Changesets

**Feature**: [spec.md](./spec.md) | **Data model**:
[data-model.md](./data-model.md)

Validates User Stories 1 and 2 end-to-end.

## Prerequisites

- Workspace dependencies installed (`pnpm install`).
- `@changesets/cli` present in the root `devDependencies` (already wired via the
  pnpm `catalog:`).
- `.changeset/config.json` present at repo root.

## Scenario A — Record a change (User Story 1)

1. Make a shipped-behavior change to a single package, e.g. `packages/ui`.
2. Run:
   ```bash
   vp run changeset
   ```
3. Follow the interactive prompts: select the affected package(s), choose an
   impact level (patch/minor/major), and write a one-line summary.
4. **Expected outcome**: a new Markdown file appears under `.changeset/` naming
   only the package(s) selected — no `package.json` version has changed yet
   (Acceptance Scenario US1.1).
5. Commit the generated `.changeset/*.md` file alongside the code change in the
   same PR.

## Scenario B — Apply pending changes (User Story 2)

1. Ensure at least one `.changeset/*.md` file exists (from Scenario A, or create
   records for two different packages with different impact levels to verify
   independence).
2. Run:
   ```bash
   vp run changeset:version
   ```
3. **Expected outcome**:
   - Each named package's `package.json` `version` is bumped according to the
     highest impact level recorded for it (Acceptance Scenario US2.1).
   - Each affected package gains/updates a `CHANGELOG.md` entry.
   - If a changed package has in-workspace dependents, their internal
     `workspace:*` version references are updated per the patch-level policy
     (Acceptance Scenario US2.2).
   - The consumed `.changeset/*.md` files are deleted.
   - Packages with no pending records are untouched (Acceptance Scenario US2.3 /
     INV-2).
4. Review the diff, then commit as a release-preparation commit.

## Scenario C — Nothing pending

1. With no `.changeset/*.md` files present, run:
   ```bash
   vp run changeset:version
   ```
2. **Expected outcome**: no `package.json` or `CHANGELOG.md` changes; Changesets
   reports there is nothing to do (Acceptance Scenario US2.3).

## Validating independence (SC-004)

1. Create change records for two unrelated packages (e.g. `packages/query` at
   `patch`, `packages/ui` at `minor`).
2. Run Scenario B.
3. **Expected outcome**: `packages/query`'s version increments by patch,
   `packages/ui`'s increments by minor — different resulting version deltas,
   confirming versions are not forced into lockstep.

## Contributor documentation check (User Story 3)

- Read `AGENTS.md` → "Package versions (Changesets)" and `.changeset/README.md`.
- Confirm both explain: when a changeset is required, how to run
  `vp run changeset`, and how to pick an impact level — without needing to ask a
  teammate (Acceptance Scenario US3.1/US3.2).
