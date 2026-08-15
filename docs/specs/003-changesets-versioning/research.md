# Research: Per-Package Version Management with Changesets

**Feature**: [spec.md](./spec.md)

This feature is largely already implemented in the working tree (reviewed prior
to spec authoring). Research here documents the decisions already made so
they're traceable, and confirms no open unknowns remain.

## Decision: Tool choice — Changesets

- **Decision**: Use `@changesets/cli` to manage independent per-package
  versioning and changelogs.
- **Rationale**: Changesets is purpose-built for exactly this problem in
  pnpm/npm workspaces — per-package pending change records (Markdown files under
  `.changeset/`) that are later consumed to bump versions and write changelogs
  independently per package. It integrates natively with pnpm workspace protocol
  (`workspace:*`) dependencies and requires no custom scripting for the core
  workflow (FR-001, FR-003).
- **Alternatives considered**:
  - **Lerna (independent mode)**: heavier, largely superseded for this use case,
    and its independent-versioning UX is less contributor-friendly than
    Changesets' per-PR Markdown records.
  - **Manual version bumps in PR review**: rejected — does not scale, easy to
    forget (violates SC-002's traceability requirement), and gives no changelog
    generation.
  - **Conventional Commits → semantic-release**: rejected because it infers
    version impact from commit messages, which conflates git history
    (branch/commit conventions) with package release intent — the project's
    `AGENTS.md` already separates these two identities (see Constraints below).

## Decision: Registry access level

- **Decision**: `.changeset/config.json` sets `"access": "restricted"`.
- **Rationale**: All workspace packages are `"private": true` (per Assumptions
  in spec.md) and must never be published to a public registry. `restricted` is
  the safer default for scoped packages and combined with `"private": true` in
  each `package.json`, blocks accidental `npm publish` (FR-005).
- **Alternatives considered**: `"public"` — rejected, no package in this
  workspace is intended for public npm distribution.

## Decision: Internal dependency update policy

- **Decision**: `updateInternalDependencies: "patch"` — when a package a
  dependent relies on gets any version bump, the dependent's internal
  `workspace:*`-resolved reference is bumped by at least a patch release.
- **Rationale**: Conservative default that satisfies FR-004 (keep dependents in
  sync) without forcing unrelated major/minor bumps onto dependents that didn't
  themselves change behavior. Matches the Assumptions section's "smallest
  necessary bump" policy.
- **Alternatives considered**: Leaving internal deps unmanaged — rejected, would
  require manual edits to every dependent's manifest (violates FR-004 and
  SC-003's "zero manual edits" outcome).

## Decision: Version baseline

- **Decision**: All existing packages (apps and shared packages) that lacked a
  version are initialized to `0.1.0`; the workspace root also moved from `0.0.0`
  to `0.1.0`.
- **Rationale**: Establishes a uniform, known starting point (FR-008) without
  attempting to reconstruct historical version numbers retroactively, which the
  Assumptions section explicitly rules out as out of scope.
- **Alternatives considered**: `1.0.0` — rejected; packages are still in initial
  development per the project's stated `0.1.0` baseline convention.

## Decision: Commit behavior

- **Decision**: `"commit": false` — Changesets does not auto-commit change
  records or version bumps; contributors and maintainers commit explicitly as
  part of their normal PR / release workflow.
- **Rationale**: Keeps the tool's side effects visible and reviewable in normal
  git flow; avoids surprising commits outside the contributor's control.

## Decision: Permission model for the two workflows

- **Decision**: Recording a change (`vp run changeset`) is unrestricted — any
  contributor can run it locally as part of authoring a PR. Applying pending
  changes (`vp run changeset:version`) is treated as a maintainer/release action
  per existing repo contribution policy (branch protection / review requirements
  already governing `main`), not gated by new tooling.
- **Rationale**: Matches FR-009 — no new permission system is introduced; the
  existing PR review and branch-protection conventions in `AGENTS.md` already
  gate who can merge changes that include a version-apply commit.
- **Alternatives considered**: A CI bot that auto-applies changesets on merge to
  `main` — deferred as a future enhancement, out of scope for this spec (adds
  infrastructure not required by any FR/SC here).

## Open Unknowns

None. All `Technical Context` fields for this feature are internal tooling
config with no ambiguity remaining; no `[NEEDS CLARIFICATION]` markers exist in
spec.md.
