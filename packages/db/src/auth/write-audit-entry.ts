import { randomUUID } from 'node:crypto';

import type { AuditAction } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { auditLogs } from '#/schema/index.ts';

type Transaction = Pick<Database, 'insert'>;

function changedFieldsOnly(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): { before: Record<string, unknown> | null; after: Record<string, unknown> | null } {
  if (!before || !after) {
    return { before, after };
  }

  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const key of Object.keys(after)) {
    if (before[key] !== after[key]) {
      changedBefore[key] = before[key];
      changedAfter[key] = after[key];
    }
  }
  return { before: changedBefore, after: changedAfter };
}

export async function writeAuditEntry(
  tx: Transaction,
  actorUserId: string,
  entity: string,
  entityId: string,
  action: AuditAction,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): Promise<void> {
  const changed = changedFieldsOnly(before, after);

  await tx.insert(auditLogs).values({
    id: randomUUID(),
    actorUserId,
    entity,
    entityId,
    action,
    before: changed.before,
    after: changed.after,
    at: new Date(),
  });
}
