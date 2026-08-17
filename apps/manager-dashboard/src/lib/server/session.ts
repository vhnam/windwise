import { getRequest } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm';

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

  const [member] = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id))
    .limit(1);

  if (!member) {
    return null;
  }

  return { userId: session.user.id, organizationId: member.organizationId, role: member.role };
}
