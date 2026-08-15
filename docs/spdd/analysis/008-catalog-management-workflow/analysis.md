---
work_item: 008-catalog-management-workflow
sequence: 008
slug: catalog-management-workflow
---

# SPDD Analysis: Catalog Management Workflow

## Original Business Requirement

# Feature Specification: Catalog Management Workflow

**Feature Branch**: `008-catalog-management-workflow`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Manager dashboard catalog authoring with a review
gate (draft/in review/published/archived), a verification queue for stale or
incomplete records, role-based access, and a full audit trail of every change."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Authoring a new catalog entry safely (Priority: P1)

A catalog editor adds a new instrument model with its specs, pricing, and
sources, and it does not reach consumers until someone has explicitly reviewed
and published it.

**Why this priority**: This is the foundational safeguard for the entire
platform — nothing else about the catalog matters if unreviewed data can leak to
consumers.

**Independent Test**: Can be fully tested by creating a new instrument record,
saving it, and confirming it does not appear on any consumer-facing page until
it is explicitly published.

**Acceptance Scenarios**:

1. **Given** an editor with catalog-edit permission, **When** they create or
   edit an instrument record, **Then** it is saved in "draft" status and is not
   visible to consumers.
2. **Given** a draft record, **When** an editor marks it ready, **Then** it
   moves to "in review" status and becomes visible in a reviewer's queue.
3. **Given** an in-review record, **When** a reviewer approves it, **Then** it
   moves to "published" and becomes visible on consumer-facing pages; **When** a
   reviewer instead requests changes, **Then** it returns to "draft" with the
   reviewer's notes attached.
4. **Given** a published record that should no longer be offered, **When** an
   authorized user archives it, **Then** it is removed from consumer-facing
   pages but remains in the system for historical reference.

---

### User Story 2 - Finding records that need attention (Priority: P1)

A manager wants to know which published instruments have gone stale or are
missing required information, without manually checking every row.

**Why this priority**: Silent data staleness was identified as a top quality
risk for the whole platform; surfacing it proactively is what keeps the catalog
trustworthy over time.

**Independent Test**: Can be fully tested by seeding one record with an old
verification date, one with missing required fields, and confirming both appear
in the verification queue while a fully current record does not.

**Acceptance Scenarios**:

1. **Given** a published instrument last verified more than the configured
   staleness threshold (default 180 days) ago, **When** the verification queue
   is viewed, **Then** that instrument appears in it.
2. **Given** an instrument missing one or more required fields, **When** the
   verification queue is viewed, **Then** that instrument appears in it with the
   missing fields identified.
3. **Given** an instrument whose recorded source URL no longer resolves,
   **When** the verification queue is viewed, **Then** that instrument appears
   in it flagged as a broken source.
4. **Given** an instrument that is current, complete, and has a working source
   link, **When** the verification queue is viewed, **Then** it does not appear
   in the queue.

---

### User Story 3 - Controlling who can do what (Priority: P1)

An organization wants an external domain expert (e.g., a music teacher) to be
able to read and comment on catalog content without being able to change
anything that reaches consumers, while editors and reviewers have distinct,
appropriate powers.

**Why this priority**: A control plane that changes consumer-facing advice
cannot be safely operated without role separation; this is a prerequisite for
trusting the review gate itself.

**Independent Test**: Can be fully tested by assigning each of the five roles to
a test user and confirming each can perform only its permitted actions.

**Acceptance Scenarios**:

1. **Given** a user with the Viewer role, **When** they attempt to edit or
   publish a catalog record, **Then** the action is denied; they can still read
   records and add comments.
2. **Given** a user with the Editor role, **When** they attempt to publish a
   record directly, **Then** the action is denied — they can move a record to
   "in review" but cannot publish it themselves.
3. **Given** a user with the Reviewer role, **When** they approve an in-review
   record, **Then** it publishes successfully.
4. **Given** a user with the Owner or Admin role, **When** they manage role
   assignments for other users, **Then** the change takes effect immediately.

---

### User Story 4 - Reconstructing what changed and why (Priority: P2)

A manager investigating "why did this model's recommendation change" needs to
see exactly what field changed, who changed it, and when.

