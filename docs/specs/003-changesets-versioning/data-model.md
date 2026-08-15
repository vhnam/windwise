# Data Model: Per-Package Version Management with Changesets

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

This feature has no application database — "entities" here are the artifacts the
tooling reads and writes on disk within the workspace.

## Package

Represents a single independently-versioned workspace member (an app under
`apps/*` or a shared library under `packages/*`, plus the workspace root).

| Field                 | Type      | Notes                                                        |
| --------------------- | --------- | ------------------------------------------------------------ |
| `name`                | string    | e.g. `@windwise/ui`; unique across the workspace             |
| `version`             | semver    | Independent per package; starts at `0.1.0` baseline (FR-008) |
| `private`             | boolean   | MUST be `true` for every package in this workspace (FR-005)  |
| `dependsOnInternal[]` | Package[] | Other workspace packages referenced via `workspace:*`        |

**Validation rules**:

- `version` MUST be valid semver.
- `private` MUST be `true` — enforced by convention/review, not by the
  Changesets tool itself.
- A `Package`'s `version` MUST NOT change except through the version-apply step
  (User Story 2) or an explicit baseline initialization (FR-008).

**State transitions**: `version` only advances forward (no downgrades) and only
as a result of consuming one or more `Change Record`s that name it, directly or
via `dependsOnInternal`.

## Change Record

Represents a pending, contributor-authored declaration that one or more packages
changed in a way that should affect their version. Physically, one Markdown file
per record under `.changeset/`.

| Field        | Type                                | Notes                                                         |
| ------------ | ----------------------------------- | ------------------------------------------------------------- |
| `packages[]` | `{ name: Package, impact }`         | One or more affected packages, each with its own impact level |
| `impact`     | enum: `patch` \| `minor` \| `major` | Per package, per FR-001                                       |
| `summary`    | string (markdown body)              | Human-readable description, becomes the changelog line        |

**Validation rules**:

- MUST name at least one existing `Package`.
- `impact` MUST be one of `patch` / `minor` / `major` (FR-001).
- Exists only until consumed by the version-apply step (FR-007) — it is deleted
  once its effect is folded into a `Changelog Entry` and a `Package` version
  bump.

**Relationships**: Many `Change Record`s → one `Package` (a package may have
multiple pending records; the highest `impact` among them wins per FR-003).

## Changelog Entry

Represents a human-readable, package-scoped record of what changed in a given
released version. Physically, an entry appended to that package's
`CHANGELOG.md`.

| Field       | Type     | Notes                                                                         |
| ----------- | -------- | ----------------------------------------------------------------------------- |
| `package`   | Package  | The single package this entry belongs to                                      |
| `version`   | semver   | The version this entry documents                                              |
| `summary[]` | string[] | One or more summaries, sourced from Change Records that targeted this package |

**Relationships**: One `Changelog Entry` is produced per `Package` per
version-apply run, aggregating all `Change Record`s that named that package
(FR-003).

## Invariants (cross-entity)

- INV-1: Two `Package`s with disjoint sets of consumed `Change Record`s MUST end
  up with different, independently-derived `version` values after a
  version-apply run (SC-004).
- INV-2: A `Package` with zero pending `Change Record`s MUST be untouched by a
  version-apply run (FR-007).
- INV-3: When Package A's `dependsOnInternal` includes Package B, and B receives
  any version bump, A's internal reference to B is updated by at least a
  patch-level bump (FR-004, per the `updateInternalDependencies: "patch"` policy
  in research.md), even if A has no `Change Record` of its own.
