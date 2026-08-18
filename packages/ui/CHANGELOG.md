# @windwise/ui

## 0.4.0

### Minor Changes

- a1ebfef: Add the catalog management workflow: a server-enforced Draft → In
  Review → Published → Archived lifecycle for instrument records, gated by a
  five-role model (Owner/Admin/Editor/Reviewer/Viewer), with a verification
  queue for stale/incomplete/broken-source records and a same-transaction audit
  trail for every write. `@windwise/db` gains its first write path into the
  catalog tables (`createInstrumentModel`, `editInstrumentModel`,
  `transitionInstrumentModel`, `archiveInstrumentModel`, plus related
  price/image/source upserts or deletes when a patch sends `null`),
  `getVerificationQueue`, `getAuditTrail`, `getCatalogSettings`,
  `updateCatalogSettings`, `listOrganizationMembers`,
  `updateOrganizationMemberRole`, `listComments`, `addComment`, and `auth/`
  helpers (`canTransition`, `required-fields`, `writeAuditEntry`); new
  `organization_members`, `audit_logs`, `catalog_settings`, and `comments`
  tables; Better Auth Drizzle tables (`user`, `session`, `account`,
  `verification`, `organization`, `member`, `invitation`) with UUID ids; a local
  seed for the WindWise org owner (`admin@windwise.io`); and a manual/cron
  `db:check-sources` entry point for `checkSourceLiveness`. `@windwise/schemas`
  gains `VerificationQueueItem` / `AuditTrailEntry` / `CommentListItem` / `Role`
  shapes, shared catalog filter tuples, and `WriteError` reasons including
  `invalid-input`. `@windwise/ui` adds generic `Attachment`, `Pagination`, and
  `Empty` primitives. `@windwise/manager-dashboard` gains its first real screens
  beyond the auth scaffold: sign-in / password reset (Better Auth organization
  plugin + Drizzle adapter, email sign-up disabled), actor context from
  `session.activeOrganizationId` (or a unique membership), catalog and audit
  reads that require org membership, a paged catalog list, Formisch Content
  Manager editor (comments, admin restore from archive, clearing price/image/
  source deletes related rows), reviewer queue, verification queue, paginated
  audit history, and member role / staleness settings, with sticky page headers
  and role-gated empty states.

## 0.3.0

### Minor Changes

- 5cd17c4: Add published catalog listing and instrument detail pages with
  family/facet filters, shared Breadcrumb primitives, and catalog query/schema
  helpers for browseable models, variants, and street-price ranges.

## 0.2.1

### Patch Changes

- 47d6187: Make Questionnaire navigation button size and variant optional,
  matching their defaults.

## 0.2.0

### Minor Changes

- Expose shadcn package exports, aliases, and fonts so apps can import the
  shared stylesheet, utils, and primitives.
