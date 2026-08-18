import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type { InstrumentModel, LifecycleStatus, PriceScope, Role, SourceKind, WriteResult } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { instrumentModels, modelImages, organizationMembers, pricePoints, sources } from '#/schema/index.ts';

import { canTransition } from '../auth/can-transition';
import { computeDataCompleteness, computeMissingFields } from '../auth/required-fields';
import { writeAuditEntry } from '../auth/write-audit-entry';

export type CatalogPriceInput = {
  scope: PriceScope;
  amountMin: number;
  amountMax: number;
};

export type CatalogImageInput = {
  url: string;
  altEn: string;
  altVi?: string;
  credit: string;
  licenseNote?: string;
};

export type CatalogSourceInput = {
  kind: SourceKind;
  url: string;
  publisher: string;
};

export type CatalogRelatedInput = {
  price?: CatalogPriceInput | null;
  primaryImage?: CatalogImageInput | null;
  source?: CatalogSourceInput | null;
};

export type CreateInstrumentModelInput = {
  brandId: string;
  familyId: string;
  modelCode: string;
  displayName: string;
  levelTier: InstrumentModel['levelTier'];
} & CatalogRelatedInput;

export type EditInstrumentModelPatch = Partial<
  Pick<CreateInstrumentModelInput, 'brandId' | 'familyId' | 'modelCode' | 'displayName' | 'levelTier'>
> &
  CatalogRelatedInput & { status?: never };

function toInstrumentModel(row: typeof instrumentModels.$inferSelect): InstrumentModel {
  return {
    id: row.id,
    brandId: row.brandId,
    familyId: row.familyId,
    modelCode: row.modelCode,
    displayName: row.displayName,
    levelTier: row.levelTier,
    status: row.status,
    lastVerifiedAt: row.lastVerifiedAt.toISOString(),
    variantOfModelId: row.variantOfModelId,
    sourceUrl: '',
  };
}

async function getCurrentRole(db: Database, actorUserId: string, orgId: string): Promise<Role | undefined> {
  const [member] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, actorUserId), eq(organizationMembers.organizationId, orgId)))
    .limit(1);
  return member?.role;
}

type RelatedIds = {
  currentPrice: { id: string } | undefined;
  primaryImage: { id: string } | undefined;
  source: { id: string } | undefined;
};

async function getRelated(db: Database, modelId: string): Promise<RelatedIds> {
  const [currentPrice] = await db
    .select({ id: pricePoints.id })
    .from(pricePoints)
    .where(and(eq(pricePoints.modelId, modelId), eq(pricePoints.isCurrent, true)))
    .limit(1);
  const [primaryImage] = await db
    .select({ id: modelImages.id })
    .from(modelImages)
    .where(and(eq(modelImages.modelId, modelId), eq(modelImages.isPrimary, true)))
    .limit(1);
  const [source] = await db.select({ id: sources.id }).from(sources).where(eq(sources.modelId, modelId)).limit(1);
  return { currentPrice, primaryImage, source };
}

function completenessFrom(
  model: {
    brandId: string | null;
    familyId: string | null;
    modelCode: string | null;
    displayName: string | null;
  },
  related: { hasCurrentPrice: boolean; hasPrimaryImage: boolean; hasSource: boolean },
) {
  const record = {
    brandId: model.brandId,
    familyId: model.familyId,
    modelCode: model.modelCode,
    displayName: model.displayName,
    hasCurrentPrice: related.hasCurrentPrice,
    hasPrimaryImage: related.hasPrimaryImage,
    hasSource: related.hasSource,
  };

  return {
    dataCompleteness: computeDataCompleteness(record),
    missing: computeMissingFields('instrument_model', record),
  };
}

function hasRelatedValue<T>(existing: { id: string } | undefined, next: T | null | undefined): boolean {
  if (next === null) return false;
  return Boolean(existing || next);
}

