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
    overrides: [
      {
        files: ['packages/core/src/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              paths: [
                { name: 'react', message: '@windwise/core must stay framework-free.' },
                { name: 'react-dom', message: '@windwise/core must stay framework-free.' },
                { name: 'drizzle-orm', message: '@windwise/core must not import a DB driver.' },
                { name: 'postgres', message: '@windwise/core must not import a DB driver.' },
                { name: 'pg', message: '@windwise/core must not import a DB driver.' },
              ],
              patterns: [
                {
                  group: ['@tanstack/*', '@tanstack/*/*'],
                  message: '@windwise/core must not import TanStack libraries.',
                },
              ],
            },
          ],
        },
      },
    ],
  },
  run: {
    cache: true,
  },
});
