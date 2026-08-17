import { and, asc, eq } from 'drizzle-orm';

import type { AuditTrailEntry } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { auditLogs } from '#/schema/index.ts';

export async function getAuditTrail(db: Database, entity: string, entityId: string): Promise<AuditTrailEntry[]> {
  const rows = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entity, entity), eq(auditLogs.entityId, entityId)))
    .orderBy(asc(auditLogs.at));

  return rows.map((row) => {
    const before = (row.before as Record<string, unknown> | null) ?? {};
    const after = (row.after as Record<string, unknown> | null) ?? {};
    const fields = new Set([...Object.keys(before), ...Object.keys(after)]);

    return {
      actorUserId: row.actorUserId,
      actorDisplayName: row.actorUserId,
      action: row.action,
      at: row.at.toISOString(),
      diff: [...fields].map((field) => ({ field, before: before[field], after: after[field] })),
    };
  });
}