async function upsertRelated(
  tx: Pick<Database, 'insert' | 'update' | 'delete'>,
  modelId: string,
  existing: RelatedIds,
  input: CatalogRelatedInput,
) {
  if (input.price === null && existing.currentPrice) {
    await tx.delete(pricePoints).where(eq(pricePoints.id, existing.currentPrice.id));
  } else if (input.price) {
    const values = {
      scope: input.price.scope,
      amountMin: String(input.price.amountMin),
      amountMax: String(input.price.amountMax),
      isCurrent: true,
    };
    if (existing.currentPrice) {
      await tx.update(pricePoints).set(values).where(eq(pricePoints.id, existing.currentPrice.id));
    } else {
      await tx.insert(pricePoints).values({ id: randomUUID(), modelId, ...values });
    }
  }

  if (input.primaryImage === null && existing.primaryImage) {
    await tx.delete(modelImages).where(eq(modelImages.id, existing.primaryImage.id));
  } else if (input.primaryImage) {
    const values = {
      url: input.primaryImage.url,
      altEn: input.primaryImage.altEn,
      altVi: input.primaryImage.altVi ?? input.primaryImage.altEn,
      credit: input.primaryImage.credit,
      licenseNote: input.primaryImage.licenseNote ?? 'Used with permission',
      isPrimary: true,
      sortOrder: 0,
    };
    if (existing.primaryImage) {
      await tx.update(modelImages).set(values).where(eq(modelImages.id, existing.primaryImage.id));
    } else {
      await tx.insert(modelImages).values({ id: randomUUID(), modelId, ...values });
    }
  }

  if (input.source === null && existing.source) {
    await tx.delete(sources).where(eq(sources.id, existing.source.id));
  } else if (input.source) {
    const values = {
      kind: input.source.kind,
      url: input.source.url,
      publisher: input.source.publisher,
      retrievedAt: new Date(),
      isPrimary: true,
    };
    if (existing.source) {
      await tx.update(sources).set(values).where(eq(sources.id, existing.source.id));
    } else {
      await tx.insert(sources).values({ id: randomUUID(), modelId, ...values });
    }
  }
}

async function computeCompleteness(
  db: Database,
  model: {
    brandId: string | null;
    familyId: string | null;
    modelCode: string | null;
    displayName: string | null;
    id: string;
  },
): Promise<{ dataCompleteness: number; missing: string[] }> {
  const related = await getRelated(db, model.id);
  return completenessFrom(model, {
    hasCurrentPrice: Boolean(related.currentPrice),
    hasPrimaryImage: Boolean(related.primaryImage),
    hasSource: Boolean(related.source),
  });
}

export async function createInstrumentModel(
  db: Database,
  actorUserId: string,
  orgId: string,
  input: CreateInstrumentModelInput,
): Promise<WriteResult<InstrumentModel>> {
  const role = await getCurrentRole(db, actorUserId, orgId);
  if (!role || (role !== 'editor' && role !== 'reviewer' && role !== 'admin' && role !== 'owner')) {
    return { ok: false, reason: 'role-denied' };
  }

  const id = randomUUID();
  const now = new Date();

  const row = {
    id,
    brandId: input.brandId,
    familyId: input.familyId,
    modelCode: input.modelCode,
    displayName: input.displayName,
    levelTier: input.levelTier,
    status: 'draft' as const,
    lastVerifiedAt: now,
    variantOfModelId: null,
    dataCompleteness: 0,
    verifiedByUserId: null,
    reviewNotes: null,
    version: 1,
  };

  const completeness = completenessFrom(row, {
    hasCurrentPrice: hasRelatedValue(undefined, input.price),
    hasPrimaryImage: hasRelatedValue(undefined, input.primaryImage),
    hasSource: hasRelatedValue(undefined, input.source),
  });
  row.dataCompleteness = completeness.dataCompleteness;

  const model = await db.transaction(async (tx) => {
    await tx.insert(instrumentModels).values(row);
    await upsertRelated(tx, id, { currentPrice: undefined, primaryImage: undefined, source: undefined }, input);
    await writeAuditEntry(tx, actorUserId, 'instrument_model', id, 'create', null, row);
    return row;
  });

  return { ok: true, value: toInstrumentModel(model) };
}