**Why this priority**: Non-negotiable for accountability in a system where a
single field edit changes consumer-facing advice, but the platform is minimally
usable without it for a short period while the review gate and roles are
established first.

**Independent Test**: Can be fully tested by editing a field on a catalog record
and confirming the audit log shows the actor, timestamp, and a before/after diff
of that exact change.

**Acceptance Scenarios**:

1. **Given** any change to a catalog record (create, edit, status transition,
   archive), **When** the audit trail is viewed, **Then** it shows who made the
   change, when, and a before/after diff of the affected fields.
2. **Given** a series of changes to one record over time, **When** its history
   is viewed, **Then** all changes are listed in chronological order.

### Edge Cases

- What happens when a reviewer tries to publish a record with missing required
  fields? The system must block publish and identify what is missing, not
  publish incomplete data.
- What happens when two editors edit the same draft record concurrently? The
  system must prevent one editor's changes from silently overwriting the other's
  without at least a conflict signal.
- How does the system handle a user whose role is revoked while they have an
  unsaved edit in progress? Their next save attempt must be denied according to
  their current (revoked) permissions.
- What happens when an archived record's source URL later starts resolving
  again? It remains archived until an authorized user explicitly restores or
  republishes it — archival is not automatically reversed.
- What happens when the verification staleness threshold is changed? The queue
  must reflect the new threshold on next view, not just for newly verified
  records.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST enforce a catalog record lifecycle of Draft → In
  Review → Published → Archived, with no path for a record to become visible to
  consumers without passing through "Published."
- **FR-002**: System MUST restrict who can move a record between each lifecycle
  state according to role (see FR-008).
- **FR-003**: System MUST provide a verification queue surfacing published
  records whose last-verified date exceeds a configurable threshold (default 180
  days).
- **FR-004**: System MUST surface, in the verification queue, records missing
  any required field.
- **FR-005**: System MUST surface, in the verification queue, records whose
  recorded source URL fails to resolve.
- **FR-006**: System MUST record, on every catalog record, its images with
  credit and license note, and MUST NOT permit publishing an image without this
  information.
- **FR-007**: System MUST record every source used to verify a record, including
  which fields that source backs.
- **FR-008**: System MUST support five roles — Owner, Admin, Editor, Reviewer,
  Viewer — with Editors able to draft, Reviewers able to publish, and Viewers
  restricted to read and comment.
- **FR-009**: System MUST block publish of any record with missing required
  fields.
- **FR-010**: System MUST log every create, edit, status transition, and archive
  action against a catalog record, capturing actor, timestamp, and a
  before/after diff of changed fields.
- **FR-011**: System MUST make the audit history of any record viewable in
  chronological order.
- **FR-012**: System MUST prevent a user from performing an action outside their
  currently assigned role, even if a session was started before a role change.

### Key Entities

- **Instrument Record**: A catalog entry moving through the Draft → In Review →
  Published → Archived lifecycle, with specs, pricing, images, and sources
  attached.
- **Verification Queue Item**: A published record flagged for staleness, missing
  fields, or a broken source link.
- **Role Assignment**: A user's assigned role (Owner/Admin/Editor/
  Reviewer/Viewer) within the organization, governing which actions they may
  perform.
- **Audit Entry**: A record of one change to a catalog record — actor,
  timestamp, action, and before/after diff.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Zero draft or in-review records are ever visible on a
  consumer-facing page, verified continuously.
- **SC-002**: 100% of published records with a stale verification date, missing
  required field, or broken source link appear in the verification queue within
  one refresh cycle of becoming stale.
- **SC-003**: Every change to a catalog record has a corresponding audit entry
  with a complete before/after diff — zero unattributed changes.
- **SC-004**: A role-restricted action (e.g., Viewer attempting to publish) is
  denied 100% of the time across all sampled role/action combinations.
- **SC-005**: A manager can locate the source and verification date for any
  published record in under 10 seconds from its detail view.

## Assumptions

- Organizations and their members already exist as an identity model that this
  feature attaches roles to; account creation/authentication mechanics
  themselves are out of scope here.
