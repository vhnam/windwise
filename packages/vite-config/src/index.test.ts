import type { Plugin } from 'vite-plus';
import { describe, expect, it } from 'vite-plus/test';

import { tanstackAppPlugins } from './index.ts';

describe('tanstackAppPlugins', () => {
  it('returns an array of Vite plugins including the caller-supplied plugin', () => {
    const markerPlugin: Plugin = { name: 'test-marker' };

    const plugins = tanstackAppPlugins(markerPlugin);

    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins?.some((plugin) => (plugin as Plugin)?.name === 'test-marker')).toBe(true);
  });
});
