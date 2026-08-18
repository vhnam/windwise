# `@windwise/schemas`

Valibot shapes shared by apps and packages. No database I/O and no React.

Exports include catalog browsing, catalog management (`Role`,
`VerificationQueueItem`, `AuditTrailEntry`, `CommentListItem`, write-error
reasons), criteria, recommendation, comparison, and pricing.

Workflow: [AGENTS.md](../../AGENTS.md).

## Usage

```ts
import { ModelStatusSchema, type Role } from "@windwise/schemas";
```

Subpath exports: `@windwise/schemas/criteria`, `@windwise/schemas/catalog`,
`@windwise/schemas/recommendation`.

## Scripts

From the repo root:

```bash
vp -C packages/schemas test
vp -C packages/schemas check
```
