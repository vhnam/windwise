import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type { InstrumentModel, LifecycleStatus, Role, WriteResult } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { instrumentModels, modelImages, organizationMembers, pricePoints, sources } from '#/schema/index.ts';

import { canTransition } from '../auth/can-transition';
import { computeDataCompleteness, computeMissingFields } from '../auth/required-fields';
import { writeAuditEntry } from '../auth/write-audit-entry';

export type CreateInstrumentModelInput = {
  brandId: string;
  familyId: string;
  modelCode: string;
  displayName: string;
  levelTier: InstrumentModel['levelTier'];
};

export type EditInstrumentModelPatch = Partial<
  Pick<CreateInstrumentModelInput, 'brandId' | 'familyId' | 'modelCode' | 'displayName' | 'levelTier'>
>;

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
  const [currentPrice] = await db
    .select({ id: pricePoints.id })
    .from(pricePoints)
    .where(and(eq(pricePoints.modelId, model.id), eq(pricePoints.isCurrent, true)))
    .limit(1);
  const [primaryImage] = await db
    .select({ id: modelImages.id })
    .from(modelImages)
    .where(and(eq(modelImages.modelId, model.id), eq(modelImages.isPrimary, true)))
    .limit(1);
  const [source] = await db.select({ id: sources.id }).from(sources).where(eq(sources.modelId, model.id)).limit(1);

  const record = {
    brandId: model.brandId,
    familyId: model.familyId,
    modelCode: model.modelCode,
    displayName: model.displayName,
    hasCurrentPrice: Boolean(currentPrice),
    hasPrimaryImage: Boolean(primaryImage),
    hasSource: Boolean(source),
  };

  return {
    dataCompleteness: computeDataCompleteness(record),
    missing: computeMissingFields('instrument_model', record),
  };
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

  const model = await db.transaction(async (tx) => {
    await tx.insert(instrumentModels).values(row);
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

  const after = { ...current, ...patch, version: current.version + 1 };
  const completeness = await computeCompleteness(db, after);
  after.dataCompleteness = completeness.dataCompleteness;

  const model = await db.transaction(async (tx) => {
    await tx
      .update(instrumentModels)
      .set({ ...patch, version: after.version, dataCompleteness: after.dataCompleteness })
      .where(eq(instrumentModels.id, modelId));
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
