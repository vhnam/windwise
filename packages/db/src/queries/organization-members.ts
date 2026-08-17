import { and, eq } from 'drizzle-orm';

import type { Role, WriteResult } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { organizationMembers, user } from '#/schema/index.ts';

export type OrganizationMemberListItem = {
  id: string;
  userId: string;
  role: Role;
  displayName: string;
  email: string;
};

async function getCurrentRole(db: Database, actorUserId: string, orgId: string): Promise<Role | undefined> {
  const [member] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, actorUserId), eq(organizationMembers.organizationId, orgId)))
    .limit(1);
  return member?.role;
}

export async function listOrganizationMembers(db: Database, orgId: string): Promise<OrganizationMemberListItem[]> {
  const rows = await db
    .select({
      id: organizationMembers.id,
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      displayName: user.name,
      email: user.email,
    })
    .from(organizationMembers)
    .innerJoin(user, eq(organizationMembers.userId, user.id))
    .where(eq(organizationMembers.organizationId, orgId));

  return rows;
}

export async function updateOrganizationMemberRole(
  db: Database,
  actorUserId: string,
  orgId: string,
  userId: string,
  role: Role,
): Promise<WriteResult<{ userId: string; role: Role }>> {
  const actorRole = await getCurrentRole(db, actorUserId, orgId);
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return { ok: false, reason: 'role-denied' };
  }

  await db
    .update(organizationMembers)
    .set({ role })
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, orgId)));

  return { ok: true, value: { userId, role } };
}
