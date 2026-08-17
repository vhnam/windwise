import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';

import { RoleSchema } from '@windwise/schemas';

import { getActorContext } from '#/lib/server/session.ts';

export const listOrganizationMembersFn = createServerFn({ method: 'GET' }).handler(async () => {
  const actor = await getActorContext();
  if (!actor) return [];

  const { getDb, organizationMembers } = await import('@windwise/db');
  return getDb().select().from(organizationMembers).where(eq(organizationMembers.organizationId, actor.organizationId));
});

export const updateMemberRoleFn = createServerFn({ method: 'POST' })
  .validator(v.object({ organizationId: v.string(), userId: v.string(), role: RoleSchema }))
  .handler(async ({ data }) => {
    const actor = await getActorContext();
    if (!actor) return { error: 'FORBIDDEN' } as const;

    const { getDb, organizationMembers } = await import('@windwise/db');
    const db = getDb();

    const [actorMembership] = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(eq(organizationMembers.userId, actor.userId), eq(organizationMembers.organizationId, data.organizationId)),
      )
      .limit(1);

    if (!actorMembership || (actorMembership.role !== 'owner' && actorMembership.role !== 'admin')) {
      return { error: 'FORBIDDEN' } as const;
    }

    await db
      .update(organizationMembers)
      .set({ role: data.role })
      .where(
        and(eq(organizationMembers.userId, data.userId), eq(organizationMembers.organizationId, data.organizationId)),
      );

    return { status: 'ok' } as const;
  });
