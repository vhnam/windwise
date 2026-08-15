import { describe, expect, it } from 'vite-plus/test';

import { createQueryClient } from './index.ts';

describe('createQueryClient', () => {
  it('sets a 60s query staleTime so SSR hydrations do not refetch immediately', () => {
    const queryClient = createQueryClient();

    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(60_000);
  });
});