export async function editInstrumentModel(
  db: Database,
  actorUserId: string,
  orgId: string,
  modelId: string,
  expectedVersion: number,
  patch: EditInstrumentModelPatch,
): Promise<WriteResult<InstrumentModel>> {
  const role = await getCurrentRole(db, actorUserId, orgId);
  if (!role || (role !== 'editor' && role !== 'reviewer' && role !== 'admin' && role !== 'owner')) {
    return { ok: false, reason: 'role-denied' };
  }

  const [current] = await db.select().from(instrumentModels).where(eq(instrumentModels.id, modelId)).limit(1);
  if (!current) {
    return { ok: false, reason: 'role-denied' };
  }
  if (current.version !== expectedVersion) {
    return { ok: false, reason: 'conflict', currentVersion: current.version };
  }

  const related = await getRelated(db, modelId);
  const { price, primaryImage, source, ...modelPatch } = patch;
  const after = { ...current, ...modelPatch, version: current.version + 1 };
  const completeness = completenessFrom(after, {
    hasCurrentPrice: hasRelatedValue(related.currentPrice, price),
    hasPrimaryImage: hasRelatedValue(related.primaryImage, primaryImage),
    hasSource: hasRelatedValue(related.source, source),
  });
  after.dataCompleteness = completeness.dataCompleteness;

  const model = await db.transaction(async (tx) => {
    await tx
      .update(instrumentModels)
      .set({ ...modelPatch, version: after.version, dataCompleteness: after.dataCompleteness })
      .where(eq(instrumentModels.id, modelId));
    await upsertRelated(tx, modelId, related, { price, primaryImage, source });
    await writeAuditEntry(tx, actorUserId, 'instrument_model', modelId, 'edit', current, after);
    return after;
  });

  return { ok: true, value: toInstrumentModel(model) };
}

export async function transitionInstrumentModel(
  db: Database,
  actorUserId: string,
  orgId: string,
  modelId: string,
  expectedVersion: number,
  targetStatus: LifecycleStatus,
  note?: string,
): Promise<WriteResult<InstrumentModel>> {
  const role = await getCurrentRole(db, actorUserId, orgId);
  if (!role) {
    return { ok: false, reason: 'role-denied' };
  }

  const [current] = await db.select().from(instrumentModels).where(eq(instrumentModels.id, modelId)).limit(1);
  if (!current) {
    return { ok: false, reason: 'role-denied' };
  }
  if (current.version !== expectedVersion) {
    return { ok: false, reason: 'conflict', currentVersion: current.version };
  }

  const transition = canTransition(role, current.status, targetStatus);
  if (!transition.allowed) {
    return { ok: false, reason: 'role-denied' };
  }

  if (targetStatus === 'published') {
    const completeness = await computeCompleteness(db, current);
    if (completeness.missing.length > 0) {
      return { ok: false, reason: 'missing-fields', fields: completeness.missing };
    }
  }

  let reviewNotes = current.reviewNotes;
  if (current.status === 'in_review' && targetStatus === 'draft') {
    reviewNotes = note ?? null;
  } else if (current.status === 'draft' && targetStatus === 'in_review') {
    reviewNotes = null;
  }

  const after = { ...current, status: targetStatus, reviewNotes, version: current.version + 1 };

  const model = await db.transaction(async (tx) => {
    await tx
      .update(instrumentModels)
      .set({ status: targetStatus, reviewNotes, version: after.version })
      .where(eq(instrumentModels.id, modelId));
    await writeAuditEntry(tx, actorUserId, 'instrument_model', modelId, 'status_transition', current, after);
    return after;
  });

  return { ok: true, value: toInstrumentModel(model) };
}

export async function archiveInstrumentModel(
  db: Database,
  actorUserId: string,
  orgId: string,
  modelId: string,
  expectedVersion: number,
): Promise<WriteResult<InstrumentModel>> {
  const role = await getCurrentRole(db, actorUserId, orgId);
  if (!role) {
    return { ok: false, reason: 'role-denied' };
  }

  const [current] = await db.select().from(instrumentModels).where(eq(instrumentModels.id, modelId)).limit(1);
  if (!current) {
    return { ok: false, reason: 'role-denied' };
  }
  if (current.version !== expectedVersion) {
    return { ok: false, reason: 'conflict', currentVersion: current.version };
  }

  const transition = canTransition(role, current.status, 'archived');
  if (!transition.allowed) {
    return { ok: false, reason: 'role-denied' };
  }

  const after = { ...current, status: 'archived' as const, version: current.version + 1 };

  const model = await db.transaction(async (tx) => {
    await tx
      .update(instrumentModels)
      .set({ status: 'archived', version: after.version })
      .where(eq(instrumentModels.id, modelId));
    await writeAuditEntry(tx, actorUserId, 'instrument_model', modelId, 'archive', current, after);
    return after;
  });

  return { ok: true, value: toInstrumentModel(model) };
}
