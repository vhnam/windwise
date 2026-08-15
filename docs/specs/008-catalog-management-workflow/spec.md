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
