import type { CatalogFacets } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import { brands, instrumentFamilies } from '#/schema/index.ts';

export async function listCatalogFacets(db: Database): Promise<CatalogFacets> {
  const familyRows = await db
    .select({ slug: instrumentFamilies.slug, nameVi: instrumentFamilies.nameVi })
    .from(instrumentFamilies);
  const brandRows = await db.select({ slug: brands.slug, name: brands.name }).from(brands);
  return { families: familyRows, brands: brandRows };
}
