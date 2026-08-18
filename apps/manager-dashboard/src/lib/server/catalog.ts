import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';

import { LevelTierSchema, ModelStatusSchema, PriceScopeSchema, SourceKindSchema } from '@windwise/schemas';

import { getActorContext } from '#/lib/server/session.ts';

const FORBIDDEN = { error: 'FORBIDDEN' } as const;
const UNAUTHENTICATED = { error: 'FORBIDDEN' } as const;

export const listCatalogRecordsFn = createServerFn({ method: 'GET' })
  .validator(
    v.object({
      status: v.optional(ModelStatusSchema),
      page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
      pageSize: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100))),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb, instrumentModels } = await import('@windwise/db');
    const { asc, count, eq } = await import('drizzle-orm');
    const db = getDb();
    const statusFilter = data.status ? eq(instrumentModels.status, data.status) : undefined;

    const [{ totalCount }] = await db.select({ totalCount: count() }).from(instrumentModels).where(statusFilter);
    const shouldPaginate = data.page !== undefined || data.pageSize !== undefined;
    const pageSize = shouldPaginate ? (data.pageSize ?? 20) : Math.max(totalCount, 1);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const page = shouldPaginate ? Math.min(data.page ?? 1, totalPages) : 1;

    const items = await db
      .select()
      .from(instrumentModels)
      .where(statusFilter)
      .orderBy(asc(instrumentModels.displayName), asc(instrumentModels.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { items, totalCount, page, pageSize };
  });

export const getInstrumentRecordFn = createServerFn({ method: 'GET' })
  .validator(v.object({ modelId: v.string() }))
  .handler(async ({ data }) => {
    const { getDb, instrumentModels, modelImages, pricePoints, sources } = await import('@windwise/db');
    const db = getDb();
    const [row] = await db.select().from(instrumentModels).where(eq(instrumentModels.id, data.modelId)).limit(1);
    if (!row) return null;

    const [price] = await db
      .select()
      .from(pricePoints)
      .where(and(eq(pricePoints.modelId, data.modelId), eq(pricePoints.isCurrent, true)))
      .limit(1);
    const [primaryImage] = await db
      .select()
      .from(modelImages)
      .where(and(eq(modelImages.modelId, data.modelId), eq(modelImages.isPrimary, true)))
      .limit(1);
    const [source] = await db.select().from(sources).where(eq(sources.modelId, data.modelId)).limit(1);

    return { ...row, price: price ?? null, primaryImage: primaryImage ?? null, source: source ?? null };
  });

export const listBrandsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getDb, brands } = await import('@windwise/db');
  const { asc } = await import('drizzle-orm');
  return getDb().select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name));
});

export const listFamiliesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getDb, instrumentFamilies } = await import('@windwise/db');
  const { asc } = await import('drizzle-orm');
  return getDb()
    .select({ id: instrumentFamilies.id, name: instrumentFamilies.nameEn })
    .from(instrumentFamilies)
    .orderBy(asc(instrumentFamilies.nameEn));
});

const CatalogPriceInputSchema = v.object({
  scope: PriceScopeSchema,
  amountMin: v.pipe(v.number(), v.minValue(0)),
  amountMax: v.pipe(v.number(), v.minValue(0)),
});

const CatalogImageUrlSchema = v.pipe(
  v.string(),
  v.trim(),
  v.union([v.pipe(v.string(), v.startsWith('data:image/')), v.pipe(v.string(), v.url())]),
);

const CatalogImageInputSchema = v.object({
  url: CatalogImageUrlSchema,
  altEn: v.string(),
  altVi: v.optional(v.string()),
  credit: v.string(),
  licenseNote: v.optional(v.string()),
});

const CatalogSourceInputSchema = v.object({
  kind: SourceKindSchema,
  url: v.pipe(v.string(), v.url()),
  publisher: v.string(),
});

const CatalogRelatedInputSchema = {
  price: v.optional(CatalogPriceInputSchema),
  primaryImage: v.optional(CatalogImageInputSchema),
  source: v.optional(CatalogSourceInputSchema),
};

export const createInstrumentRecordFn = createServerFn({ method: 'POST' })
  .validator(
    v.object({
      brandId: v.string(),
      familyId: v.string(),
      modelCode: v.string(),
      displayName: v.string(),
      levelTier: LevelTierSchema,
      ...CatalogRelatedInputSchema,
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
          ...CatalogRelatedInputSchema,
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
    return { status: 'ok', version: data.expectedVersion + 1 } as const;
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

export const listCommentsFn = createServerFn({ method: 'GET' })
  .validator(v.object({ modelId: v.string() }))
  .handler(async ({ data }) => {
    const actor = await getActorContext();
    if (!actor) return { items: [] };

    const { getDb, listComments } = await import('@windwise/db');
    const items = await listComments(getDb(), data.modelId);
    return { items };
  });

export const addCommentFn = createServerFn({ method: 'POST' })
  .validator(
    v.object({
      modelId: v.string(),
      body: v.pipe(v.string(), v.trim(), v.minLength(1)),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await getActorContext();
    if (!actor) return UNAUTHENTICATED;

    const { getDb, addComment } = await import('@windwise/db');
    const result = await addComment(getDb(), actor.userId, actor.organizationId, data.modelId, data.body);
    if (!result.ok) {
      if (result.reason === 'invalid-input') return { error: 'INVALID_INPUT' } as const;
      return FORBIDDEN;
    }
    return { status: 'ok', comment: result.value } as const;
  });
