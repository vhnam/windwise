---
work_item: 008-catalog-management-workflow
sequence: 008
slug: catalog-management-workflow
---

# Catalog Management Workflow

## Requirements

Build the manager-dashboard catalog authoring system that lets Editors draft
instrument records and moves every record through a server-enforced Draft → In
Review → Published → Archived lifecycle so that nothing reaches consumer-facing
surfaces without an explicit Reviewer approval; gate every transition and every
catalog write by a five-role model (Owner, Admin, Editor, Reviewer, Viewer)
evaluated against the actor's current assignment at call time, not a cached
session role; surface published records that have gone stale, are missing
required fields, or carry a broken source link in a verification queue; and
record every create, edit, status transition, and archive action as a
same-transaction audit entry with a before/after diff, so the catalog is
trustworthy as the single foundation that specs 005/006/007/009 all read from or
build on top of. Scaffold `@windwise/db` (does not yet exist) and
`@windwise/schemas` from scratch as part of this work, since no prior spec has
created them — this feature is both the database's first writer and its first
owner.

## Entities

```mermaid
classDiagram
direction TB

class Organization {
    +string id
    +string name
}

class OrganizationMember {
    +string id
    +string organizationId
    +string userId
    +Role role
    +currentRole() Role
}

class Role {
    <<enumeration>>
    owner
    admin
    editor
    reviewer
    viewer
}

class InstrumentModel {
    +string id
    +string brandId
    +string familyId
    +LifecycleStatus status
    +int dataCompleteness
    +string verifiedByUserId
    +DateTime lastVerifiedAt
    +int version
    +DateTime updatedAt
    +requiredFieldsMissing() string[]
}

class LifecycleStatus {
    <<enumeration>>
    draft
    in_review
    published
    archived
}

class ModelSpec {
    +string id
    +string modelId
    +string key
    +string value
}

class ModelImage {
    +string id
    +string modelId
    +string url
    +string creditText
    +string licenseNote
    +hasRequiredCredit() boolean
}

class Source {
    +string id
    +string url
    +boolean sourceOk
    +DateTime lastCheckedAt
}

class ModelSource {
    +string id
    +string modelId
    +string sourceId
    +string[] backedFields
}

class ReviewerNote {
    +string id
    +string modelId
    +string authorUserId
    +string body
    +DateTime createdAt
}

class Comment {
    +string id
    +string modelId
    +string authorUserId
    +string body
    +DateTime createdAt
}

class VerificationQueueItem {
    <<in-memory>>
    +string modelId
    +string displayName
    +QueueReason[] reasons
}

class QueueReason {
    <<enumeration>>
    stale
    missing_fields
    broken_source
}

class AuditLog {
    +string id
    +string actorUserId
    +string entity
    +string entityId
    +AuditAction action
    +jsonb before
    +jsonb after
    +DateTime at
}

class AuditAction {
    <<enumeration>>
    create
    edit
    status_transition
    archive
}

class CatalogSettings {
    +string organizationId
    +int stalenessThresholdDays
}

class CanTransition {
    <<function>>
    +check(actorRole, currentStatus, targetStatus) boolean
}

Organization "1" --> "1..*" OrganizationMember : has members
OrganizationMember "1" --> "1" Role : assigned
Organization "1" --> "1" CatalogSettings : configures
InstrumentModel "1" --> "1" LifecycleStatus : has
InstrumentModel "1" --> "0..*" ModelSpec : has
InstrumentModel "1" --> "0..*" ModelImage : has
InstrumentModel "1" --> "0..*" ModelSource : has
InstrumentModel "1" --> "0..*" ReviewerNote : accumulates
InstrumentModel "1" --> "0..*" Comment : accumulates
ModelSource "0..*" --> "1" Source : references
InstrumentModel "1" --> "0..*" AuditLog : audited by
CanTransition --> OrganizationMember : reads current role
CanTransition --> InstrumentModel : validates status change
VerificationQueueItem --> InstrumentModel : summarizes
VerificationQueueItem "1" --> "1..*" QueueReason : flags
```

Conservative-constraint notes:

- `InstrumentModel`, `ModelSpec`, `ModelImage`, `Source`, `ModelSource` are the
  source-of-truth catalog tables that specs 005/006/007 read from and 009 will
  attach rules to — do not add fields those specs would need without confirming
  against their data-model docs; this spec only adds the write-path fields
  (`status`, `dataCompleteness`, `verifiedByUserId`, `version`) that 005/006/007
  do not currently exercise.
