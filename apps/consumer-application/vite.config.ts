import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

import { tanstackAppPlugins } from '@windwise/vite-config';

import powersyncVite from './powersync-vite-plugin.ts';

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    fs: {
      allow: [monorepoRoot],
    },
    port: 3000,
  },
  plugins: tanstackAppPlugins(powersyncVite()),
});

export default config;
