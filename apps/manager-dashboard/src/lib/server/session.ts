import { getRequest } from '@tanstack/react-start/server';
import { and, eq } from 'drizzle-orm';

import type { Role } from '@windwise/schemas';

import { auth } from '#/lib/auth.ts';

export type ActorContext = { userId: string; organizationId: string; role: Role };

export async function getActorContext(): Promise<ActorContext | null> {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return null;
  }

  const { getDb, organizationMembers } = await import('@windwise/db');
  const db = getDb();
  const userId = session.user.id;
  const activeOrganizationId = session.session.activeOrganizationId;

  if (activeOrganizationId) {
    const [member] = await db
      .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, activeOrganizationId)))
      .limit(1);

    if (!member) {
      return null;
    }

    return { userId, organizationId: member.organizationId, role: member.role };
  }

  const memberships = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))
    .limit(2);

  const [onlyMembership] = memberships;
  if (!onlyMembership || memberships.length !== 1) {
    return null;
  }

  return { userId, organizationId: onlyMembership.organizationId, role: onlyMembership.role };
}
