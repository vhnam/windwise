import { createServerFn } from '@tanstack/react-start';
import * as v from 'valibot';

import { RoleSchema } from '@windwise/schemas';

import { getActorContext } from '#/lib/server/session.ts';

const FORBIDDEN = { error: 'FORBIDDEN' } as const;

export const listOrganizationMembersFn = createServerFn({ method: 'GET' }).handler(async () => {
  const actor = await getActorContext();
  if (!actor) return [];

  const { getDb, listOrganizationMembers } = await import('@windwise/db');
  return listOrganizationMembers(getDb(), actor.organizationId);
});

export const updateMemberRoleFn = createServerFn({ method: 'POST' })
  .validator(v.object({ userId: v.string(), role: RoleSchema }))
  .handler(async ({ data }) => {
    const actor = await getActorContext();
    if (!actor) return FORBIDDEN;

    const { getDb, updateOrganizationMemberRole } = await import('@windwise/db');
    const result = await updateOrganizationMemberRole(
      getDb(),
      actor.userId,
      actor.organizationId,
      data.userId,
      data.role,
    );
    if (!result.ok) return FORBIDDEN;
    return { status: 'ok' } as const;
  });

export const getCatalogSettingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const actor = await getActorContext();
  if (!actor) return { stalenessThresholdDays: 180 };

  const { getDb, getCatalogSettings } = await import('@windwise/db');
  return getCatalogSettings(getDb(), actor.organizationId);
});

export const updateCatalogSettingsFn = createServerFn({ method: 'POST' })
  .validator(
    v.object({
      stalenessThresholdDays: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(3650)),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await getActorContext();
    if (!actor) return FORBIDDEN;

    const { getDb, updateCatalogSettings } = await import('@windwise/db');
    const result = await updateCatalogSettings(
      getDb(),
      actor.userId,
      actor.organizationId,
      data.stalenessThresholdDays,
    );
    if (!result.ok) return FORBIDDEN;
    return { status: 'ok', stalenessThresholdDays: result.value.stalenessThresholdDays } as const;
  });
