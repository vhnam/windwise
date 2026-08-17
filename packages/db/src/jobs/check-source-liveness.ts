import { eq, inArray } from 'drizzle-orm';

import type { Database } from '#/client.ts';
import { sources } from '#/schema/index.ts';

const CHECK_TIMEOUT_MS = 5000;

async function isReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return response.ok || (response.status >= 300 && response.status < 400);
  } catch {
    return false;
  }
}

export async function checkSourceLiveness(db: Database, sourceIds?: string[]): Promise<void> {
  const rows = sourceIds
    ? await db.select().from(sources).where(inArray(sources.id, sourceIds))
    : await db.select().from(sources);

  const now = new Date();

  for (const row of rows) {
    // Require two consecutive failed attempts before flagging a source broken,
    // to avoid a single transient network blip eroding trust in the queue.
    const firstAttempt = await isReachable(row.url);
    const reachable = firstAttempt || (await isReachable(row.url));

    await db.update(sources).set({ sourceOk: reachable, lastCheckedAt: now }).where(eq(sources.id, row.id));
  }
}
