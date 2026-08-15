# Phase 0 Research: Catalog Management Workflow

## 1. Role/organization model on top of better-auth

**Decision**: Use better-auth's organization plugin (adds
`organization`/`member`/`invitation` tables) and map the platform's five fixed
roles (Owner/Admin/Editor/Reviewer/Viewer) onto better-auth's member role field,
rather than building a separate custom roles table from scratch.

**Rationale**: `apps/manager-dashboard` already depends on `better-auth`
(currently configured with only `emailAndPassword` + the TanStack Start cookie
plugin). The organization plugin is the standard extension point for exactly
this multi-role, single-tenant-per-org access model, and reusing it avoids
maintaining a second auth-adjacent system alongside better-auth's session
handling. Spec 008 BR-M11's five roles map cleanly onto a single `role` enum
column on the plugin's member table.

**Alternatives considered**: A fully custom `organization_members` table
independent of better-auth — rejected; it would duplicate session/identity
wiring better-auth already provides and the plugin already models the
org→member→role relationship the spec needs.

## 2. Where the lifecycle/role check lives

**Decision**: One function, `can-transition.ts` in `@windwise/db`, takes
`(actorRole, currentStatus, targetStatus)` and returns allow/deny. Every server
function that mutates a catalog record's status calls this first; none
re-implements the Draft→In Review→Published→Archived rules or the role matrix
inline.

**Rationale**: Spec FR-002/FR-008/FR-012 all describe the same underlying
invariant from different angles (who can move state, publish is blocked on
missing fields, revoked roles take effect immediately) — centralizing the check
means "evaluated against the current assignment" (FR-012) is true by
construction: the function always reads live role state, there is no
cached-at-session-start copy to go stale.

**Alternatives considered**: Per-route role checks written inline — rejected,
this is precisely the "unreviewed or inconsistent code compounds quickly" case
the constitution's Code Quality rationale names explicitly.

## 3. Audit log write strategy

**Decision**: `catalog-write.ts`'s mutation functions (create, edit, transition,
archive) each call a shared
`writeAuditEntry(actor, entity, entityId, action, before, after)` as part of the
same database transaction as the mutation itself — not as a separate
async/best-effort step.

**Rationale**: Spec FR-010/FR-011 and SC-003 require zero unattributed changes;
a fire-and-forget audit write could fail independently of the mutation and
silently produce exactly the gap the feature exists to close. Same-transaction
write makes "every change has an audit entry" a database guarantee, not an
application-level hope.

**Alternatives considered**: Async audit logging via a queue/event bus —
rejected as unwarranted complexity for this scale (v1 catalog of ~60-90 models,
moderate edit volume) and it reintroduces the exact failure mode (mutation
succeeds, audit write silently drops) the spec calls "non-negotiable" to avoid.

## 4. Verification queue computation

**Decision**: `verification-queue.ts` is a read query (not a background job)
that computes staleness (`last_verified_at` older than a configurable threshold,
default 180 days per platform plan and spec FR-003), missing required fields
(compares present fields against a fixed required-field list per entity type),
and broken source links (a separately-scheduled, lightweight periodic check that
writes a `source_ok: boolean` flag onto `sources`, which this query then reads —
not a live HTTP check per page load).

**Rationale**: Staleness and missing-field checks are cheap, deterministic
computations over already-loaded data and should not require a background job.
Source-URL liveness, however, is an external network call and must not block a
manager's page load (spec FR-005's requirement is that broken sources _surface_,
not that they're checked synchronously) — hence the split between a live query
and a periodically-refreshed flag.

**Alternatives considered**: Checking every source URL synchronously on every
verification-queue page load — rejected, turns a dashboard read into a slow,
flaky operation dependent on third-party site availability, directly working
against the constitution's performance-responsiveness principle.

## 5. Concurrent-edit protection

**Decision**: Optimistic concurrency via a `version` (or `updated_at`) check on
write — a save/publish call includes the version it started from; the write
function rejects with a conflict error if the current stored version has moved
since, rather than silently overwriting.

**Rationale**: Spec Edge Cases explicitly calls out two editors on the same
draft record; the requirement is only that one editor's changes don't silently
overwrite the other's, not full real-time collaborative editing (the platform
plan does not scope that in). Optimistic concurrency is the minimal mechanism
that satisfies "at least a conflict signal."

**Alternatives considered**: Pessimistic row locking — rejected as unnecessary
for the expected edit concurrency at this scale and it introduces
lock-management complexity (timeouts, stuck locks) the spec doesn't ask for.
Real-time collaborative editing (e.g., CRDT-based) — explicitly out of scope;
the spec asks for a conflict signal, not simultaneous co-editing.
