---
work_item: 003-changesets-versioning
sequence: 003
slug: changesets-versioning
---

# SPDD Analysis: Per-Package Version Management with Changesets

## Original Business Requirement

# Feature Specification: Per-Package Version Management with Changesets

**Feature Branch**: `003-changesets-versioning`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "please write spec to implement changesets to
manage version for each package"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Record a version-worthy change (Priority: P1)

A contributor changes the behavior or API of a workspace package (an app or a
shared package) and needs to record that this change should be reflected in that
package's version number and changelog, without needing to know or coordinate
the version numbers of any other package in the workspace.

**Why this priority**: This is the core workflow — without a reliable way to
declare "this package changed, and here's how," there is no independent
versioning at all. Every other capability builds on this one.

**Independent Test**: Can be fully tested by making a change to a single
package, recording the change, and confirming that only that package (and
packages that depend on it, per policy) is queued for a version bump — no other
unrelated package is affected.

**Acceptance Scenarios**:

1. **Given** a contributor has changed the shipped behavior of one package,
   **When** they record the change and specify its impact level (patch, minor,
   or major), **Then** the change is captured as a pending, package-scoped
   record that has not yet altered any `package.json` version.
2. **Given** a contributor has changed only documentation, formatting, or
   internal tooling with no shipped-behavior impact, **When** they follow the
   project's guidance, **Then** they correctly determine no version record is
   needed.
3. **Given** multiple pending change records exist for different packages,
   **When** a maintainer inspects the pending records, **Then** each record is
   clearly attributed to the specific package(s) it affects and its intended
   impact level.

---

### User Story 2 - Apply pending changes to produce new versions and changelogs (Priority: P2)

A maintainer preparing a release wants to consume all pending, package-scoped
change records at once and have each affected package's version number and
changelog updated to reflect exactly what changed in that package —
independently of every other package's version.

**Why this priority**: This is the release-preparation step that turns recorded
intent (Story 1) into an actual, reviewable outcome (updated versions and
changelogs). It depends on Story 1 existing but is the payoff that makes
recording changes worthwhile.

