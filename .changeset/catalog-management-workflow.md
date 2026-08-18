---
"@windwise/db": minor
"@windwise/schemas": minor
"@windwise/ui": minor
"@windwise/manager-dashboard": minor
---

Add the catalog management workflow: a server-enforced Draft → In Review →
Published → Archived lifecycle for instrument records, gated by a five-role
model (Owner/Admin/Editor/Reviewer/Viewer), with a verification queue for
stale/incomplete/broken-source records and a same-transaction audit trail for
every write. `@windwise/db` gains its first write path into the catalog tables
(`createInstrumentModel`, `editInstrumentModel`, `transitionInstrumentModel`,
`archiveInstrumentModel`, plus related price/image/source upserts or deletes
when a patch sends `null`), `getVerificationQueue`, `getAuditTrail`,
`getCatalogSettings`, `updateCatalogSettings`, `listOrganizationMembers`,
`updateOrganizationMemberRole`, `listComments`, `addComment`, and `auth/`
helpers (`canTransition`, `required-fields`, `writeAuditEntry`); new
`organization_members`, `audit_logs`, `catalog_settings`, and `comments` tables;
Better Auth Drizzle tables (`user`, `session`, `account`, `verification`,
`organization`, `member`, `invitation`) with UUID ids; a local seed for the
WindWise org owner (`admin@windwise.io`); and a manual/cron `db:check-sources`
entry point for `checkSourceLiveness`. `@windwise/schemas` gains
`VerificationQueueItem` / `AuditTrailEntry` / `CommentListItem` / `Role` shapes,
shared catalog filter tuples, and `WriteError` reasons including
`invalid-input`. `@windwise/ui` adds generic `Attachment`, `Pagination`, and
`Empty` primitives. `@windwise/manager-dashboard` gains its first real screens
beyond the auth scaffold: sign-in / password reset (Better Auth organization
plugin + Drizzle adapter, email sign-up disabled), actor context from
`session.activeOrganizationId` (or a unique membership), catalog and audit reads
that require org membership, a paged catalog list, Formisch Content Manager
editor (comments, admin restore from archive, clearing price/image/ source
deletes related rows), reviewer queue, verification queue, paginated audit
history, and member role / staleness settings, with sticky page headers and
role-gated empty states.
