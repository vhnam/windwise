---
work_item: 002-oxc-format-config
sequence: 002
slug: oxc-format-config
---

# SPDD Analysis: OXC Format & Import-Sort Configuration

## Original Business Requirement

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

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Root `vite.config.ts` `lint`/`fmt` blocks**: the workspace already has a
  single shared Oxlint/Oxfmt configuration point —
  `lint: { jsPlugins: [...], rules: {...}, options: { typeAware: true, typeCheck: true } }`
  and `fmt: {}` (currently empty, meaning Oxfmt defaults). This is already the
  "Shared Formatting Baseline" entity from the spec, not something to build from
  scratch.
- **`staged` pre-commit hook**: `staged: { "*": "vp check --fix" }` in the same
  root `vite.config.ts`, wired to a real git hook (`core.hooksPath` →
  `.vite-hooks/_`, installed by the root `prepare: "vp config"` script). Any new
  formatting/import-sort rule automatically gets this auto-fix-on-commit
  behavior for free — no new hook needs to be built.
- **`vp run ready` / `vp check`**: the single top-level validation command
  established by `001-project-codebase-bootstrap`. This is the existing
  "Workspace Validation Run" entity the spec's User Story 3 requires the new
  rules to fold into.
- **Two apps with currently-identical, informal import ordering**: reading
  representative files in both apps (`router.tsx`, `env.ts` / `auth.ts`), both
  `consumer-application` and `manager-dashboard` already follow the same
  unenforced convention — external/workspace-scoped imports first, relative
  imports last. There is **no existing observed divergence** between the two
  apps' import habits today. This matters: the spec's "per-app import-sort rule"
  is a forward-looking policy decision, not a codification of an
  already-existing difference.
- **`vp lint`'s `import` plugin**: Oxlint ships an opt-in `import` plugin
  (`--import-plugin` CLI flag / `plugins: ['import']` in config) that provides
  import-related rules (e.g., `import/default`, `import/namespace` confirmed
  present via `--print-config`). This plugin is **not currently enabled** in the
  root config. Whether it also provides an "order" rule (the
  ESLint-ecosystem-standard `import/order`) was not confirmed by direct
  inspection — flagged as a technical risk below, not assumed.
- **Vite+'s documented monorepo config pattern**: `lint.overrides` /
  `fmt.overrides` arrays in the single root `vite.config.ts`, matched by
  workspace-relative globs (e.g., `apps/web/**`). This is the tool's own
  prescribed mechanism for "shared baseline + package-specific rules" — directly
  relevant to FR-002/FR-003's "per-app" requirement.

#### New Concepts Required

- **Two app-specific import-sort override entries**: one glob-matched override
  for `apps/consumer-application/**` and one for `apps/manager-dashboard/**`,
  each carrying whatever the chosen import-order rule/options are for that app.
  New configuration, not new code.
- **A defined import-order policy per app**: since no existing divergence was
  found in the codebase, someone (developer input, or a reasonable default
  proposed during planning) needs to decide what each app's rule actually
  specifies — e.g., built-ins vs. external vs. internal vs. relative grouping,
  alphabetization within groups, blank-line separation. This is a genuinely new
  decision, not an extraction from existing code.

#### Key Business Rules

- **Baseline-first, override-second** (governs Shared Formatting Baseline vs.
  App-Specific Import-Sort Rule): every file is judged by the shared baseline
  unless a more specific, explicitly-scoped rule matches it — matches the tool's
  own override-resolution model (base config + `overrides` array matched by
  glob), so this rule requires no new enforcement mechanism, only correct glob
  authoring.
- **No cross-contamination between apps** (FR-002, FR-003, SC-003): an override
  scoped to one app's glob must not affect the other app's glob or any file
  outside both globs. This is a testable property of the glob patterns chosen,
  not a runtime behavior to build.
- **One validation surface, not two** (User Story 3, FR-005): the new rules must
  be additive to `vp run ready`/`vp check`'s existing behavior — no parallel
  "run this other command too" workflow is acceptable.

