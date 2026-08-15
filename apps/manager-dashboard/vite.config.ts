import { defineConfig } from 'vite-plus';

import { tanstackAppPlugins } from '@windwise/vite-config';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: tanstackAppPlugins(),
  server: {
    port: 4000,
  },
});

export default config;