**Independent Test**: Can be fully tested by creating pending change records for
two different packages with different impact levels, running the
version-application step, and confirming each package's version increments
according to its own recorded impact level (not the other package's) and gains a
changelog entry describing its own change.

**Acceptance Scenarios**:

1. **Given** one or more pending change records exist for a package, **When**
   the maintainer applies pending changes, **Then** that package's version
   number increases according to the highest recorded impact level (major >
   minor > patch) among its pending records, and a changelog entry summarizing
   the change(s) is added for that package.
2. **Given** package A depends on package B within the workspace and B has a
   pending change record but A does not, **When** pending changes are applied,
   **Then** A's internal dependency reference on B is updated consistently with
   the project's dependency-update policy, without requiring a separate manual
   edit.
3. **Given** no pending change records exist, **When** the maintainer attempts
   to apply pending changes, **Then** no package version or changelog is
   modified and the maintainer is informed there is nothing to apply.
4. **Given** pending changes have been applied, **When** the maintainer inspects
   the affected packages, **Then** each package's new version number is
   independent of, and not synchronized to, the versions of unaffected packages.

---

### User Story 3 - Understand and follow the versioning workflow (Priority: P3)

A contributor who is new to the workspace (or a returning contributor who hasn't
touched versioning recently) wants to quickly understand when and how to record
a version-worthy change, so they can follow the workflow correctly without
needing to ask a teammate.

**Why this priority**: Correct adoption depends on the workflow being
discoverable and unambiguous. This is lower priority than Stories 1–2 because
the underlying mechanism must exist first, but it materially affects whether the
workflow is actually followed correctly over time.

**Independent Test**: Can be fully tested by having a contributor unfamiliar
with the workflow read the project's contributor-facing guidance and correctly
complete Story 1's workflow without additional help.

**Acceptance Scenarios**:

1. **Given** a contributor is preparing a pull request that changes a package's
   shipped behavior, **When** they consult the project's contributor-facing
   documentation, **Then** they can determine, without asking a teammate,
   whether a change record is required and how to create one.
2. **Given** a contributor is unsure whether their change counts as patch,
   minor, or major impact, **When** they consult the documentation, **Then**
   they find clear guidance (with examples) for choosing the correct impact
   level.

### Edge Cases

- What happens when a contributor records a change but forgets to specify which
  package(s) it applies to, or misattributes it to the wrong package?
- How does the workflow handle a change that affects a package which is
  explicitly excluded from independent versioning (e.g., a package the project
  has designated as never published or never version-tracked)?
- How does the system handle two pending change records for the same package
  with conflicting impact levels (e.g., one says patch, another says major)?
- What happens if a maintainer applies pending changes while unrelated,
  unrecorded changes also exist in the working tree?
- How does the workflow behave for a brand-new package added to the workspace
  that has no prior version history?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The workspace MUST let a contributor record a pending,
  package-scoped change with an explicit impact level (patch, minor, or major)
  for one or more affected packages, without immediately altering any package's
  version number.
- **FR-002**: Each workspace package (app or shared package) MUST be versioned
  independently — recording or applying a change for one package MUST NOT alter
  the version number of an unrelated package.
- **FR-003**: The workspace MUST provide a maintainer-facing action that
  consumes all pending change records and, for each affected package, updates
  that package's version number according to the highest recorded impact level
  and appends a human-readable changelog entry describing the change.
- **FR-004**: When a package that other in-workspace packages depend on receives
  a version change, the workspace MUST update the internal version references of
  dependent packages consistently, according to a documented dependency-update
  policy, without requiring manual editing of each dependent's manifest.
- **FR-005**: The workspace MUST prevent packages that are not intended for
  external publication from being published as a side effect of the versioning
  workflow.
- **FR-006**: The project MUST provide contributor-facing documentation that
  explains when a change record is required, how to create one, and how to
  choose the correct impact level, with examples.
- **FR-007**: The versioning workflow MUST leave packages with no pending change
  records untouched when pending changes are applied.
- **FR-008**: The workspace MUST establish a starting version baseline for every
  existing package that does not yet have one, so independent versioning can
  begin from a known state.
- **FR-009**: The change-recording workflow MUST be usable by any contributor
  without requiring elevated or maintainer-only permissions; applying pending
  changes MAY be restricted to maintainers per the project's existing
  contribution policy.

### Key Entities

- **Package**: A single app or shared library within the workspace that has its
  own name, independent version number, and changelog. Attributes:
  identity/name, current version, publication eligibility (publishable vs.
  never-published).
- **Change Record**: A pending, contributor-authored declaration that one or
  more packages changed in a way that should affect their version. Attributes:
  affected package(s), impact level (patch/minor/major), human-readable summary
  of the change. Exists only until it is consumed by the version-application
  step.
- **Changelog Entry**: A human-readable record, scoped to a single package,
  describing what changed in a given version. Produced from one or more Change
  Records when versions are applied.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A contributor can correctly record a version-worthy change for a
  single package in under 2 minutes without consulting a teammate.
- **SC-002**: 100% of package version bumps after adoption are traceable to at
  least one change record and an associated changelog entry.
- **SC-003**: Applying pending changes updates every affected package's version
  and changelog in a single maintainer action, with zero manual edits to version
  numbers required.
- **SC-004**: Two packages with unrelated changes always end up with different,
  independently-derived version numbers after changes are applied — never forced
  into lockstep.
- **SC-005**: New contributors can determine, from documentation alone, whether
  their change requires a version record with at least 90% accuracy (validated
  by spot-checking pull requests over the first month of adoption).

## Assumptions

- The workspace already has a defined set of independently-versionable packages
  (apps and shared libraries), each with its own manifest and name. This spec
  does not introduce new packages.
- All workspace packages are private/internal; none are currently published to a
  public package registry, and this feature does not change that — version
  tracking and changelogs are for internal traceability, not public releases.
- "Impact level" follows the widely-used patch/minor/major (semantic versioning)
  model already familiar to the target contributors.
- Internal (in-workspace) dependencies between packages are expected to be kept
  reasonably in sync when a depended-upon package changes, using a conservative
  default (smallest necessary bump) unless the project documents a different
  policy.
- A starting baseline version (e.g., an initial development version) is applied
  uniformly to all existing packages that don't yet have one, rather than
  backfilling historical version numbers.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Workspace Package**: `apps/*` and `packages/*` pnpm workspace members
  (`@windwise/consumer-application`, `@windwise/manager-dashboard`,
  `@windwise/query`, `@windwise/ui`, `@windwise/vite-config`, plus the
  `windwise` root) — already existed as `package.json` manifests before this
  work; they lacked a `"version"` field prior to this feature.
- **`vp` task runner**: The project's existing convention for invoking all
  workspace commands (`vp run <script>`) rather than calling package-manager
  scripts directly. New scripts (`changeset`, `changeset:version`) were added as
  root `package.json` scripts to slot into this existing convention rather than
  introducing a parallel invocation style.
- **pnpm `catalog:`**: The existing mechanism (`pnpm-workspace.yaml`) for
  pinning a single version of a shared dependency across the monorepo.
  `@changesets/cli` was added here rather than pinned per-package, consistent
  with how `vite`/`vite-plus`/etc. are already managed.
- **`workspace:*` internal dependencies**: Apps already depend on shared
  packages via pnpm's `workspace:*` protocol (e.g., `apps/consumer-application`
  → `@windwise/ui`, `@windwise/query`, `@windwise/vite-config`). This existing
  relationship is exactly what Changesets' `updateInternalDependencies` policy
  governs.
