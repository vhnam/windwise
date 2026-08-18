import { listBrandsFn } from '#/lib/server/catalog';

export type BrandOption = {
  id: string;
  name: string;
};

export const getBrands = async (): Promise<BrandOption[]> => listBrandsFn();
