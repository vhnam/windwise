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
`archiveInstrumentModel`, plus related price/image/source upserts,
`getVerificationQueue`, `getAuditTrail`, `getCatalogSettings`,
`listOrganizationMembers`, `canTransition`) plus new `organization_members`,
`audit_logs`, `catalog_settings`, and `comments` tables; Better Auth Drizzle
tables (`user`, `session`, `account`, `verification`, `organization`, `member`,
`invitation`) with UUID ids; and a local seed for the WindWise org owner
(`admin@windwise.io`). `@windwise/schemas` gains
`VerificationQueueItem`/`AuditTrailEntry`/`Role` shapes and shared catalog
filter tuples. `@windwise/ui` adds generic `Attachment`, `Pagination`, and
`Empty` primitives. `@windwise/manager-dashboard` gains its first real screens
beyond the auth scaffold: sign-in / password reset (with Better Auth
organization plugin + Drizzle adapter schema wiring), a paged catalog list,
Formisch Content Manager editor, reviewer queue, verification queue, paginated
audit history, and member role settings, with sticky page headers and role-gated
empty states.