- **`AGENTS.md` / `README.md`**: Existing contributor-facing documentation files
  that already had sections for command references and git conventions (branch
  prefixes, work-item IDs); this feature added a versioning section to each
  rather than creating new doc surfaces.

#### New Concepts Required

- **Change Record** (`.changeset/*.md`): A new artifact type — a Markdown file
  with YAML frontmatter naming affected package(s) and impact level, plus a
  free-text summary. New to this codebase; introduced by `@changesets/cli` and
  populated per-PR by contributors.
- **`.changeset/config.json`**: New configuration file governing publish access
  (`restricted`), commit behavior (`false`), and the internal dependency-update
  policy (`patch`) — did not exist before this feature.
- **Per-Package `CHANGELOG.md`**: New artifact, generated/updated only when
  pending Change Records are applied; did not exist for any package prior to
  this feature.
- **Version Baseline (`0.1.0`)**: A new, uniformly-applied starting point —
  every package's `package.json` gained a `"version": "0.1.0"` field where none
  existed (root moved from `0.0.0` to `0.1.0` for consistency).

#### Key Business Rules

- **Independence** (governs Package): No two packages' version numbers are
  coupled unless one depends on the other internally — enforced by Changesets'
  per-package versioning model, not a "fixed"/"linked" group
  (`.changeset/config.json` has `"fixed": []`, `"linked": []`).
- **No external publication** (governs Package): Every package is
  `"private": true`; `.changeset/config.json` sets `"access": "restricted"` as a
  second layer of protection against accidental `npm publish`.
- **Conservative dependency propagation** (governs Package, Change Record): When
  a package a dependent relies on changes, the dependent's internal
  `workspace:*` reference bumps by at least `patch` — not automatically forced
  to `minor`/`major` — per `updateInternalDependencies: "patch"`.
- **Traceability** (governs Change Record, Changelog Entry): Every version bump
  must originate from an explicit, committed `.changeset/*.md` file — there is
  no path to bump a version without a corresponding record.

## Strategic Approach

#### Solution Direction

