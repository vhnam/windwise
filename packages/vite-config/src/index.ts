import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import { createRunnableDevEnvironment, lazyPlugins, type Plugin } from 'vite-plus';

/**
 * Vite+ and `vite` (aliased to vite-plus-core) can resolve as two module
 * instances, so TanStack Start's `isRunnableDevEnvironment()` instanceof check
 * fails and its SSR HTML middleware is never installed → "Cannot GET /".
 * @see https://github.com/TanStack/router/issues/7218
 */
export function forceRunnableSsrEnvironment(): Plugin {
  return {
    name: 'force-runnable-ssr-env',
    enforce: 'pre',
    config() {
      return {
        environments: {
          ssr: {
            dev: {
              createEnvironment: (name, config) => createRunnableDevEnvironment(name, config),
            },
          },
        },
      };
    },
  };
}

export function tanstackAppPlugins(...extraPlugins: Plugin[]) {
  return lazyPlugins(() => [
    forceRunnableSsrEnvironment(),
    ...extraPlugins,
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ]);
}
