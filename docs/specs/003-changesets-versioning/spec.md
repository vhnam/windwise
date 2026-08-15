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