- The default staleness threshold is 180 days per the platform plan, but is
  configurable by an Owner/Admin.
- Bilingual (`_vi`/`_en`) fields on catalog records are treated as ordinary
  required/optional fields for review-gate purposes and are not given separate
  workflow rules in this feature.
- This feature does not include the rule-authoring or test-recommendation
  tooling — those are covered in
  [009-recommendation-rules-authoring](../009-recommendation-rules-authoring/spec.md).

### Supporting artifacts (read in full)

The folder `docs/specs/008-catalog-management-workflow/` also contained these
files, read completely and treated as approved planning context (not restated
here so the analysis stays usable; they remain the source of truth on disk):

- `plan.md` — extends `apps/manager-dashboard` (currently an auth-scaffold
  shell) and `@windwise/db` (currently read-only for 005/007) with full CRUD;
  centralizes lifecycle/role checks in one `can-transition.ts`; no new shared
  package
- `research.md` — five decisions: better-auth organization plugin for roles;
  single shared `can-transition.ts`; same-transaction audit writes; verification
  queue as a read query (live staleness/missing-field checks,
  periodically-refreshed broken-source flag); optimistic concurrency
  (version/`updated_at`) for concurrent edits
- `data-model.md` — `OrganizationMember` (better-auth plugin, extended with a
  five-value role enum), `AuditLog` (new), `InstrumentModel` extended with
  `status`/`data_completeness`/`verified_by_user_id`, in-memory
  `VerificationQueueItem` and `AuditTrailEntry` shapes, and the full status
  transition diagram
- `quickstart.md` — eight end-to-end validation scenarios mapped to
  SC-001/002/003/004
- `checklists/` and `contracts/` — present but not the primary grounding for
  this conceptual pass; contracts/catalog-write.md defines the mutation surface
  referenced by quickstart.md

No existing SPDD analysis or prompt under this `work_item` was present.

---

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **`apps/manager-dashboard`**: A TanStack Start app that today is an
  auth-scaffold shell only — `src/lib/auth.ts` configures `better-auth` with
  just `emailAndPassword` and the TanStack Start cookie plugin; `src/routes/`
  has a single placeholder index route and the better-auth catch-all API route.
  This feature is the first to build real screens (catalog list, editor, review
  queue, verification queue, audit view, member settings) into this app.
- **`better-auth` session/auth scaffold**: Already wired for email/password
  sign-in and session cookies (`src/lib/auth.ts`, `src/lib/auth-client.ts`,
  `src/integrations/better-auth/header-user.tsx`). No organization, member, or
  role concept exists in the current configuration — the plugin referenced in
  plan.md/research.md §1 is not yet added.
- **Catalog domain tables (`brands`, `instrument_families`, `instrument_models`,
  `model_specs`, `model_images`, `sources`, `model_sources`)**: Named in
  plan.md/data-model.md as platform §3.2 tables that features 005 and 007
  already read from `@windwise/db`. No `packages/db` workspace member exists yet
  in this repo snapshot — the workspace currently has `packages/query`,
  `packages/ui`, `packages/vite-config` only. This feature is described as the
  first to need write access to these tables, but the schema package itself has
  not been scaffolded, so "existing" here means "existing as a documented
  contract from prior features' plans," not as code present today.
- **`@windwise/ui`**: The shared, domain-free component library (see
  004-ui-core-foundation) both apps consume; plan.md calls for reusing its
  "denser dashboard theme, same primitives" for catalog/review/queue/audit
  screens rather than inventing a parallel visual language.
- **TanStack Query / Router / Start conventions**: Already the app's data and
  routing layer per `apps/manager-dashboard`'s existing dependencies; plan.md
  designates server functions as the API layer and Query as the primary
  client-state mechanism for this feature's CRUD, optimistic status toggles, and
  invalidation-on-publish behavior.

#### New Concepts Required

- **Catalog record lifecycle (Draft → In Review → Published → Archived)**: A
  state machine gating consumer visibility of `instrument_models`. New as an
  enforced, code-level invariant — the tables it governs exist only as a
  read-only contract for 005/007 today; this feature introduces the `status`
  column semantics and the only legal paths between its values.
