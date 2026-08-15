# Feature Specification: OXC Format & Import-Sort Configuration

**Feature Branch**: `002-oxc-format-config`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Configure OXC (Oxlint/Oxfmt via Vite+) formatting
and import-sort rules for the Windwise monorepo: a shared baseline at the
workspace root, with per-app import-sort behavior for apps/consumer-application
and apps/manager-dashboard."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - One shared formatting baseline for the whole workspace (Priority: P1)

A developer runs the workspace's format/check command anywhere in the repo and
gets the same base formatting rules applied, regardless of which app or package
the file lives in — no app silently uses different quote style, indentation, or
line width than another unless that difference was deliberately configured.

**Why this priority**: A shared baseline is the foundation everything else
builds on. Without it, "per-app behavior" has nothing to diverge from, and
formatting becomes inconsistent by accident rather than by choice.

**Independent Test**: Run the workspace's format-check command against files in
both apps and all shared packages; every file not covered by an app-specific
rule must be judged against the same baseline rules.

**Acceptance Scenarios**:

1. **Given** a file in `apps/consumer-application` and a file in
   `apps/manager-dashboard` with identical formatting issues, **When** the
   format-check command runs, **Then** both are flagged identically (same rule,
   same message shape).
2. **Given** a new shared package is added under `packages/`, **When** the
   format-check command runs against it, **Then** it is judged against the
   shared baseline without requiring new configuration.

---

### User Story 2 - Each app can sort its own imports differently (Priority: P1)

A developer working in `apps/consumer-application` sees imports auto-sorted
according to that app's own import-order rules, and a developer working in
`apps/manager-dashboard` sees a possibly different import-order rule applied to
that app — without either app's rule leaking into the other or into shared
packages.

**Why this priority**: This is the specific customization requested — it's the
reason a single global rule isn't sufficient, and it's what makes "per-app"
meaningfully different from "shared baseline."

