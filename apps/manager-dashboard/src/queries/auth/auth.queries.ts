import { queryOptions } from '@tanstack/react-query';

import { getCurrentSession } from '#/services/auth.service';

import { authQueryKeys } from './auth.keys';

export const currentSessionQueryOptions = () =>
  queryOptions({
    queryKey: authQueryKeys.currentSession(),
    queryFn: () => getCurrentSession(),
    retry: false,
  });
