import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import { createRunnableDevEnvironment } from 'vite';
import { lazyPlugins, type Plugin, type PluginOption } from 'vite-plus';

/**
 * Vite+ can resolve `vite` as a second copy of vite-plus-core, so Start's
 * `instanceof RunnableDevEnvironment` check is unreliable. Creating the SSR
 * env from `vite` still helps; the Connect HTML middleware is installed by a
 * pnpm patch on `@tanstack/start-plugin-core` (duck-type `runner` instead of
 * instanceof / dispatchFetch).
 * @see https://github.com/TanStack/router/issues/7614
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
  // Mixed plugin packages each ship their own `Plugin` type. Unifying them
  // into Vite+'s recursive `PluginOption` hits TS2321 (excessive stack depth).
  return lazyPlugins(
    () =>
      [
        forceRunnableSsrEnvironment(),
        ...extraPlugins,
        tailwindcss(),
        tanstackStart(),
        viteReact(),
        babel({ presets: [reactCompilerPreset()] }),
      ] as PluginOption[],
  );
}
