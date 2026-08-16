import { and, eq, inArray, isNull } from 'drizzle-orm';

import type { ListingFilters, ListingItem, ListingResult } from '@windwise/schemas';
import { priceOverlapsBudget, resolveDisplayPrice } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { brands, instrumentFamilies, instrumentModels, modelImages, pricePoints } from '#/schema/index.ts';

export async function listPublishedInstruments(db: Database, filters: ListingFilters): Promise<ListingResult> {
  const predicates = [eq(instrumentModels.status, 'published'), isNull(instrumentModels.variantOfModelId)];
  if (filters.section) {
    predicates.push(eq(instrumentFamilies.section, filters.section));
  }
  if (filters.family) {
    predicates.push(eq(instrumentFamilies.slug, filters.family));
  }
  if (filters.brand) {
    predicates.push(eq(brands.slug, filters.brand));
  }

  const baseRows = await db
    .select({
      modelId: instrumentModels.id,
      displayName: instrumentModels.displayName,
      familySlug: instrumentFamilies.slug,
      brandSlug: brands.slug,
      tier: instrumentModels.levelTier,
    })
    .from(instrumentModels)
    .innerJoin(instrumentFamilies, eq(instrumentModels.familyId, instrumentFamilies.id))
    .innerJoin(brands, eq(instrumentModels.brandId, brands.id))
    .where(and(...predicates));

  if (baseRows.length === 0) {
    return { items: [], totalCount: 0 };
  }

  const modelIds = baseRows.map((row) => row.modelId);

  const priceRows = await db.select().from(pricePoints).where(inArray(pricePoints.modelId, modelIds));
  const pricesByModel = new Map<string, typeof priceRows>();
  for (const row of priceRows) {
    const list = pricesByModel.get(row.modelId) ?? [];
    list.push(row);
    pricesByModel.set(row.modelId, list);
  }

  const imageRows = await db.select().from(modelImages).where(inArray(modelImages.modelId, modelIds));
  const imagesByModel = new Map<string, typeof imageRows>();
  for (const row of imageRows) {
    const list = imagesByModel.get(row.modelId) ?? [];
    list.push(row);
    imagesByModel.set(row.modelId, list);
  }

  const variantRows = await db
    .select({ modelId: instrumentModels.variantOfModelId })
    .from(instrumentModels)
    .where(and(inArray(instrumentModels.variantOfModelId, modelIds), eq(instrumentModels.status, 'published')));
  const variantCountByModel = new Map<string, number>();
  for (const row of variantRows) {
    if (!row.modelId) {
      continue;
    }
    variantCountByModel.set(row.modelId, (variantCountByModel.get(row.modelId) ?? 0) + 1);
  }

  const items: ListingItem[] = [];

  for (const row of baseRows) {
    const modelPrices = (pricesByModel.get(row.modelId) ?? []).map((price) => ({
      modelId: price.modelId,
      scope: price.scope,
      amountMin: Number(price.amountMin),
      amountMax: Number(price.amountMax),
      isCurrent: price.isCurrent,
    }));
    const resolvedPrice = resolveDisplayPrice(modelPrices);

    if (filters.budgetBand) {
      if (!resolvedPrice || !priceOverlapsBudget(resolvedPrice, filters.budgetBand)) {
        continue;
      }
    }

    const images = (imagesByModel.get(row.modelId) ?? []).filter((image) => image.isPrimary);
    images.sort((a, b) => a.sortOrder - b.sortOrder);
    const primary = images[0];

    items.push({
      modelId: row.modelId,
      displayName: row.displayName,
      familySlug: row.familySlug,
      brandSlug: row.brandSlug,
      tier: row.tier,
      price: resolvedPrice,
      primaryImage: primary
        ? {
            id: primary.id,
            modelId: primary.modelId,
            url: primary.url,
            altVi: primary.altVi,
            altEn: primary.altEn,
            credit: primary.credit,
            licenseNote: primary.licenseNote,
            isPrimary: primary.isPrimary,
            sortOrder: primary.sortOrder,
          }
        : null,
      variantCount: variantCountByModel.get(row.modelId) ?? 0,
    });
  }

  return { items, totalCount: items.length };
}
