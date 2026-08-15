import { defineConfig, UserConfig } from 'vite-plus';

import oxfmtConfig from './.oxfmtrc.json' with { type: 'json' };

const fmt = oxfmtConfig as NonNullable<UserConfig['fmt']>;

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt,
  lint: {
    ignorePatterns: ['**/routeTree.gen.ts'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
});
