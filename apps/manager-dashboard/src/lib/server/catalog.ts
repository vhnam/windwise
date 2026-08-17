import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

import { LevelTierSchema, ModelStatusSchema } from '@windwise/schemas';

import { getActorContext } from '#/lib/server/session.ts';

const FORBIDDEN = { error: 'FORBIDDEN' } as const;
const UNAUTHENTICATED = { error: 'FORBIDDEN' } as const;

export const listCatalogRecordsFn = createServerFn({ method: 'GET' })
  .validator(v.object({ status: v.optional(ModelStatusSchema) }))
  .handler(async ({ data }) => {
    const { getDb, instrumentModels } = await import('@windwise/db');
    const db = getDb();
    const rows = data.status
      ? await db.select().from(instrumentModels).where(eq(instrumentModels.status, data.status))
      : await db.select().from(instrumentModels);
    return rows;
  });

export const getInstrumentRecordFn = createServerFn({ method: 'GET' })
  .validator(v.object({ modelId: v.string() }))
  .handler(async ({ data }) => {
    const { getDb, instrumentModels } = await import('@windwise/db');
    const [row] = await getDb().select().from(instrumentModels).where(eq(instrumentModels.id, data.modelId)).limit(1);
    return row ?? null;
  });

export const createInstrumentRecordFn = createServerFn({ method: 'POST' })
  .validator(
    v.object({
      brandId: v.string(),
      familyId: v.string(),
      modelCode: v.string(),
      displayName: v.string(),
      levelTier: LevelTierSchema,
    }),
  )
  .handler(async ({ data }) => {
    const actor = await getActorContext();
    if (!actor) return UNAUTHENTICATED;

    const { getDb, createInstrumentModel } = await import('@windwise/db');
    const result = await createInstrumentModel(getDb(), actor.userId, actor.organizationId, data);
    if (!result.ok) return FORBIDDEN;
    return { modelId: result.value.id, status: result.value.status };
  });

export const editInstrumentRecordFn = createServerFn({ method: 'POST' })
  .validator(
    v.object({
      modelId: v.string(),
      expectedVersion: v.number(),
      changes: v.partial(
        v.object({
          brandId: v.string(),
          familyId: v.string(),
          modelCode: v.string(),
          displayName: v.string(),
          levelTier: LevelTierSchema,
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await getActorContext();
    if (!actor) return UNAUTHENTICATED;

    const { getDb, editInstrumentModel } = await import('@windwise/db');
    const result = await editInstrumentModel(
      getDb(),
      actor.userId,
      actor.organizationId,
      data.modelId,
      data.expectedVersion,
      data.changes,
    );
    if (!result.ok) {
      if (result.reason === 'conflict') return { error: 'CONFLICT', currentVersion: result.currentVersion } as const;
      return FORBIDDEN;
    }
    return { status: 'ok' } as const;
  });

export const transitionStatusFn = createServerFn({ method: 'POST' })
  .validator(
    v.object({
      modelId: v.string(),
      expectedVersion: v.number(),
      targetStatus: v.picklist(['in_review', 'published', 'draft', 'archived']),
      note: v.optional(v.string()),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await getActorContext();
    if (!actor) return UNAUTHENTICATED;

    const { getDb, transitionInstrumentModel, archiveInstrumentModel } = await import('@windwise/db');
    const db = getDb();

    const result =
      data.targetStatus === 'archived'
        ? await archiveInstrumentModel(db, actor.userId, actor.organizationId, data.modelId, data.expectedVersion)
        : await transitionInstrumentModel(
            db,
            actor.userId,
            actor.organizationId,
            data.modelId,
            data.expectedVersion,
            data.targetStatus,
            data.note,
          );

    if (!result.ok) {
      if (result.reason === 'conflict') return { error: 'CONFLICT', currentVersion: result.currentVersion } as const;
      if (result.reason === 'missing-fields')
        return { error: 'MISSING_REQUIRED_FIELDS', fields: result.fields } as const;
      return FORBIDDEN;
    }
    return { status: 'ok', newStatus: result.value.status } as const;
  });

export const getVerificationQueueFn = createServerFn({ method: 'GET' }).handler(async () => {
  const actor = await getActorContext();
  if (!actor) return { items: [] };

  const { getDb, getVerificationQueue } = await import('@windwise/db');
  const items = await getVerificationQueue(getDb(), actor.organizationId);
  return { items };
});

export const getAuditTrailFn = createServerFn({ method: 'GET' })
  .validator(v.object({ entity: v.string(), entityId: v.string() }))
  .handler(async ({ data }) => {
    const { getDb, getAuditTrail } = await import('@windwise/db');
    const entries = await getAuditTrail(getDb(), data.entity, data.entityId);
    return { entries };
  });