- `ReviewerNote` and `Comment` are modeled as separate entities (SPEC GAP
  resolved conservatively): the spec's US1.3 "reviewer's notes attached" and
  US3.1 "Viewer... can add comments" name two different actions by two different
  roles at two different lifecycle moments — do not collapse them into one table
  without a spec update.
- `VerificationQueueItem` and `QueueReason` are in-memory query output
  (`@windwise/schemas`), never persisted tables, per data-model.md.
- `CanTransition` is a function, not a table — represented here to make the
  centralized-check architecture explicit in the entity graph.

## Approach

1. **Roles via better-auth organization plugin, not a custom table**: Add the
   `organization` plugin to `apps/manager-dashboard/src/lib/auth.ts`, extend its
   `member.role` field to the five-value enum
   (`owner | admin | editor | reviewer | viewer`) via the plugin's
   `additionalFields` mechanism. Do not build a parallel `organization_members`
   table — the plugin already models org → member → role and 008's spec role set
   maps directly onto it.

2. **One centralized lifecycle/role check, `can-transition.ts`**: Every server
   function that creates, edits, transitions, or archives a catalog record calls
   `canTransition(actorRole, currentStatus, targetStatus)` first. No route or
   server function re-implements the role matrix or the Draft→In
   Review→Published→Archived rules inline. This is what makes FR-012 ("current
   role, every time") true by construction — the function re-reads the member
   row at call time, never trusts a cached/session-start role.

3. **Same-transaction audit writes, no async/queued logging**:
   `catalog-write.ts` mutation functions wrap the record mutation and a call to
   `writeAuditEntry(...)` in a single Drizzle transaction. If the audit write
   fails, the mutation rolls back. This is a hard constraint (SC-003 "zero
   unattributed changes") — never split audit writes into a background job or
   event queue.

4. **Verification queue as a live read query plus a periodically-refreshed
   staleness flag on sources**: Staleness (`last_verified_at` vs. configurable
   threshold) and missing-required-fields are computed live on every query
   against already-loaded data — cheap and deterministic, no background job
   needed. Broken-source detection is different: it is an external network call,
   so a separate periodic job writes `sources.source_ok` and
   `sources.last_checked_at`, and the live query only reads that flag. Never
   perform a synchronous HTTP check inside a verification-queue page load.

5. **Optimistic concurrency for concurrent edits**: Every catalog write accepts
   the `version` (or `updatedAt`) the editor started from; the write is rejected
   with a conflict error if the stored version has since moved. This is the
   minimal mechanism the spec's edge case requires (a conflict signal, not
   real-time co-editing) — do not build pessimistic locking or CRDT-based
   collaboration.

6. **Publish gate uses one canonical required-field list, shared by three
   consumers**: Define the required-field list per entity type once (e.g.
   `@windwise/db/authz/required-fields.ts`), and have the publish gate (FR-009),
   the verification queue's missing-field check (FR-004), and the editor form's
   inline validation all read from it. Never let two of these three drift into
   separately-maintained lists — that was flagged as a design risk in the
   strategic analysis.

7. **No new shared package for lifecycle/role/audit logic**: This logic has
   exactly one consumer, `apps/manager-dashboard`. It lives in `@windwise/db`
   (adjacent to the tables it governs), not a new `packages/catalog-authz` or
   similar. Do not create a new workspace member for this feature beyond
   `@windwise/db` and `@windwise/schemas`, both of which are named as
   intended-but-not-yet-built in AGENTS.md §14.

8. **Owner vs. Admin resolved conservatively as functionally equivalent for this
   feature**: The spec (FR-008, US3.4) never differentiates their powers;
   `can-transition.ts` treats `owner` and `admin` as the same permission tier
   for every check in this feature (archive, restore, role management, threshold
   configuration). Do not invent a distinction the spec doesn't state — if a
   future spec needs one, that is a spec update, not a silent implementation
   choice here.

9. **At-least-one-Reviewer guarantee is out of scope**: The strategic analysis
   flags that an organization could end up with zero Reviewers, stalling every
   in-review record. This spec does not add an enforcement mechanism for it (no
   spec FR requires one) — do not build seat-count validation on role
   assignment; document it as a known operational gap in Safeguards instead.

## Structure

### Type Relationships

- `OrganizationMember.role` is the single source of truth `can-transition.ts`
  reads; nothing else stores a duplicate/cached role.
- `InstrumentModel.status` is the single lifecycle field; `ModelSpec`,
  `ModelImage`, `ModelSource` are children scoped by `modelId` and do not carry
  their own independent status.
- `VerificationQueueItem` and `AuditTrailEntry` are `@windwise/schemas`
  Valibot-validated shapes, never Drizzle table types — they are query output,
  not persisted rows.
- `AuditLog.before`/`after` are `jsonb` diffs keyed by changed field name only
  (not full-row snapshots), consistent with FR-010's "before/after diff of
  changed fields."

### Dependencies

1. This spec is upstream of 005 (guided consultation) and 007 (catalog browsing)
   — both read `status = 'published'` records from the tables this spec makes
   writable for the first time. Do not change the read-side query shape those
   specs already depend on without confirming against their plans.
2. This spec is upstream of 006 (instrument compare) for the same reason —
   compare surfaces only published records.
3. This spec is upstream of 009 (recommendation rules authoring) — rules attach
   to catalog entities this spec is the source of truth for; 009 must not
   duplicate lifecycle/role/audit logic, it consumes the same `@windwise/db`
   tables and `can-transition.ts`.
4. `apps/manager-dashboard` depends on `@windwise/db` (new), `@windwise/schemas`
   (new), `@windwise/ui` (existing, dashboard theme), `@windwise/query`
   (existing, TanStack Query helpers), `better-auth` (existing dependency,
   organization plugin newly configured).
5. `@windwise/db` depends on `better-auth`'s organization/member tables for
   `OrganizationMember` (extended, not duplicated) and owns `AuditLog`, catalog
   tables, and `CatalogSettings` outright.
6. `apps/consumer-application` has no new dependency from this spec — it
   continues to read the same catalog tables it already reads via 005/007's
   established read path; this spec must not require consumer-application code
   changes.

### Layered Architecture

1. **Route/dashboard layer** (`apps/manager-dashboard/src/routes/`): TanStack
   Start route modules and React components. Calls server functions only; never
   imports Drizzle or touches `@windwise/db` internals directly.
2. **Service layer** (`packages/db/src/authz/`, `packages/db/src/queries/`):
   `can-transition.ts`, `catalog-write.ts`, `verification-queue.ts`,
   `audit-trail.ts`, `required-fields.ts`. This is where role checks, lifecycle
   rules, and audit writes are centralized. Exposed to the route layer as
   TanStack Start server functions.
3. **DB/audit layer** (`packages/db/src/schema/`): Drizzle schema definitions —
   catalog tables, `organization-members.ts` (better-auth plugin extension),
   `audit-logs.ts`, `catalog-settings.ts`. This layer has no business logic,
   only table shape and constraints (foreign keys, `NOT NULL`, enum types).
4. **Validation layer**: `vp -C packages/db test`,
   `vp -C apps/manager-dashboard test`, then workspace-wide `vp run ready`.

## Operations

### Create Package - `packages/db/package.json`

1. Responsibility: Scaffold the `@windwise/db` workspace member — does not exist
   yet in this repo (confirmed by strategic analysis and direct inspection of
   `packages/`).
2. Content: `"name": "@windwise/db"`, `"version": "0.1.0"`, `"private": true`,
   `drizzle-orm`, `postgres` (or the platform's chosen pg driver), `drizzle-kit`
   as devDependency, catalog-referenced versions where the workspace catalog
   already pins one (e.g. `@types/node`).
3. Constraints: Follows `packages/query`/`packages/vite-config` as the
   sibling-package template for `package.json` shape, `tsconfig.json`, and
   `exports` map conventions. No `main`/`module` dual build unless an existing
   sibling package already does one — match `packages/query`'s pattern.

### Create Package - `packages/schemas/package.json`

1. Responsibility: Scaffold `@windwise/schemas` — the Valibot-validated
   in-memory shapes (`VerificationQueueItem`, `AuditTrailEntry`) that
   data-model.md defines as living here, not in `@windwise/db`.
2. Content: `"name": "@windwise/schemas"`, `"version": "0.1.0"`,
   `"private": true`, `valibot` (catalog-pinned).
3. Constraints: Pure schema/type package — no Drizzle, no server-function code,
   no React. Both `apps/manager-dashboard` and (eventually) 009 import from
   here.

### Create Schema - `packages/db/src/schema/catalog.ts`

1. Responsibility: Drizzle table definitions for `brands`,
   `instrument_families`, `instrument_models`, `model_specs`, `model_images`,
   `sources`, `model_sources` per plan.md §Storage and platform §3.2, including
   this spec's new write-path fields.
2. Fields on `instrument_models` beyond the base catalog shape: `status` (pgEnum
   `draft | in_review | published | archived`, default `'draft'`),
   `data_completeness` (integer 0-100), `verified_by_user_id` (uuid, fk to
   better-auth `user.id`), `last_verified_at` (timestamp), `version` (integer,
   default 1, incremented on every write) or `updated_at` used as the
   optimistic-concurrency token — pick one and use it consistently across
   `catalog-write.ts`.
3. Fields on `model_images`: `credit_text` (text, not null), `license_note`
   (text, not null) — publish gate blocks any image missing either (FR-006).
4. Fields on `sources`: `source_ok` (boolean, nullable — null means "not yet
   checked"), `last_checked_at` (timestamp).
5. New table `model_sources` gains `backed_fields` (text array) per FR-007
   ("which fields that source backs").
6. Constraints: All FKs `on delete restrict` for catalog rows referenced by
   `audit_logs`/`model_sources` (never cascade-delete a record with audit
   history). Enum types use `pgEnum`, not plain text with an app-level check.

### Create Schema - `packages/db/src/schema/organization-members.ts`

1. Responsibility: Extend better-auth's organization plugin `member` table with
   the five-value role enum (data-model.md's `OrganizationMember`).
2. Logic: Define
   `roleEnum = pgEnum('role', ['owner','admin','editor','reviewer','viewer'])`
   and attach it via better-auth's `additionalFields` on the organization plugin
   config (`apps/manager-dashboard/src/lib/auth.ts`), backed by this Drizzle
   column definition matching the plugin's expected table shape.
3. Constraints: Do not create a second, independent members table — this must be
   the same physical table better-auth's plugin manages, with the role column
   added, not a shadow table joined by `user_id`.

### Create Schema - `packages/db/src/schema/audit-logs.ts`

1. Responsibility: `AuditLog` table per data-model.md — `id`, `actor_user_id`
   (fk), `entity` (text), `entity_id` (uuid), `action` (pgEnum
   `create | edit | status_transition | archive`), `before` (jsonb, nullable),
   `after` (jsonb), `at` (timestamp, default now).
2. Constraints: `entity_id` is not a strict FK to any single table (it
   references whichever entity type `entity` names) — index on
   `(entity, entity_id, at)` for the audit-trail read query's chronological
   lookup.

### Create Schema - `packages/db/src/schema/catalog-settings.ts`

1. Responsibility: Per-organization `staleness_threshold_days` (integer,
   default 180) — resolves the "configurable by whom, at what scope" ambiguity
   as organization-scoped, editable by Owner/Admin only (spec Assumptions:
   "configurable by an Owner/Admin").
2. Constraints: One row per `organization_id`; do not add per-entity-type
   thresholds — spec does not ask for that granularity.

### Create Function - `packages/db/src/authz/can-transition.ts`

1. Responsibility: Single shared lifecycle/role check (research.md §2); every
   catalog mutation routes through this.
2. Signature:
   `canTransition(actorRole: Role, currentStatus: LifecycleStatus, targetStatus: LifecycleStatus): { allowed: boolean; reason?: string }`.
3. Logic steps:
   - Look up the legal-transition table: `draft → in_review` (editor+),
     `in_review → published` (reviewer+), `in_review → draft` (reviewer+,
     request-changes), `published → archived` (reviewer+/admin+),
     `archived → draft` (admin+, explicit restore only).
   - Reject any transition not in the table (e.g. `draft → published` directly)
     regardless of role.
   - Return `{ allowed: false, reason: 'role' }` vs
     `{ allowed: false, reason: 'illegal-transition' }` distinctly so callers
     can surface the right error.
4. Constraints: Pure function, no DB access — the caller (`catalog-write.ts`) is
   responsible for reading the actor's _current_ role fresh from the DB before
   calling this, never from a cached session value (FR-012).

### Create Function - `packages/db/src/authz/required-fields.ts`

1. Responsibility: Canonical required-field list per entity type, the single
   source of truth for the publish gate, verification queue, and editor form
   (Approach §6).
2. Signature: `getRequiredFields(entityType: 'instrument_model'): string[]` and
   `computeMissingFields(entityType, record): string[]`.
3. Constraints: SPEC GAP — the exact field list is not enumerated in
   spec.md/data-model.md. Populate it from the fields data-model.md already
   marks as required by the review gate (`status`-blocking fields: brand,
   family, at least one spec value, at least one image with credit+license, at
   least one source) and flag any field beyond that as
   `SPEC GAP / OPEN QUESTION` in a code comment rather than guessing.

### Create Function - `packages/db/src/queries/catalog-write.ts`

1. Responsibility: The single mutation entry point for create, edit, status
   transition, and archive — nothing else in the codebase may write to catalog
   tables (research.md §2 risk: "if any future mutation path is added without
   routing through the shared write function, the guarantee silently breaks").
2. Signatures and logic:
   - `createInstrumentModel(actorUserId, orgId, input): Promise<InstrumentModel>`
     — inserts with `status: 'draft'`, `version: 1`; within the same
     transaction, calls
     `writeAuditEntry(actor, 'instrument_model', newId, 'create', null, after)`.
   - `editInstrumentModel(actorUserId, orgId, modelId, expectedVersion, patch): Promise<InstrumentModel>`
     — reads current role via `getCurrentRole(actorUserId, orgId)`; rejects if
     `expectedVersion !== stored version` with a conflict error (optimistic
     concurrency, research.md §5); computes the diff of changed fields; writes
     the row and an `edit` audit entry in one transaction.
   - `transitionInstrumentModel(actorUserId, orgId, modelId, expectedVersion, targetStatus, note?): Promise<InstrumentModel>`
     — reads current role and current status fresh; calls `canTransition`; if
     target is `published`, calls `computeMissingFields` and rejects with the
     missing-field list if non-empty (FR-009); on `in_review → draft` with a
     `note`, also inserts a `ReviewerNote` row in the same transaction; writes a
     `status_transition` audit entry.
   - `archiveInstrumentModel(actorUserId, orgId, modelId, expectedVersion): Promise<InstrumentModel>`
     — same pattern, `action: 'archive'`.
3. Constraints: Every function re-reads the actor's role from
   `organization_members` at call time — never accept a role passed in from a
   client-trusted session claim. Every function wraps mutation + audit write in
   one `db.transaction(...)` call; a failed audit write rolls back the mutation.

### Create Function - `packages/db/src/authz/write-audit-entry.ts`

1. Responsibility: Shared audit-write helper called only from within
   `catalog-write.ts`'s transactions (research.md §3).
2. Signature:
   `writeAuditEntry(tx, actorUserId, entity, entityId, action, before, after): Promise<void>`.
3. Logic: Computes the field-level diff (before/after keys that changed only,
   not full snapshots) if both `before` and `after` are provided; inserts one
   `audit_logs` row using the passed transaction handle `tx`, never a fresh
   connection.
4. Constraints: Must accept a transaction handle as a parameter — never open its
   own connection/transaction, or the same-transaction guarantee breaks.

### Create Query - `packages/db/src/queries/verification-queue.ts`

1. Responsibility: Read-only query producing `VerificationQueueItem[]`
   (research.md §4).
2. Signature: `getVerificationQueue(orgId): Promise<VerificationQueueItem[]>`.
3. Logic steps:
   - Read `catalog_settings.staleness_threshold_days` for the org (default 180
     if no row).
   - Select all `instrument_models` where `status = 'published'`.
   - For each: compute `stale` reason if `last_verified_at` older than the
     threshold; compute `missing_fields` reason via
     `computeMissingFields('instrument_model', record)`; compute `broken_source`
     reason by joining `model_sources → sources` and checking
     `source_ok = false`.
   - A record may carry more than one reason simultaneously (data-model.md,
     confirmed intentional in strategic analysis) — group by record, not by
     reason.
4. Constraints: No live HTTP calls inside this function — `source_ok` is read
   from the periodically-refreshed flag only (Approach §4). An archived record
   is never included, even if it was flagged before archiving (SPEC GAP resolved
   conservatively: queue is explicitly scoped to `status = 'published'` per
   FR-003's wording — archiving removes a record from the queue as a consequence
   of the status filter, not a special case).

### Create Job - `packages/db/src/jobs/check-source-liveness.ts`

1. Responsibility: Periodic (not per-page-load) check that updates
   `sources.source_ok`/`last_checked_at` (research.md §4).
2. Signature: `checkSourceLiveness(sourceIds?: string[]): Promise<void>` —
   HEAD/GET request per source URL with a short timeout; sets `source_ok = true`
   on 2xx/3xx, `false` on failure, always updates `last_checked_at`.
3. Constraints: Must not run inside a request/response cycle triggered by a
   dashboard page load. Wire it as a scheduled task per whatever job-running
   convention the platform later adopts — if none exists yet, implement as an
   invokable function with a documented manual/cron trigger, not inline in
   `verification-queue.ts`. Include basic retry/backoff (research.md §4 risk:
   false positives from transient failures) — do not flag a source broken from a
   single failed attempt; require the check to fail twice consecutively before
   flipping `source_ok` to `false`.

### Create Query - `packages/db/src/queries/audit-trail.ts`

1. Responsibility: Chronological audit history for one entity (FR-011).
2. Signature:
   `getAuditTrail(entity: string, entityId: string): Promise<AuditTrailEntry[]>`.
3. Logic: Selects from `audit_logs` filtered by `(entity, entity_id)`, ordered
   by `at` ascending; joins `actor_user_id` to a display name (via better-auth's
   `user` table); maps `before`/`after` jsonb into the
   `diff: Array<{field, before, after}>` shape from data-model.md.
4. Constraints: Read-only; no pagination cap unless a record's history exceeds a
   size that makes the dashboard view unusable — if so, paginate with TanStack
   Router search params, not an arbitrary hard truncation.

### Update Auth Config - `apps/manager-dashboard/src/lib/auth.ts`

1. Responsibility: Configure better-auth's organization plugin with the
   five-role enum (Approach §1).
2. Logic: Add `organization({ ... })` to the `plugins` array alongside the
   existing `tanstackStartCookies()`; configure `additionalFields.role` on the
   member schema to reference the Drizzle `roleEnum`; wire the `database`
   adapter to the new `@windwise/db` Drizzle instance (currently `auth.ts` has
   no database adapter configured at all — this is a new addition, not an
   extension).
3. Constraints: Do not remove `emailAndPassword` or `tanstackStartCookies()` —
   those are out of scope (spec Assumptions: "account creation/authentication
   mechanics themselves are out of scope").

### Create Route - `apps/manager-dashboard/src/routes/catalog/index.tsx`

1. Responsibility: Record list with status filter (US1, plan.md structure).
2. Logic: TanStack Query hook calling a server function wrapping a read query
   over `instrument_models` filtered by `status` search param (TanStack Router
   typed search params per plan.md's Technical Context); role-gated action
   buttons (Edit only if actor role is editor+; the create button only if
   editor+).
3. Constraints: Read path only — no direct DB access from the route component;
   reads status via the server function, not client-side.

### Create Route - `apps/manager-dashboard/src/routes/catalog/$modelId/edit.tsx`

1. Responsibility: Editor form for draft/in-review records (US1).
2. Logic: Loads the record with its current `version`; on save, calls the
   `editInstrumentModel` server function passing the loaded `version` as
   `expectedVersion`; on conflict-error response, surfaces a conflict message
   (not a silent overwrite) per the concurrent-edit edge case; "mark ready"
   button calls `transitionInstrumentModel(..., 'in_review')`.
3. Constraints: Zustand used only for unsaved-draft form state per plan.md's
   Technical Context ("not used for anything with a server counterpart") — do
   not use Zustand for the record data itself, that stays in TanStack Query
   cache.

### Create Route - `apps/manager-dashboard/src/routes/catalog/review/index.tsx`

1. Responsibility: Reviewer queue — in-review records (US1.2's "reviewer's
   queue" resolved as a filtered list view, not a separate table, per strategic
   analysis's noted gap).
2. Logic: Server function query for `status = 'in_review'`; approve button calls
   `transitionInstrumentModel(..., 'published')` (blocked with a missing-field
   message if FR-009 rejects it); request-changes control requires a note field
   and calls `transitionInstrumentModel(..., 'draft', note)`.
3. Constraints: Only rendered/actionable for reviewer+ role — editor/viewer
   sessions see a role-appropriate empty/denied state, not a broken page.

### Create Route - `apps/manager-dashboard/src/routes/verification-queue.tsx`

1. Responsibility: Verification queue view (US2).
2. Logic: Server function calling `getVerificationQueue(orgId)`; renders
   grouped-by-record reason badges (stale / missing fields / broken source).
3. Constraints: No client-side polling that triggers live URL checks — reads
   only the precomputed `source_ok` flag.

### Create Route - `apps/manager-dashboard/src/routes/audit/$entityId.tsx`

1. Responsibility: Chronological diff view for one record (US4).
2. Logic: Server function calling `getAuditTrail('instrument_model', entityId)`;
   renders each entry's actor, timestamp, action, and field-level diff in order.
3. Constraints: Read-only; viewable by all roles including Viewer (spec: Viewers
   "can still read records").

### Create Route - `apps/manager-dashboard/src/routes/settings/members.tsx`

1. Responsibility: Owner/Admin role-assignment UI (US3.4).
2. Logic: Lists org members with current role; role-change control calls a
   better-auth organization-plugin update; takes effect immediately because
   `can-transition.ts` always re-reads the role at call time (no cache
   invalidation step needed for correctness, though TanStack Query cache for the
   members list itself should still invalidate on save).
3. Constraints: Only rendered for owner/admin role. Also hosts the
   `staleness_threshold_days` setting field (Approach: org-scoped,
   Owner/Admin-editable).

### Create Tests - `packages/db/src/authz/can-transition.test.ts`

1. Responsibility: Every legal/illegal transition per role (plan.md Testing).
2. Cases: All five legal transitions × each of five roles (25 combinations,
   asserting exactly which allow); at least one illegal transition attempt
   (`draft → published` direct) rejected regardless of role.
3. Framework: `import { describe, expect, it } from 'vite-plus/test'`.

### Create Tests - `packages/db/src/queries/catalog-write.test.ts`

1. Responsibility: Integration coverage for the publish gate and audit writes
   (plan.md Testing — "cross-package-boundary behaviors... not assumptions").
2. Cases: publish blocked when a required field is missing, with the specific
   missing fields returned; every mutation type (create/edit/
   transition/archive) produces exactly one corresponding `audit_logs` row with
   correct before/after; concurrent edit with a stale `expectedVersion` is
   rejected with a conflict error, not silently applied; revoked-role save
   attempt (actor's role changed between session start and save) is denied.
3. Framework: `vite-plus/test` against a test database instance following
   whatever DB-test setup convention `packages/query` or existing app tests use
   (inspect before inventing a new one).

### Create Tests - `packages/db/src/queries/verification-queue.test.ts`

1. Responsibility: US2 acceptance scenarios directly.
2. Cases: stale record appears; missing-field record appears with fields named;
   broken-source record appears; fully current/complete/working record does not
   appear; a record with multiple simultaneous reasons appears once with all
   reasons listed; archived record never appears even if previously flagged.

### Create Changeset - `.changeset/catalog-management-workflow.md`

1. Responsibility: Record shipped package/app changes per AGENTS.md §7.
2. Content: `minor` for `@windwise/db` (new package, new public API surface),
   `minor` for `@windwise/schemas` (new package), `minor` for
   `@windwise/manager-dashboard` (new catalog/verification-queue/audit/ settings
   routes and role-gated behavior).
3. Constraints: No `Co-authored-by` trailer (AGENTS.md §7). Follow the `0.y.z`
   baseline — do not jump to `1.0.0` for this feature alone.

### Verify - workspace quality gate

1. Responsibility: Constitution I/II per AGENTS.md.
2. Steps: `vp -C packages/db test`, `vp -C apps/manager-dashboard test`, then
   workspace-wide `vp run ready`.
3. Constraints: Do not merge/report complete if `vp run ready` fails on files
   this work item touches; pre-existing unrelated format debt (per the 004
   precedent) is not this work item's responsibility to fix, but any failure
   inside `packages/db`, `packages/schemas`, or the new `apps/manager-dashboard`
   routes/tests is.

## Norms

1. **Package boundary**: `@windwise/db` owns all Drizzle schema and
   catalog/audit/authz query functions; `@windwise/schemas` owns Valibot
   in-memory shapes; `apps/manager-dashboard` never imports `drizzle-orm` or
   writes raw SQL directly — only through `@windwise/db`'s exported functions.
   `apps/consumer-application` must not gain a new dependency from this work.
2. **Imports**: Use `@windwise/db`, `@windwise/schemas`, `@windwise/ui`,
   `@windwise/query` via `workspace:*`, matching existing app import grouping.
   Within `packages/db`, follow whatever `#/` alias convention
   `packages/ui`/`packages/query` already establish for internal imports (verify
   against those packages' `package.json` `imports` field before adding a new
   one).
3. **Tests**: `vite-plus/test` exclusively —
   `import { describe, expect, it } from 'vite-plus/test'`. Colocate tests next
   to source (`can-transition.test.ts` beside `can-transition.ts`), matching
   `packages/ui/src/styles/globals.test.ts`'s colocation pattern.
4. **Changesets**: One changeset per PR covering all packages/apps touched
   (AGENTS.md §7); `minor` for new public exports on `@windwise/db`/
   `@windwise/schemas`; skip changesets only for docs/spec-only edits.
5. **Error handling**: Server functions return typed error shapes (e.g.
   `{ ok: false, reason: 'conflict' | 'role-denied' | 'missing-fields', details }`)
   rather than throwing raw exceptions across the client/server boundary —
   TanStack Start server functions surface these to the route's TanStack Query
   error state, which renders role-appropriate messaging. Do not use Java-style
   global exception handler middleware; this is a TS/Node/React stack with typed
   return-value error handling at the service-function boundary, matching the
   platform plan's stated approach elsewhere in the monorepo.
6. **Formatting/linting**: oxfmt/oxlint via `vp check`; no additional lint
   config invented for this work item.
7. **No domain leakage into `@windwise/ui`**: Catalog/audit/verification-queue
   UI is dashboard-app-specific; only generic primitives (table, badge, dialog)
   come from `@windwise/ui` — do not add `InstrumentCard` or `AuditDiffView`
   components to the shared UI package (AGENTS.md §9).

## Safeguards

1. **Functional — out of scope**: Do not build rule authoring or
   recommendation-test tooling (that is 009). Do not build real-time
   collaborative/CRDT editing. Do not build pessimistic row locking. Do not
   build a background job framework beyond the one periodic source-liveness
   check this spec requires. Do not build seat-count/at-least-one-Reviewer
   enforcement (documented gap, not this spec's scope).
2. **Performance**: Verification-queue reads must not perform live HTTP calls;
   broken-source detection is strictly the periodic job's flag.
   Status-transition and edit round-trips must reflect in the UI via TanStack
   Query invalidation without a full page reload (plan.md's stated performance
   target).
3. **Security**: Every catalog mutation re-reads the actor's role from the
   database at call time — no role read from a client-supplied or session-cached
   claim is ever trusted for an authorization decision (FR-012). Audit log rows
   are append-only from application code — no update/delete function is exposed
   for `audit_logs`; tamper-resistance is enforced by never writing an update
   path, not by database-level permissions this spec doesn't scope in.
4. **Integration**: This is the foundation 005/006/007/009 depend on — do not
   change the shape of already-established read queries those specs use without
   checking their plan/data-model docs first. `apps/consumer-application` must
   not gain any new dependency or route from this work.
5. **Business rules**: Nothing reaches `status = 'published'` through any path
   other than the reviewer-gated `transitionInstrumentModel` function (FR-001).
   Publish is always blocked when required fields are missing (FR-009) — this
   check cannot be bypassed by directly calling `editInstrumentModel` with
   `status: 'published'` in the patch; status changes only happen through the
   transition function. Archival is never automatically reversed (spec Edge
   Cases) — restore is always an explicit Admin+ action. The staleness threshold
   is a per-organization, Owner/Admin-configurable setting (SPEC GAP resolved)
   and changing it must be reflected on the next verification-queue read, not
   retroactively backfilled onto records.
6. **Technical constraints**: `@windwise/db` and `@windwise/schemas` are new
   packages created by this work item — do not skip scaffolding them by inlining
   Drizzle schema directly into `apps/manager-dashboard`. Optimistic concurrency
   (`version`/`updated_at`) is mandatory on every catalog write function; a
   write without a version check on a mutable record is a safeguard violation.
7. **Data constraints**: `model_images` cannot be published without both
   `credit_text` and `license_note` populated (FR-006) — enforced at the
   publish-gate level via `required-fields.ts`, not only as a DB `NOT NULL`
   (images can exist in draft without credit info; only publish blocks it).
   `AuditLog.before`/`after` store field-level diffs, not full-row snapshots, to
   keep entries reviewable.
8. **API constraints**: Every catalog-mutating server function accepts and
   validates `expectedVersion`; every function reads role fresh, never accepts a
   role parameter from the client. `getVerificationQueue` and `getAuditTrail`
   are read-only — no mutation branch inside either.
9. **Verification gate**: `vp -C packages/db test` and
   `vp -C apps/manager-dashboard test` must pass; `vp run ready` is the
   workspace gate for this work item's touched files (schema, authz, queries,
   routes, tests) — pre-existing unrelated format debt elsewhere in the repo is
   not blocking, per the 004 precedent, but nothing newly added by this work
   item may fail it.
