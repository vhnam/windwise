import { and, eq } from 'drizzle-orm';

import type { DetailResult } from '@windwise/schemas';
import { resolveDisplayPrice } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { brands, instrumentFamilies, instrumentModels, modelImages, pricePoints, sources } from '#/schema/index.ts';

type SourceRow = typeof sources.$inferSelect;

function pickPrimarySource(rows: SourceRow[]): SourceRow | undefined {
  const primary = rows.find((row) => row.isPrimary);
  if (primary) {
    return primary;
  }
  return [...rows].sort((a, b) => b.retrievedAt.getTime() - a.retrievedAt.getTime())[0];
}

export async function getInstrumentDetail(db: Database, modelId: string): Promise<DetailResult> {
  const [row] = await db
    .select({
      modelId: instrumentModels.id,
      displayName: instrumentModels.displayName,
      familySlug: instrumentFamilies.slug,
      brandSlug: brands.slug,
      tier: instrumentModels.levelTier,
      status: instrumentModels.status,
      lastVerifiedAt: instrumentModels.lastVerifiedAt,
    })
    .from(instrumentModels)
    .innerJoin(instrumentFamilies, eq(instrumentModels.familyId, instrumentFamilies.id))
    .innerJoin(brands, eq(instrumentModels.brandId, brands.id))
    .where(eq(instrumentModels.id, modelId))
    .limit(1);

  if (!row || row.status !== 'published') {
    return { status: 'not_available' };
  }

  const priceRows = await db.select().from(pricePoints).where(eq(pricePoints.modelId, modelId));
  const resolvedPrice = resolveDisplayPrice(
    priceRows.map((price) => ({
      modelId: price.modelId,
      scope: price.scope,
      amountMin: Number(price.amountMin),
      amountMax: Number(price.amountMax),
      isCurrent: price.isCurrent,
    })),
  );

  const imageRows = await db.select().from(modelImages).where(eq(modelImages.modelId, modelId));
  imageRows.sort((a, b) => a.sortOrder - b.sortOrder);

  const sourceRows = await db.select().from(sources).where(eq(sources.modelId, modelId));
  const primarySource = pickPrimarySource(sourceRows);

  const variantRows = await db
    .select({
      modelId: instrumentModels.id,
      displayName: instrumentModels.displayName,
      modelCode: instrumentModels.modelCode,
    })
    .from(instrumentModels)
    .where(and(eq(instrumentModels.variantOfModelId, modelId), eq(instrumentModels.status, 'published')));

  return {
    status: 'available',
    modelId: row.modelId,
    displayName: row.displayName,
    familySlug: row.familySlug,
    brandSlug: row.brandSlug,
    tier: row.tier,
    lastVerifiedAt: row.lastVerifiedAt.toISOString(),
    price: resolvedPrice,
    images: imageRows.map((image) => ({
      id: image.id,
      modelId: image.modelId,
      url: image.url,
      altVi: image.altVi,
      altEn: image.altEn,
      credit: image.credit,
      licenseNote: image.licenseNote,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
    })),
    source: primarySource
      ? {
          id: primarySource.id,
          modelId: primarySource.modelId,
          kind: primarySource.kind,
          url: primarySource.url,
          publisher: primarySource.publisher,
          retrievedAt: primarySource.retrievedAt.toISOString(),
          isPrimary: primarySource.isPrimary,
        }
      : null,
    variants: variantRows.map((variant) => ({
      modelId: variant.modelId,
      displayName: variant.displayName,
      distinguishingFeature: variant.modelCode,
    })),
  };
}
