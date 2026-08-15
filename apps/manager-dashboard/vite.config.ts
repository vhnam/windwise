import { tanstackAppPlugins } from '@windwise/vite-config';
import { defineConfig } from 'vite-plus';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: tanstackAppPlugins(),
  server: {
    port: 4000,
  },
});

export default config;
