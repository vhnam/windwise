import { describe, expect, it } from 'vite-plus/test';

import { cn } from './utils.ts';

describe('cn', () => {
  it('merges tailwind classes without duplicates', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
