import { and, eq } from 'drizzle-orm';

import type { Role, WriteResult } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { catalogSettings, organizationMembers } from '#/schema/index.ts';

const DEFAULT_STALENESS_THRESHOLD_DAYS = 180;

async function getCurrentRole(db: Database, actorUserId: string, orgId: string): Promise<Role | undefined> {
  const [member] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, actorUserId), eq(organizationMembers.organizationId, orgId)))
    .limit(1);
  return member?.role;
}

export async function getCatalogSettings(db: Database, orgId: string): Promise<{ stalenessThresholdDays: number }> {
  const [row] = await db
    .select({ stalenessThresholdDays: catalogSettings.stalenessThresholdDays })
    .from(catalogSettings)
    .where(eq(catalogSettings.organizationId, orgId))
    .limit(1);

  return { stalenessThresholdDays: row?.stalenessThresholdDays ?? DEFAULT_STALENESS_THRESHOLD_DAYS };
}

export async function updateCatalogSettings(
  db: Database,
  actorUserId: string,
  orgId: string,
  stalenessThresholdDays: number,
): Promise<WriteResult<{ stalenessThresholdDays: number }>> {
  const role = await getCurrentRole(db, actorUserId, orgId);
  if (role !== 'owner' && role !== 'admin') {
    return { ok: false, reason: 'role-denied' };
  }

  await db.insert(catalogSettings).values({ organizationId: orgId, stalenessThresholdDays }).onConflictDoUpdate({
    target: catalogSettings.organizationId,
    set: { stalenessThresholdDays },
  });

  return { ok: true, value: { stalenessThresholdDays } };
}