- **Role Assignment (Owner/Admin/Editor/Reviewer/Viewer)**: A per-user,
  per-organization role governing which lifecycle transitions and record
  mutations a user may perform. New — no organization/member/role concept exists
  in the current `better-auth` configuration; it is layered onto the existing
  session/auth scaffold via better-auth's organization plugin.
- **Verification Queue**: A derived, read-time view over published
  `instrument_models` (and their `sources`) surfacing staleness,
  missing-required-field, and broken-source conditions. New — no query, route,
  or "required field list" concept exists in the codebase yet; it depends on
  both the lifecycle (only published records are in scope) and a
  yet-to-be-defined canonical required-field list per entity type. The periodic
  source-liveness check that feeds the "broken source" reason is a new
  asynchronous concept as well.
- **Audit Entry / Audit Trail**: A per-mutation, transactionally-written record
  of actor, timestamp, action, and before/after diff, plus a chronological read
  view per catalog record. New — no audit/change-log table or write path exists
  anywhere in the current schema or app code.
- **Concurrent-edit conflict signal**: An optimistic-concurrency check (version
  or `updated_at` comparison) on catalog record writes. New — no versioning
  field or conflict-detection path exists on the current `instrument_models`
  contract; this feature introduces it purely to satisfy the spec's
  concurrent-edit edge case.
- **Organization/member/role identity layer on `better-auth`**: The extension of
  the existing scaffold with better-auth's organization plugin. New relative to
  the current auth configuration, though it builds directly on an existing
  dependency rather than introducing a new authentication system.

#### Key Business Rules

- **No path to "published" outside the reviewer gate** (governs Catalog record
  lifecycle, Role Assignment): a record can only become visible to consumers by
  passing through an explicit Reviewer-or-above approval of an in-review record;
  there is no direct draft→published or admin-bypass path described in the spec.
- **Role checks are evaluated live, never cached** (governs Role Assignment, all
  lifecycle transitions): a session started before a role change must be
  re-evaluated against the current role at the moment of each action, not a
  session-start snapshot.
- **Publish is blocked on incompleteness** (governs Catalog record lifecycle,
  Verification Queue): a record with any missing required field, or an image
  lacking credit/license information, cannot reach "published," and the system
  must identify what is missing rather than fail silently.
- **Every mutation produces exactly one audit entry with a real diff** (governs
  Audit Entry): create, edit, status transition, and archive each produce a
  chronological entry with actor, timestamp, and a before/after diff of only the
  fields that changed — no unattributed changes.
- **Archival is one-way unless explicitly reversed** (governs Catalog record
  lifecycle): a record does not un-archive itself when the condition that might
  justify archiving changes (e.g., a source URL starts resolving again);
  restoration is a distinct authorized action.
- **Verification queue reflects the current threshold, not the
  threshold-at-verification-time** (governs Verification Queue): changing the
  staleness threshold must change which currently-published records appear in
  the queue on next view, not only affect newly-verified records going forward.
- **Concurrent edits surface a conflict, never a silent overwrite** (governs
  Catalog record lifecycle): two editors saving the same draft record must not
  result in one save silently discarding the other's changes.

## Strategic Approach

#### Solution Direction

Treat this as the first real build-out of `apps/manager-dashboard` and the first
write path into the catalog schema, layered on infrastructure the platform has
already chosen rather than introduced fresh for this feature: extend the
existing `better-auth` scaffold with its organization plugin for roles, extend
`@windwise/db`'s catalog tables (currently read-only for 005/007) with
lifecycle/versioning/audit fields, and add the authoring/review/queue/audit
screens to the manager app using `@windwise/ui`'s existing dashboard primitives
and TanStack Query as the data layer. The lifecycle-and-role check is a single,
centrally-owned concept that every mutation path routes through, so "who can do
what to which state" is answered in one place rather than re-derived per screen
or per server function. Data flow at a conceptual level: an authenticated,
role-carrying session in `apps/manager-dashboard` initiates a catalog mutation →
the mutation is evaluated against the record's current status and the actor's
current role before anything is written → on success, the mutation and its audit
entry land together → consumer-facing surfaces (005/007) only ever observe
records that have crossed the "published" boundary.