Adopt `@changesets/cli` as the versioning engine, wired into the existing `vp`
task-runner convention via two root-level scripts: `vp run changeset` (record —
any contributor, any time) and `vp run changeset:version` (apply —
maintainer/release step). Data flow: contributor edits code → contributor runs
`vp run changeset` → a `.changeset/*.md` file is committed alongside the code
change in the same PR → (later, at release-prep time) a maintainer runs
`vp run changeset:version` → affected `package.json` versions and `CHANGELOG.md`
files are updated in a single commit, and the consumed `.changeset/*.md` files
are deleted.

#### Key Design Decisions

- **Tool choice — Changesets vs. Lerna vs.
  Conventional-Commits/semantic-release**: Changesets' per-PR Markdown record
  model is the most contributor-friendly and keeps "what changed" explicit and
  reviewable, rather than inferring version impact from commit-message
  conventions (which this repo already uses for a different purpose — git
  history, not release intent) → **recommended: Changesets**.
- **Registry access — `restricted` vs. `public`**: All packages are private and
  never intended for public npm distribution → **recommended: `restricted`**,
  paired with `"private": true` on every manifest as a belt-and-suspenders guard
  (FR-005).
- **Internal dependency policy — `patch` vs. leaving unmanaged vs. forcing
  `minor`/`major`**: A dependent that didn't itself change shouldn't take an
  inflated bump, but it does need _some_ signal that its dependency moved →
  **recommended: `patch`** (smallest necessary bump), avoiding both silent drift
  and over-aggressive version inflation.
- **Version baseline — `0.1.0` vs. `1.0.0` vs. backfilling history**: Packages
  are still in initial development and there's no reliable way to reconstruct
  pre-Changesets version history → **recommended: uniform `0.1.0`** starting
  point, explicitly not attempting retroactive versioning.
- **Commit behavior — `false` vs. `true`**: Auto-committing on behalf of the
  contributor/maintainer would hide side effects from normal review flow →
  **recommended: `commit: false`**, changes stay visible in the contributor's or
  maintainer's own commit.

#### Alternatives Considered

- **Lerna (independent mode)**: rejected — heavier tooling, largely superseded
  for this exact use case, less contributor-friendly UX for per-PR change
  recording than Changesets' Markdown-file model.
- **Manual version bumps during PR review**: rejected — does not scale, easy to
  forget, produces no changelog, breaks SC-002's traceability requirement.