## Strategic Approach

#### Solution Direction

This is a **configuration-only feature** — no application code changes, no new
dependencies (Oxlint's `import` plugin, if it's the right tool, ships with the
already-installed `oxlint` package). The direction: (1) confirm whether Oxlint's
`import` plugin actually provides an import-ordering rule (not just
import-correctness rules like `import/default`/`import/namespace`) — this is the
single technical fact the whole approach hinges on; (2) express the shared
baseline as the existing root `lint`/`fmt` blocks (already there, possibly needs
the import rule turned on at the baseline level with a default order); (3)
express each app's override as a `lint.overrides` entry scoped by glob
(`apps/consumer-application/**`, `apps/manager-dashboard/**`), per Vite+'s
documented monorepo pattern — not as separate physical config files, correcting
the mechanism implied by the original request's phrasing ("each app will have
their specific files").

#### Key Design Decisions

- **Use `lint.overrides` in the single root `vite.config.ts`, not separate
  physical files per app**: Trade-off — matches the tool's documented, supported
  pattern (single source of truth, `vp check`'s type-aware/staged-hook
  integration works automatically) vs. the user's literal phrasing of "each app
  will have their specific files" (which Vite+'s own docs explicitly discourage:
  "We do not recommend using `oxlint.config.ts` or `.oxlintrc.json` with
  Vite+"). Recommendation: overrides in the root file — deviating from the
  tool's documented convention would mean losing staged-hook/`vp check`
  integration for no compensating benefit, and SC-002 ("one location to
  inspect") is actually better served by overrides in one file than by scattered
  per-app files.
- **Confirm `import/order` (or equivalent) exists before committing to per-app
  ordering as the mechanism**: Trade-off — if Oxlint's `import` plugin doesn't
  expose an order-configurable rule, "per-app import-sort" may need a different
  mechanism (e.g., a JS plugin, or Oxfmt's own import-handling if any, or
  accepting only on/off toggling rather than custom ordering per app).
  Recommendation: this must be verified with the actual installed Oxlint
  version's rule schema during `/speckit-plan`'s research phase — do not assume
  the rule exists and design around it before confirming, since the earlier CLI
  exploration in this session was inconclusive (the plugin loads and contributes
  `import/default`/`import/namespace`, but an order-specific rule was not
  directly confirmed present or absent).
- **Treat "each app's desired order" as an open input, propose a sensible
  default, don't block on it**: Trade-off — waiting for explicit
  developer-specified ordering preferences per app vs. proposing a reasonable
  default (e.g., one app groups by external/internal/relative, the other also
  does but with a different tiebreak) and letting the developer adjust.
  Recommendation: propose a default during planning (e.g., mirror common
  conventions: builtin → external → internal-alias (`@windwise/*`, `#/*`) →
  relative) applied identically in shape but declared as two separate override
  blocks, so the _mechanism_ for divergence exists and is demonstrably per-app
  even if the _initial_ values are similar — real divergence can be tuned later
  without re-architecting.

#### Alternatives Considered

- **Separate physical `.oxlintrc.json`/`oxlint.config.ts` files per app**:
  rejected — explicitly discouraged by Vite+'s own documentation, would bypass
  `vp check`'s integrated staged-hook/type-aware pipeline, and increases the
  number of files a developer must check to answer "what rule applies here"
  (working against SC-002).
- **A single global import-sort rule with no per-app variation**: rejected —
  directly contradicts FR-002/FR-003, which are explicit, prioritized (P1)
  requirements from the spec, not optional nice-to-haves.
- **Introducing a separate/different linting tool (e.g., ESLint +
  eslint-plugin-import) alongside Oxlint for import ordering only**: rejected —
  the request explicitly asks to configure OXC/Oxlint, the constitution's
  tech-stack constraints favor the existing Vite+ toolchain, and running two
  lint tools in parallel would reintroduce exactly the kind of
  validation-surface fragmentation User Story 3 exists to prevent.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **The spec's implied mechanism ("each app will have their specific files")
  conflicts with the tool's documented convention**: not a flaw in the spec —
  it's flagged there already as an Assumption deferred to planning — but it's
  the single biggest ambiguity to resolve first, since it changes where config
  physically lives.
- **"Import-sort" scope is unspecified beyond ordering**: the spec's Assumptions
  section clarifies it means ordering, not restructuring — but doesn't say
  whether it includes de-duplication, blank-line normalization between groups,
  or only the sequence of statements. Left for planning to define concretely.

#### Edge Cases

- **New risk, not in original spec's edge cases — the `import` plugin's actual
  rule set is unconfirmed**: direct CLI exploration
  (`vp lint --import-plugin --print-config`) showed only `import/default` and
  `import/namespace` as active by default; whether an order-configurable rule
  exists at all in this Oxlint version was not established. If it doesn't exist,
  FR-002/FR-003 as literally worded (app-specific _order_, not just on/off
  linting) may not be achievable through Oxlint alone, and the spec's Assumption
  that "the concrete mechanism is a technical decision for planning" would need
  to expand to "the concrete _feasibility_ is also a planning-phase question,"
  not just the file layout.
- **`fmt: {}` is currently empty (all Oxfmt defaults)**: introducing a shared
  baseline that's more prescriptive than "defaults" is itself a new decision,
  separate from the import-order question — worth confirming during planning
  whether "shared baseline" means "keep current implicit defaults, formalize
  them," or "introduce new explicit choices."

#### Technical Risks

- **Feasibility risk: Oxlint's import-order support is unconfirmed, not just its
  configuration shape**: this is the highest-impact open risk. Everything else
  in this analysis (glob-based overrides, one-file-per-baseline decision) is
  sound _if_ the underlying rule exists; if it doesn't, the whole Strategic
  Approach's mechanism needs to change. This must be the first thing resolved in
  `/speckit-plan`'s Phase 0 research, before any Operations are written.
- **No existing app-level divergence to anchor a default on**: because both apps
  currently follow identical informal import habits, any "per-app" default
  proposed during planning is a genuinely new stylistic choice rather than a
  codification of existing code — meaning the initial implementation may require
  a broader one-time reformatting pass across both apps' `src/` trees to bring
  existing files into compliance, not just a config change with zero-diff on
  existing code (contrast with `001-project-codebase-bootstrap`, where most gaps
  were additive).
- **Interaction with the existing `staged` pre-commit hook**: any new/changed
  formatting rule that's stricter than what's currently committed will cause the
  next commit touching an existing file to auto-reformat unrelated lines in that
  file (since `vp check --fix` runs on staged files). This is expected tool
  behavior, not a bug, but worth calling out so a broad rule change doesn't
  produce a surprisingly large diff on someone's next unrelated commit.

#### Acceptance Criteria Coverage

| AC#   | Description                                                                      | Addressable? | Gaps/Notes                                                                                                                                |
| ----- | -------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| US1-1 | Both apps' identical formatting issues flagged identically                       | Yes          | Already true today via the shared root `lint`/`fmt` blocks; this AC mainly needs to remain true after the change, not be newly built      |
| US1-2 | New shared package covered by baseline with no new config                        | Yes          | Already true — no per-package config exists or is needed today; overrides are additive, not required                                      |
| US2-1 | `consumer-application` imports reordered per its own rule                        | Partial      | Addressable **only if** an Oxlint import-order rule exists (see Technical Risks); mechanism (override glob) is sound regardless           |
| US2-2 | `manager-dashboard` imports reordered per its own rule, independent of the other | Partial      | Same feasibility caveat as US2-1; independence itself (via distinct globs) is straightforward once the underlying rule is confirmed       |
| US2-3 | Shared package imports follow baseline only, not either app's rule               | Yes          | Directly follows from glob scoping — packages/\*\* never matches either app's override glob                                               |
| US3-1 | Existing `vp run ready`/`vp check` reports new rules without a new command       | Yes          | Directly true by construction — new rules live inside the same `lint`/`fmt` config blocks `vp check` already reads; no new command needed |