#### Key Design Decisions

- **Roles as a better-auth organization-plugin extension vs. a fully independent
  roles/permissions system**: A custom system would duplicate identity/session
  wiring `better-auth` already owns → **extend the existing scaffold's
  organization plugin**, mapping the five fixed roles onto its member role
  field, since the spec's role set is fixed (not a custom-permission system) and
  the app already depends on `better-auth`.
- **Centralizing the lifecycle/role check vs. per-screen or per-endpoint
  checks**: Spec FR-002, FR-008, and FR-012 describe the same underlying
  invariant ("who may move state, right now") from different angles; scattering
  the check risks exactly the kind of silent drift a control plane over
  consumer-facing advice cannot tolerate → **one shared, always-current-state
  check that every mutation path calls**, so "evaluated against the current
  assignment" is true by construction rather than by discipline.
- **Audit writes as part of the same transaction as the mutation vs. a
  decoupled/asynchronous logging step**: SC-003 requires zero unattributed
  changes; a best-effort or queued audit write can fail independently of the
  mutation it describes → **same-transaction write**, treating "every change has
  a corresponding entry" as a data-integrity guarantee rather than an
  application-level convention.
- **Verification queue as a live read query vs. a precomputed/background job**:
  Staleness and missing-field checks are cheap, deterministic computations over
  already-loaded data, but source-URL liveness is an external network dependency
  that must not block a page load → **live query for staleness/completeness,
  periodically-refreshed flag for broken-source status**, keeping the queue
  responsive without making it synchronously dependent on third-party site
  availability.
- **Concurrency protection as optimistic (version/timestamp check) vs.
  pessimistic locking or real-time co-editing**: The spec's edge case only
  requires a conflict signal, not simultaneous collaborative editing →
  **optimistic concurrency**, avoiding lock-timeout/stuck-lock complexity the
  requirement never asked for.
- **Where lifecycle/authorization logic lives**: it governs catalog tables and
  is manager-app-specific business process that the consumer app will never call
  → **co-locate it with `@windwise/db`'s catalog schema**, rather than
  introducing a new shared package that would only ever have one consumer.

#### Alternatives Considered

- **Independent custom roles table, decoupled from `better-auth`**: Rejected —
  duplicates session/identity plumbing the app already has, and the organization
  plugin already models the org→member→role relationship the spec needs.
- **Per-route/per-endpoint inline role and transition checks**: Rejected — this
  is precisely the drift risk a review gate over consumer-facing data cannot
  absorb; a single shared check is the only way "current role, every time" is
  structurally guaranteed rather than hoped for.
- **Asynchronous/queued audit logging**: Rejected — reintroduces the exact
  failure mode (mutation succeeds, audit entry silently missing) the feature
  exists to eliminate, and is unwarranted complexity at the catalog's current
  scale.
- **Synchronous source-URL liveness check on every verification-queue page
  load**: Rejected — turns a dashboard read into a slow, flaky operation
  dependent on third-party site availability; the spec only requires broken
  sources to surface, not that they be checked in real time on every view.
- **Pessimistic row locking or real-time collaborative (CRDT-style) editing for
  concurrent drafts**: Rejected — the spec asks only for a conflict signal; both
  alternatives introduce operational complexity (lock management, or a
  materially larger editing architecture) the requirement does not scope in.
- **A new shared package for lifecycle/role/audit logic**: Rejected — this logic
  has exactly one consumer (`apps/manager-dashboard`); a shared package is
  unwarranted until a second consumer emerges, unlike `@windwise/ui` or a
  genuinely cross-app concern.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **"Required fields" is referenced but not enumerated**: FR-004, FR-006, and
  FR-009 all depend on a canonical list of which fields are required before a
  record can publish, but the spec never enumerates that list (nor does
  data-model.md — it defers to "a fixed required-field list per entity type"
  without naming it). This list must be agreed before the verification queue or
  the publish gate can be built.
- **"Reviewer's notes" on request-changes is unspecified as a durable concept**:
  US1 Acceptance Scenario 3 says a rejected in-review record "returns to draft
  with the reviewer's notes attached," but no key entity, FR, or data-model
  field represents where these notes live, whether they are visible to the
  editor only or to all roles, or whether they appear in the audit trail as
  their own entry type.