**Independent Test**: Introduce an out-of-order import in a file in each app and
in a shared package; run the format/lint-fix command; confirm each app's file is
reordered according to that app's own rule, and the shared package's file is
reordered according to the shared baseline (not either app's rule).

**Acceptance Scenarios**:

1. **Given** `apps/consumer-application` has its own import-sort rule
   configured, **When** a file in that app has out-of-order imports and the fix
   command runs, **Then** imports are reordered to match that app's rule.
2. **Given** `apps/manager-dashboard` has its own import-sort rule configured,
   **When** a file in that app has out-of-order imports and the fix command
   runs, **Then** imports are reordered to match that app's rule, independently
   of `consumer-application`'s rule.
3. **Given** a shared package under `packages/` has no app-specific import-sort
   rule, **When** a file in it has out-of-order imports and the fix command
   runs, **Then** imports are reordered according to the shared baseline only.

---

### User Story 3 - Existing workspace-wide checks keep working (Priority: P2)

A developer or CI running the existing `vp run ready` / `vp check` workflow
continues to get a single pass/fail result across the whole workspace, with the
new format and import-sort rules folded into that existing gate rather than
requiring a new, separate command to run.

**Why this priority**: This feature must not fragment the validation story the
codebase-bootstrap feature just consolidated (one command, all members). It's P2
because it depends on User Stories 1 and 2 existing first, but it's what keeps
this feature from becoming its own maintenance burden.

**Independent Test**: Run the existing top-level validation command after this
feature is implemented; confirm it still produces one pass/fail result covering
formatting and import order for every workspace member, with no additional
command needed.

**Acceptance Scenarios**:

1. **Given** the new formatting/import-sort configuration is in place, **When**
   the existing top-level validation command runs, **Then** it reports
   formatting and import-order violations the same way it already reports other
   lint/format violations — no separate invocation required.

### Edge Cases

- What happens when a file doesn't belong to either app or a shared package
  (e.g., a root-level config file)? It MUST still be judged against the shared
  baseline — the absence of an app-specific rule is not an absence of any rule.
- What happens when a new app is added to the workspace without an app-specific
  import-sort rule? It MUST fall back to the shared baseline's import-sort
  behavior, not be left unformatted or excluded from checks.
- What happens when the shared baseline and an app-specific rule conflict on a
  setting other than import order (e.g., quote style)? The app-specific
  configuration MUST NOT silently override baseline settings it wasn't intended
  to touch — only import-sort behavior is expected to differ per app unless a
  future need is identified.
- What happens when a file matches more than one app's glob pattern (e.g., a
  file shared/symlinked between apps)? This MUST NOT happen in the current repo
  layout (apps don't share source files), but if it did, the behavior must be
  deterministic and documented, not silently inconsistent.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The workspace MUST define one shared formatting configuration that
  applies to every file in every app and package by default.
- **FR-002**: `apps/consumer-application` MUST be able to have its own
  import-sort rule that differs from the shared baseline and from
  `apps/manager-dashboard`'s rule.
- **FR-003**: `apps/manager-dashboard` MUST be able to have its own import-sort
  rule that differs from the shared baseline and from
  `apps/consumer-application`'s rule.
- **FR-004**: Files outside both apps (shared packages, root-level config) MUST
  be governed by the shared baseline only, with no app-specific import-sort rule
  applied.
- **FR-005**: The existing single top-level validation command MUST report
  formatting and import-sort violations without requiring a new or separate
  command.
- **FR-006**: The auto-fix path of the existing format/check tooling MUST be
  able to correct import order according to the applicable rule (shared or
  app-specific) for a given file, not just flag it.
- **FR-007**: Adding a new app or package to the workspace MUST NOT require
  reconfiguring existing apps' rules — the new member falls back to the shared
  baseline unless a new app-specific rule is explicitly added for it.

### Key Entities

- **Shared Formatting Baseline**: The default formatting and import-sort
  behavior applied to any file not covered by a more specific rule.
- **App-Specific Import-Sort Rule**: A per-app override of import ordering,
  scoped to `apps/consumer-application` or `apps/manager-dashboard`, that does
  not affect the shared baseline or the other app.
- **Workspace Validation Run**: The existing single top-level check (established
  by the `001-project-codebase-bootstrap` feature) that this feature's rules
  must integrate into rather than duplicate.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Running the workspace's existing top-level validation command
  surfaces 100% of formatting and import-order violations across all apps and
  packages in a single run — no file is silently excluded.
- **SC-002**: A developer can determine which import-sort rule applies to any
  given file (shared baseline vs. one of the two app-specific rules) by
  inspecting configuration in one location, without cross-referencing multiple
  scattered files.
- **SC-003**: Changing `apps/consumer-application`'s import-sort rule produces
  zero changes to `apps/manager-dashboard` or any shared package's formatting
  output, verified by running the fix command and diffing affected files.
- **SC-004**: A new app or package added to the workspace is covered by
  formatting/import-sort checks immediately, with zero additional configuration
  required to be included (only required if a _different_ rule than the baseline
  is wanted).

## Assumptions

- "Configuration in one location" (SC-002) refers to however many files the
  chosen tooling requires to express "one shared baseline + two app-specific
  overrides" as a coherent, discoverable set — not necessarily a single physical
  file. The concrete mechanism (one root config with per-app override blocks vs.
  multiple physical config files) is a technical decision for the planning
  phase, not fixed by this spec.
- Only `apps/consumer-application` and `apps/manager-dashboard` need
  app-specific import-sort rules at this time; `packages/*` (`ui`, `query`,
  `vite-config`) use the shared baseline only, since they were not called out as
  needing app-specific behavior.
- "Import-sort" refers to the ordering of `import` statements within a file
  (e.g., grouping external vs. internal vs. relative imports), not a broader
  restructuring of module boundaries.
- This feature builds on the validation pipeline established by
  `001-project-codebase-bootstrap` (`vp run ready` / `vp check`); it does not
  introduce a new validation entry point.
- The two apps' specific import-sort preferences (what order they each want) are
  not specified in the request and are out of scope to invent here — they will
  need to be defined during planning/implementation, either from existing
  conventions already visible in each app's code or from explicit developer
  input.
