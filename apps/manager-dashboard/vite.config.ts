import { defineConfig, createRunnableDevEnvironment } from "vite";
import type { Plugin } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { lazyPlugins } from "vite-plus";

/**
 * Vite+ and `vite` (aliased to vite-plus-core) can resolve as two module
 * instances, so TanStack Start's `isRunnableDevEnvironment()` instanceof check
 * fails and its SSR HTML middleware is never installed → "Cannot GET /".
 * Force the SSR env factory through the same `vite` specifier the plugin uses.
 * @see https://github.com/TanStack/router/issues/7218
 */
function forceRunnableSsrEnvironment(): Plugin {
  return {
    name: "force-runnable-ssr-env",
    enforce: "pre",
    config() {
      return {
        environments: {
          ssr: {
            dev: {
              createEnvironment: (name, config) =>
                createRunnableDevEnvironment(name, config),
            },
          },
        },
      };
    },
  };
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: lazyPlugins(() => [
    forceRunnableSsrEnvironment(),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ]),
  server: {
    port: 4000,
  },
});

export default config;