- **"Comment" for the Viewer role is mentioned once and not modeled**: FR-008
  and US3 Acceptance Scenario 1 state Viewers "can still read records and add
  comments," but there is no Key Entity, FR, or data-model shape for a comment —
  it is unclear if this is a lightweight annotation distinct from reviewer
  notes, or the same underlying concept.
- **Owner vs. Admin distinction is asserted but not differentiated**: FR-008 and
  US3 Acceptance Scenario 4 group Owner and Admin together for role management
  ("Owner or Admin... manage role assignments"), but nothing in the spec
  distinguishes what an Owner can do that an Admin cannot (or vice versa) —
  data-model.md's status-transition diagram also groups them identically
  ("Reviewer+/Admin+" for archive, "Admin+" for restore, omitting Owner
  explicitly in one branch).
- **"Configurable" staleness threshold — configurable by whom, at what scope**:
  FR-003 and the Edge Cases section say the threshold is configurable and must
  apply on next view, but the spec does not say whether it is a single
  organization-wide setting, a per-entity-type setting, or something else, nor
  who besides Owner/Admin (per Assumptions) can see or change it.

#### Edge Cases

- **A record archived while still in the verification queue**: the spec does not
  say whether archiving a flagged (stale/incomplete/broken-source) record
  removes it from the queue immediately, since the queue is scoped to "published
  records" — this interacts directly with FR-003's "published records" wording
  and needs confirming.
- **A role changed from Reviewer to Editor mid-review**: the spec's revoked-role
  edge case covers a "denied on next save," but doesn't address what happens to
  a record already sitting "in review" if the only person positioned to approve
  it loses reviewer standing — the record could become stuck if no other
  Reviewer/Owner/Admin exists in the organization.
- **An organization with no user in the Reviewer role**: nothing in the spec
  guarantees at least one Reviewer exists at any time, which could leave every
  in-review record permanently blocked from publishing; this is an operational
  gap the requirement doesn't address.
- **A broken-source flag flips back to healthy while a record is still
  published**: FR-005 says broken sources are surfaced in the queue; the spec
  doesn't say whether the queue entry disappears automatically once the source
  starts resolving again (unlike the archived-record case, which explicitly
  states archival does not auto-reverse) — an inconsistent auto-clear rule
  between "queue membership" and "archived status" would be confusing if not
  clarified.
- **Multiple simultaneous verification-queue reasons on one record**:
  data-model.md already anticipates a record appearing with more than one reason
  (stale + missing field, for example); the spec itself doesn't explicitly
  confirm this is allowed, only that each condition individually triggers
  inclusion — worth confirming it is intentional, not an oversight.

#### Technical Risks

- **`packages/db` does not exist yet in this repo**: plan.md and data-model.md
  describe catalog tables (`brands`, `instrument_models`, etc.) as if 005/007
  already established them, but no `packages/db` workspace member is present in
  the current monorepo (only `query`, `ui`, `vite-config` exist under
  `packages/`). This feature's actual starting point may be earlier in the stack
  than plan.md assumes — schema scaffolding itself, not just extension, could be
  in scope. This should be confirmed before design proceeds, since it changes
  the size of the work.
- **`better-auth` organization plugin is entirely unconfigured today**:
  `apps/manager-dashboard/src/lib/auth.ts` has no organization, member, or role
  setup — the five-role model, invitation flow, and role-check primitives all
  need to be added from a bare `emailAndPassword` + cookie-plugin baseline,
  which is a larger lift than "extend an existing role system." Regenerating
  `routeTree.gen.ts` and wiring new server functions correctly is a mechanical
  but easy-to-get-wrong step given the app currently has almost no routes.
- **Same-transaction audit writes require every mutation entry point to be
  disciplined**: if any future catalog mutation path is added without routing
  through the shared write function, the "zero unattributed changes" guarantee
  silently breaks; this is a process risk as much as a technical one and should
  be paired with a way to verify it (e.g., a single mutation entry point that
  nothing else may bypass).
