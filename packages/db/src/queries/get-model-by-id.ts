import { eq, inArray } from 'drizzle-orm';

import type { InstrumentModel, PricePoint } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { instrumentModels, pricePoints } from '#/schema/index.ts';

function manufacturerSourceUrl(modelCode: string): string {
  return `https://example.com/instruments/${encodeURIComponent(modelCode)}`;
}

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
    sourceUrl: manufacturerSourceUrl(row.modelCode),
  };
}

export async function getModelById(db: Database, modelId: string): Promise<InstrumentModel | undefined> {
  const [row] = await db.select().from(instrumentModels).where(eq(instrumentModels.id, modelId)).limit(1);
  return row ? toInstrumentModel(row) : undefined;
}

export async function getModelsByIds(db: Database, modelIds: string[]): Promise<InstrumentModel[]> {
  if (modelIds.length === 0) {
    return [];
  }

  const rows = await db.select().from(instrumentModels).where(inArray(instrumentModels.id, modelIds));
  const byId = new Map(rows.map((row) => [row.id, toInstrumentModel(row)]));
  return modelIds.flatMap((id) => {
    const model = byId.get(id);
    return model ? [model] : [];
  });
}

export async function getCurrentPricesForModels(db: Database, modelIds: string[]): Promise<PricePoint[]> {
  if (modelIds.length === 0) {
    return [];
  }

  const rows = await db.select().from(pricePoints).where(inArray(pricePoints.modelId, modelIds));
  return rows
    .filter((row) => row.isCurrent)
    .map((row) => ({
      modelId: row.modelId,
      scope: row.scope,
      amountMin: Number(row.amountMin),
      amountMax: Number(row.amountMax),
      isCurrent: row.isCurrent,
    }));
}