- **Conventional Commits → semantic-release**: rejected — conflates two
  identities this repo already keeps separate (git branch/commit conventions vs.
  package release intent, per `AGENTS.md`'s existing "Work item / Git branch /
  Package version" distinction); inferring version impact from commit messages
  is less explicit than an intentional per-PR record.
- **CI bot auto-applying changesets on merge to `main`**: deferred, not
  implemented — adds infrastructure not required by any FR/SC in this spec; the
  maintainer-run `vp run changeset:version` step is sufficient for current
  scope.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Conflicting impact levels for the same package** (Edge Case): The spec
  doesn't define resolution order beyond "highest wins" (FR-003 says "highest
  recorded impact level"); this is actually resolved by Changesets' built-in
  behavior (major > minor > patch), so no gap remains, but it isn't spelled out
  anywhere the codebase's own docs (`AGENTS.md`, `.changeset/README.md`).
- **Excluded/never-versioned packages** (Edge Case): No package in the current
  workspace is marked `ignore` in `.changeset/config.json` (the `"ignore": []`
  array is empty) — the workflow doesn't yet need to handle this case, but if a
  future package should be excluded, the mechanism (`ignore` array) exists but
  is undocumented in `AGENTS.md`.

#### Edge Cases

- **Misattributed change records**: If a contributor names the wrong package in
  a `.changeset/*.md` file, nothing in the tooling catches this — it relies on
  PR review, same as any other code change. Not a gap in this feature, but worth
  noting as a review responsibility.
- **New package with no version history**: FR-008's baseline (`0.1.0`) only
  covers _existing_ packages as of this feature; a workspace member added later
  will need its own `"version"` field set manually at creation time (not
  automated by Changesets) — this should be captured as a convention in
  `AGENTS.md` (currently not explicit).
- **Unrelated uncommitted changes present during `changeset:version`**: Not a
  Changesets concern — it only touches files it manages (`package.json`
  `version` fields, `CHANGELOG.md`, `.changeset/*.md`); any other dirty
  working-tree state is orthogonal and unaffected.

#### Technical Risks

- **No CI enforcement**: Nothing currently requires a `.changeset/*.md` file to
  be present on PRs that touch package code — SC-002's "100% traceable" outcome
  depends entirely on contributor discipline plus code review, not a tooling
  gate. Mitigation direction: consider `changeset status` in CI as a future
  (out-of-scope) enhancement.
- **Verified but not yet exercised in a real release**: A live dry run
  (`pnpm exec changeset status`) confirmed correct propagation (recording a
  `patch` change to `@windwise/ui` correctly queued `patch` bumps for its
  `workspace:*` dependents, `consumer-application` and `manager-dashboard`), but
  the actual apply step (`vp run changeset:version`) has not yet been run
  against a real change in this workspace — low risk, since it's standard,
  well-tested third-party tooling, but worth a first real run before treating
  the release flow as fully proven end-to-end.

#### Acceptance Criteria Coverage

| AC#   | Description                                                                                  | Addressable?                                         | Gaps/Notes                                                                                                                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1.1 | Recording a change captures a pending, package-scoped record without altering `package.json` | Yes                                                  | Confirmed by design (`.changeset/*.md` files are separate from manifests) and by dry-run (`changeset status` shows pending bump without mutating files)                                                       |
| US1.2 | Contributor can determine no record is needed for docs/formatting/tooling changes            | Yes                                                  | `.changeset/README.md` and `AGENTS.md` explicitly state "Skip changesets for docs, specs, formatting, and agent workflow files"                                                                               |
| US1.3 | Multiple pending records are clearly attributed per package/impact                           | Yes                                                  | Native `.changeset/*.md` frontmatter format; `changeset status` output groups by impact level and lists affected packages                                                                                     |
| US2.1 | Applying changes bumps version by highest recorded impact + adds changelog entry             | Yes (verified via dry-run; not yet via a real apply) | `changeset version` behavior is standard library behavior — confirmed queued correctly, not yet executed for a real bump in this repo                                                                         |
| US2.2 | Internal `workspace:*` references updated per dependency-update policy                       | Yes — **live-verified**                              | Dry run showed `@windwise/consumer-application` and `@windwise/manager-dashboard` correctly queued for `patch` bump when only `@windwise/ui` had a recorded change                                            |
| US2.3 | No pending records → no changes, maintainer informed                                         | Yes                                                  | Standard Changesets behavior (`changeset status`/`changeset version` report "no changesets present" when `.changeset/` has no non-empty record); not separately re-verified beyond tool defaults              |
| US2.4 | Applied versions are independent per package, not synchronized                               | Yes                                                  | `"fixed": []` and `"linked": []` in `.changeset/config.json` confirm no version-group coupling exists                                                                                                         |
| US3.1 | Contributor can determine from docs whether a record is required                             | Yes                                                  | `AGENTS.md` "Package versions (Changesets)" section + `.changeset/README.md` both cover this                                                                                                                  |
| US3.2 | Contributor can determine correct impact level from docs with examples                       | Partial                                              | Docs state the workflow and commands but don't give patch/minor/major _examples_ specific to this workspace — relies on contributor's general semver familiarity (an assumption explicitly stated in spec.md) |

**Coverage summary**: 8 of 9 acceptance scenarios fully addressed by the current
implementation and verified either by direct file inspection or a live dry run;
1 (US3.2) is partially addressed — documentation explains _that_ impact levels
exist but doesn't give workspace-specific patch/minor/major examples, relying
instead on general semver familiarity.
