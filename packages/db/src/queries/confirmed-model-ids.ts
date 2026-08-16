import { eq } from 'drizzle-orm';

import type { Database } from '#/client.ts';
import { confirmedReferences } from '#/schema/index.ts';

export async function confirmedModelIds(db: Database, sessionId: string): Promise<Set<string>> {
  const rows = await db
    .select({ modelId: confirmedReferences.modelId })
    .from(confirmedReferences)
    .where(eq(confirmedReferences.sessionId, sessionId));

  return new Set(rows.map((row) => row.modelId));
}
