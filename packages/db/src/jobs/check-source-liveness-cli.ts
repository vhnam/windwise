/**
 * Manual / cron entry point for source URL liveness checks.
 *
 * Usage (from repo root):
 *   vp -C packages/db run db:check-sources
 *
 * Optional env:
 *   SOURCE_IDS=uuid1,uuid2  — limit the run to specific source rows
 *
 * Do not call `checkSourceLiveness` from dashboard page loads; wire this CLI
 * (or an equivalent scheduled runner) instead.
 */
import { createDb, createPostgresClient } from '#/client.ts';
import { dbEnv } from '#/env.ts';
import { checkSourceLiveness } from '#/jobs/check-source-liveness.ts';

const client = createPostgresClient(dbEnv.DATABASE_URL);
const db = createDb(dbEnv.DATABASE_URL, client);

const sourceIds = process.env.SOURCE_IDS?.split(',')
  .map((id) => id.trim())
  .filter(Boolean);

try {
  await checkSourceLiveness(db, sourceIds?.length ? sourceIds : undefined);
  console.log(
    sourceIds?.length
      ? `Source liveness check complete for ${sourceIds.length} source(s)`
      : 'Source liveness check complete for all sources',
  );
} finally {
  await client.end({ timeout: 5 });
}
