import { createFileRoute } from '@tanstack/react-router';

import type { BudgetBand, Section } from '@windwise/schemas';

import { getCatalogFacetsFn, listInstrumentsFn } from '#/lib/server/catalog';
import { CatalogPage } from '#/modules/catalog-page';

type CatalogSearch = {
  section?: Section;
  family?: string;
  budgetBand?: BudgetBand;
  brand?: string;
};

const SECTIONS = new Set(['brass', 'woodwind']);
const BUDGET_BANDS = new Set(['under_20m', '20_50m', '50_100m', 'over_100m']);

function readSearchString(search: Record<string, unknown>, key: string, allowed?: Set<string>) {
  const value = search[key];
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  if (allowed && !allowed.has(value)) {
    return undefined;
  }
  return value;
}

export const Route = createFileRoute('/catalog/')({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    section: readSearchString(search, 'section', SECTIONS) as CatalogSearch['section'],
    family: readSearchString(search, 'family'),
    budgetBand: readSearchString(search, 'budgetBand', BUDGET_BANDS) as CatalogSearch['budgetBand'],
    brand: readSearchString(search, 'brand'),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [listing, facets] = await Promise.all([listInstrumentsFn({ data: deps }), getCatalogFacetsFn()]);
    return { listing, facets };
  },
  component: CatalogRoute,
  head: () => ({
    meta: [{ title: 'Danh mục nhạc cụ — WindWise' }],
  }),
});

function CatalogRoute() {
  const search = Route.useSearch();
  const { listing, facets } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  return (
    <CatalogPage
      filters={search}
      listing={listing}
      facets={facets}
      onFiltersChange={(next) => {
        void navigate({ search: next });
      }}
    />
  );
}
