import { queryOptions } from '@tanstack/react-query';

import { getFamilies } from '#/services/family.service';

import { familyQueryKeys } from './family.keys';

export const getFamiliesQueryOptions = () =>
  queryOptions({
    queryKey: familyQueryKeys.families(),
    queryFn: () => getFamilies(),
    retry: false,
  });
