import { eq, inArray } from 'drizzle-orm';

import type { VerificationQueueItem } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { catalogSettings, instrumentModels, modelImages, pricePoints, sources } from '#/schema/index.ts';

import { computeMissingFields } from '../auth/required-fields';

const DEFAULT_STALENESS_THRESHOLD_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function getVerificationQueue(db: Database, orgId: string): Promise<VerificationQueueItem[]> {
  const [settings] = await db
    .select({ stalenessThresholdDays: catalogSettings.stalenessThresholdDays })
    .from(catalogSettings)
    .where(eq(catalogSettings.organizationId, orgId))
    .limit(1);
  const thresholdDays = settings?.stalenessThresholdDays ?? DEFAULT_STALENESS_THRESHOLD_DAYS;

  const publishedModels = await db.select().from(instrumentModels).where(eq(instrumentModels.status, 'published'));
  if (publishedModels.length === 0) {
    return [];
  }

  const modelIds = publishedModels.map((model) => model.id);

  const priceRows = await db.select().from(pricePoints).where(inArray(pricePoints.modelId, modelIds));
  const imageRows = await db.select().from(modelImages).where(inArray(modelImages.modelId, modelIds));
  const sourceRows = await db.select().from(sources).where(inArray(sources.modelId, modelIds));

  const pricesByModel = groupBy(priceRows, (row) => row.modelId);
  const imagesByModel = groupBy(imageRows, (row) => row.modelId);
  const sourcesByModel = groupBy(sourceRows, (row) => row.modelId);

  const now = Date.now();
  const items: VerificationQueueItem[] = [];

  for (const model of publishedModels) {
    const reasons: VerificationQueueItem['reasons'] = [];

    const daysSinceVerified = Math.floor((now - model.lastVerifiedAt.getTime()) / MS_PER_DAY);
    if (daysSinceVerified > thresholdDays) {
      reasons.push({
        type: 'stale',
        lastVerifiedAt: model.lastVerifiedAt.toISOString(),
        daysOverThreshold: daysSinceVerified - thresholdDays,
      });
    }

    const modelPrices = pricesByModel.get(model.id) ?? [];
    const modelImagesForModel = imagesByModel.get(model.id) ?? [];
    const modelSources = sourcesByModel.get(model.id) ?? [];

    const missingFields = computeMissingFields('instrument_model', {
      brandId: model.brandId,
      familyId: model.familyId,
      modelCode: model.modelCode,
      displayName: model.displayName,
      hasCurrentPrice: modelPrices.some((price) => price.isCurrent),
      hasPrimaryImage: modelImagesForModel.some((image) => image.isPrimary),
      hasSource: modelSources.length > 0,
    });
    if (missingFields.length > 0) {
      reasons.push({ type: 'missing_fields', fields: missingFields });
    }

    const brokenSource = modelSources.find((source) => source.sourceOk === false);
    if (brokenSource) {
      reasons.push({
        type: 'broken_source',
        sourceUrl: brokenSource.url,
        lastCheckedAt: brokenSource.lastCheckedAt?.toISOString() ?? new Date(0).toISOString(),
      });
    }

    if (reasons.length > 0) {
      items.push({ modelId: model.id, displayName: model.displayName, reasons });
    }
  }

  return items;
}

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k) ?? [];
    list.push(row);
    map.set(k, list);
  }
  return map;
}
