<!--
Sync Impact Report
Version change: (none) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles: I. Code Quality, II. Testing Standards, III. User Experience Consistency, IV. Performance Requirements
  - Additional Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: none
Deferred items:
  - TODO(RATIFICATION_DATE): original adoption date unknown; set to today's date pending confirmation from project owner.
-->

# Windwise Constitution

## Core Principles

### I. Code Quality

Code MUST be reviewed before merge; no direct pushes to `main` for non-trivial
changes. Every package/app in this monorepo MUST pass linting and type-checking
(`vp run -r build` and the workspace's configured linters) with zero errors
before merge. Functions and modules MUST have a single, clear responsibility;
duplication MUST be factored into shared packages rather than copy-pasted across
apps. Dead code, commented-out blocks, and unused exports MUST be removed rather
than left "for later." Public APIs (exported functions, types, and package entry
points) MUST be documented with intent where the name and types do not already
make usage obvious. Rationale: This is a monorepo with shared packages consumed
by multiple apps; unreviewed or inconsistent code compounds quickly across
consumers, so quality gates are enforced at the shared-package boundary as well
as within each app.

### II. Testing Standards

New behavior MUST ship with automated tests covering the golden path and
meaningful edge cases; bug fixes MUST include a regression test that fails
before the fix and passes after. `vp run -r test` MUST pass across the monorepo
before any merge. Tests MUST NOT depend on hidden shared state or execution
order. Integration tests are REQUIRED for any change that crosses a package
boundary (e.g., app ↔ shared package, sync/PowerSync data flows) since unit
tests alone cannot catch contract drift between packages. Rationale: Shared
packages have multiple consumers; a change that looks safe in isolation can
silently break another app, so cross-boundary behavior must be verified by
tests, not assumed.

### III. User Experience Consistency

User-facing components MUST reuse the shared design system / shared UI packages
rather than reimplementing equivalent components per app. Interaction patterns
(navigation, error states, loading states, empty states, form validation
messaging) MUST be consistent across apps in the monorepo. Any deviation from an
established pattern MUST be justified in the PR description and, if it
represents a new reusable pattern, MUST be promoted into the shared package
rather than left as a one-off. Accessibility basics (keyboard navigation,
semantic HTML, sufficient color contrast) are NON-NEGOTIABLE for any new or
modified UI. Rationale: Multiple apps sharing this monorepo should feel like one
coherent product family; inconsistent UX erodes user trust and multiplies
design/maintenance cost.

### IV. Performance Requirements

Changes MUST NOT introduce regressions to build time, bundle size, or runtime
responsiveness without explicit justification in the PR description. Data-sync
and offline-first flows (PowerSync) MUST be validated to avoid blocking the UI
thread or causing noticeable input lag. New dependencies MUST be justified
against their bundle size and maintenance cost before being added to a shared
package. Performance-sensitive changes (data fetching, list rendering, sync
operations) SHOULD include a brief before/after measurement (bundle size, load
time, or profiling note) in the PR when the change is non-trivial. Rationale:
This starter is optimized for a fast Vite-based developer and end-user
experience; unmonitored regressions in build or runtime performance defeat that
purpose and are costly to unwind later.

## Additional Constraints

- Technology stack: pnpm workspaces, Vite, TypeScript, PowerSync — changes MUST
  remain compatible with this stack unless the constitution is amended.
- Shared packages under `packages/` are the source of truth for cross-app logic
  and UI; apps under `apps/` MUST NOT duplicate logic available in `packages/`.
- All commands used for verification (build, test, lint) MUST be run through the
  `vp` workspace runner so behavior stays consistent across apps.

## Development Workflow & Quality Gates

- Before opening a PR, contributors MUST run `vp run ready` locally.
- PRs MUST pass `vp run -r build` and `vp run -r test` in CI before merge.
- Code review MUST explicitly check compliance with Code Quality, Testing
  Standards, User Experience Consistency, and Performance Requirements
  principles above.
- Any exception to a principle MUST be documented inline in the PR description
  with a rationale; silent exceptions are not permitted.

## Governance

This constitution supersedes other informal practices for this repository.
Amendments require: (1) a documented rationale for the change, (2) an explicit
version bump per the semantic versioning policy below, and (3) review/approval
before merge into `main`.

Versioning policy:

- MAJOR: Backward-incompatible removal or redefinition of a principle.
- MINOR: New principle or materially expanded guidance added.
- PATCH: Clarifications, wording, or non-semantic refinements.

All PRs and code reviews MUST verify compliance with this constitution.
Complexity or deviation from a stated principle MUST be justified in the PR
description. Runtime development guidance for day-to-day conventions lives in
`AGENTS.md`.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm original
adoption date | **Last Amended**: 2026-08-15