- **Broken-source detection depends on an external, unreliable dependency**:
  periodic checks of third-party source URLs are inherently flaky (rate limits,
  transient outages, redirects); a naive "URL doesn't resolve" check could
  produce false positives that erode trust in the verification queue if not
  designed with retry/backoff or a grace-period rule.
- **Data-completeness and required-field logic must stay in sync across the
  publish gate, the verification queue, and the editor form**: if the "required
  field list" used to block publish (FR-009) and the one used to populate the
  verification queue (FR-004) drift apart in implementation, records could be
  blocked from publishing for reasons the queue doesn't show, or vice versa —
  this is a design risk to resolve as one shared source of truth, not two.

#### Acceptance Criteria Coverage

| AC#   | Description                                                                                                    | Addressable? | Gaps/Notes                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| US1.1 | Create/edit saves in "draft," not visible to consumers                                                         | Yes          | Depends on the lifecycle status field and consumer-surface read filters (005/007) excluding non-published records                          |
| US1.2 | Marking a draft ready moves it to "in review" and into a reviewer's queue                                      | Yes          | "Reviewer's queue" as a distinct view vs. a filtered catalog list is not specified — needs resolving in design                             |
| US1.3 | Reviewer approve publishes and exposes on consumer pages; request-changes returns to draft with notes attached | Partial      | Publish path is addressable; "reviewer's notes attached" has no modeled entity or storage location (see Ambiguities)                       |
| US1.4 | Archiving removes a published record from consumer pages but retains it for history                            | Yes          | Matches the lifecycle's terminal "archived" state and the audit trail's retention of history                                               |
| US2.1 | Records past the staleness threshold appear in the verification queue                                          | Yes          | Requires the configurable-threshold setting and its scope to be defined (see Ambiguities)                                                  |
| US2.2 | Records missing required fields appear in the queue with missing fields identified                             | Partial      | Requires the canonical required-field list to exist first (see Ambiguities) — mechanism is addressable once that list is defined           |
| US2.3 | Records with a non-resolving source URL appear flagged as broken source                                        | Yes          | Requires the periodic source-liveness check described in research.md §4; auto-clear behavior on recovery needs clarifying (see Edge Cases) |
| US2.4 | A current, complete record with a working source does not appear in the queue                                  | Yes          | Direct converse of US2.1–US2.3; addressable once those three checks are defined                                                            |
| US3.1 | Viewer denied edit/publish; can read and comment                                                               | Partial      | Role denial is addressable via the shared role check; "comment" has no modeled entity (see Ambiguities)                                    |
| US3.2 | Editor denied direct publish; can move draft → in review                                                       | Yes          | Directly maps to the lifecycle/role check's transition matrix                                                                              |
| US3.3 | Reviewer approving an in-review record publishes it successfully                                               | Yes          | Directly maps to the lifecycle/role check's transition matrix                                                                              |
| US3.4 | Owner/Admin managing role assignments takes effect immediately                                                 | Partial      | Addressable via live (non-cached) role checks; Owner-vs-Admin distinction is unresolved (see Ambiguities)                                  |
| US4.1 | Every change (create/edit/transition/archive) shows actor, timestamp, before/after diff in the audit trail     | Yes          | Directly maps to the same-transaction audit-write design decision                                                                          |
| US4.2 | A record's full history is viewable in chronological order                                                     | Yes          | Directly maps to the planned `audit-trail.ts` read query                                                                                   |

**Coverage summary**: 8 of 14 acceptance scenarios are cleanly addressable with
the strategic approach as described; 6 are partial pending clarification of the
required-field list, reviewer-notes storage, the comment concept, and the
Owner/Admin distinction — none of these gaps block the overall solution
direction, but each should be resolved before REASONS Canvas produces concrete
entity shapes.

Open questions / risks to carry into REASONS Canvas: canonical required-field
list per entity type; reviewer-notes and comment data shapes; Owner-vs-Admin
permission boundary; whether `packages/db` needs to be scaffolded from scratch
as part of this feature or is a true prerequisite; broken-source auto-clear
behavior; guarantee (or lack thereof) of at least one Reviewer per organization.
