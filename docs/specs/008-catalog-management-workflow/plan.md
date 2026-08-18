# Implementation Plan: Catalog Management Workflow

**Branch**: `008-catalog-management-workflow` | **Date**: 2026-08-16 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/008-catalog-management-workflow/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Managers author catalog records (instruments, images, sources) through a Draft →
In Review → Published → Archived lifecycle enforced server-side, so nothing
reaches the consumer surfaces built in
[005](../005-guided-instrument-consultation/plan.md)/[007](../007-instrument-catalog-browsing/plan.md)
without explicit review. Five roles (Owner/Admin/Editor/Reviewer/Viewer) gate
who can move a record between states. A verification queue surfaces stale,
incomplete, or broken-source records. Every change is captured in an audit log
with a before/after diff. This is the first feature to build out
`apps/manager-dashboard` beyond its current auth scaffold, and the first to
require write access to `@windwise/db`'s catalog tables (005/007 only read
them).

## Technical Context

**Language/Version**: TypeScript, Node.js >=22.18.0, React 19 (same as
consumer-side features)

**Primary Dependencies**: TanStack Start (server functions as the primary API
layer — platform §5.2 notes SSR matters less here than for the consumer app),
TanStack Query (the workhorse for this feature: all CRUD, optimistic toggles,
invalidation on publish, per platform §5.2), TanStack Router (typed search
params for the verification queue's list filters/pagination), better-auth
(already scaffolded in `apps/manager-dashboard` with email/password — this
feature adds role/organization data on top of it), Valibot, Drizzle ORM,
`@windwise/ui` (denser dashboard theme, same primitives as consumer), Zustand
(rule/record editor's unsaved-draft state only, per the platform's stated
Zustand/Query boundary — not used for anything with a server counterpart)

**Storage**: PostgreSQL via `@windwise/db` — this feature is the first to
require full CRUD (not just reads) on the tables 007 actually delivered:
`brands`, `instrument_families`, `instrument_models`, `price_points`,
`model_images`, `sources` (`packages/db/src/schema/catalog.ts`; there is no
separate `model_specs` or `model_sources` table — specs are columns on
`instrument_models`, and `sources`/`price_points`/`model_images` already carry
`modelId` directly, not through join tables), plus new
`organization_members`/role and `audit_logs` tables (platform §3.1's `identity`
domain group). **Verified finding**: 007 already defined `model_status` as
`draft | in_review | published | archived` in
`packages/db/src/schema/catalog.ts` — the full lifecycle enum this feature
governs already exists; 008 does not create or alter that enum, only the
transition/audit logic around it. 008 does need new columns 007 didn't add:
`data_completeness`, `verified_by_user_id` on `instrument_models`, a
`version`/`updated_at` column for optimistic concurrency (research.md §5), and a
`source_ok` flag on `sources` (research.md §4) — these are additive migrations
on 007's existing tables, not new tables.

**Testing**: `vp run -r test`; unit tests on the lifecycle state machine (every
legal/illegal transition per role); integration tests on the publish gate
(missing required field blocks publish) and the audit log (every write produces
a corresponding diff entry) — both are cross-package-boundary behaviors (`db`
write path ↔ role check ↔ audit write) the constitution requires tests for, not
assumptions.

**Target Platform**: Web — SSR + browser, `apps/manager-dashboard` deployment
target (already configured, unused beyond its auth scaffold today)

**Project Type**: Web application, same monorepo — extends
`apps/manager-dashboard` and `@windwise/db`; no new shared package unless
role/audit logic proves reusable by the manager app alone in ways that warrant
it (see Project Structure)

**Performance Goals**: No number specified in the platform plan's NFR table for
the dashboard specifically; this plan adopts "CRUD action round-trip
(save/publish/archive) completes and reflects in the UI via TanStack Query
invalidation without a full page reload" as the working target, consistent with
platform §5.2's framing of Query as "the workhorse" here.

**Constraints**: Nothing may reach `status = 'published'` through any path other
than the reviewer-gated transition (spec FR-001); publish MUST be blocked when
required fields are missing (spec FR-009); every
create/edit/status-transition/archive action MUST produce an audit entry with
actor, timestamp, and before/after diff (spec FR-010) — this is non-negotiable
per the platform plan's own framing ("a single field edit changes
consumer-facing advice"); role checks MUST be evaluated against the _current_
assignment at action time, not a cached session role from before a revocation
(spec FR-012)

**Scale/Scope**: Same v1 catalog target as 005/007 (~60-90 models); role scope
is five fixed roles per platform plan BR-M11, not a custom-permission system

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality** — PASS. The lifecycle state machine and role-check
  function live once in `@windwise/db` (or a thin `@windwise/db`-adjacent
  authorization module, see research.md §2) and are imported by every server
  function that mutates a catalog record, rather than each mutation
  re-implementing "can this role do this transition." Duplicating that check per
  endpoint is exactly the kind of drift the constitution warns compounds quickly
  in a monorepo with shared packages.
- **II. Testing Standards** — PASS. State-machine and role-matrix tests cover
  the golden path and the explicit edge cases from the spec (concurrent edits,
  revoked-role save attempt, publish-with-missing-field attempt). The audit-log
  write is tested as an integration concern since it must fire correctly across
  every mutation entry point, not just one.
- **III. UX Consistency** — PASS. Reuses `@windwise/ui`'s "denser dashboard
  theme, same primitives" (platform §5.2) rather than a divergent visual
  language from the consumer app; the review/publish/archive action affordances
  and the verification-queue list view are designed once and reused per entity
  type as the catalog domain grows.
- **IV. Performance Requirements** — PASS. TanStack Query optimistic updates for
  status transitions are called out by the platform plan itself as the intended
  pattern here; no new heavy dependency introduced beyond `better-auth`'s
  existing footprint (already present, not newly added by this feature).
- **Additional Constraints — stack compatibility**: unchanged from prior
  features' analysis; this feature does not touch PowerSync
  (`apps/manager-dashboard` has no PowerSync scaffold at all, unlike
  `apps/consumer-application`), so there is nothing to flag here.

**Post-Phase-1 re-check**: data-model.md and contracts/ confirm the
lifecycle/role/audit logic stays centralized as planned — no server function in
contracts/ implements its own inline status-transition or role check; all route
through the shared functions documented there.

## Project Structure

### Documentation (this feature)

```text
docs/specs/008-catalog-management-workflow/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/
└── db/                             # EXTENDED (from 005/007)
    └── src/
        ├── schema/
        │   ├── organization-members.ts   # NEW — user ↔ role
        │   └── audit-logs.ts             # NEW
        ├── authz/
        │   └── can-transition.ts         # NEW — single shared role/lifecycle check
        └── queries/
            ├── catalog-write.ts          # NEW — create/edit/transition, all routed through can-transition + audit write
            ├── verification-queue.ts     # NEW — staleness/missing-field/broken-source query
            └── audit-trail.ts            # NEW — read a record's chronological history
        # REUSED, not duplicated, from 007 (packages/db/src/queries/,
        # packages/schemas/src/): list-published-instruments.ts,
        # get-instrument-detail.ts, list-catalog-facets.ts, pricing.ts
        # (resolveDisplayPrice), catalog-browsing.ts DTOs. catalog-write.ts
        # writes the same `instrument_models`/`model_images`/`sources` rows
        # 007's queries read — no second price-resolution or DTO layer.

apps/
└── manager-dashboard/              # EXISTING app (currently auth-scaffold only)
    └── src/
        ├── lib/
        │   └── auth.ts              # EXTENDED — better-auth + organization/role plugin
        └── routes/
            ├── catalog/
            │   ├── index.tsx         # NEW — record list, status filter
            │   ├── $modelId/edit.tsx # NEW — editor form (draft/in-review states)
            │   └── review/           # NEW — reviewer queue + diff view
            ├── verification-queue.tsx # NEW
            ├── audit/
            │   └── $entityId.tsx     # NEW — chronological diff view
            └── settings/
                └── members.tsx       # NEW — Owner/Admin role assignment UI
```

**Structure Decision**: Extend `apps/manager-dashboard` (which exists only as an
auth-scaffolded shell today) and `@windwise/db` (which 005/007 only read from).
No new shared package: authorization and lifecycle logic is
manager-dashboard-specific business process, not something
`apps/consumer-application` will ever call, so it belongs in `@windwise/db`
alongside the tables it governs rather than a separate package — unlike
`@windwise/core`, which is shared by both apps.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. `better-auth`'s organization/role plugin is an extension of an
already-present dependency, not a new one.
