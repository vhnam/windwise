import { queryOptions } from '@tanstack/react-query';

import { getBrands } from '#/services/brand.service';

import { brandQueryKeys } from './brand.keys';

export const getBrandsQueryOptions = () =>
  queryOptions({
    queryKey: brandQueryKeys.brands(),
    queryFn: () => getBrands(),
    retry: false,
  });
