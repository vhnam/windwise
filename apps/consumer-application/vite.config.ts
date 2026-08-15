import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, createRunnableDevEnvironment } from "vite";
import type { Plugin } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import powersyncVite from "./powersync-vite-plugin.ts";
import { lazyPlugins } from "vite-plus";

// pnpm hoists deps to the monorepo root; PowerSync workers need to be serveable.
const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/**
 * Vite+ and `vite` (aliased to vite-plus-core) can resolve as two module
 * instances, so TanStack Start's `isRunnableDevEnvironment()` instanceof check
 * fails and its SSR HTML middleware is never installed → "Cannot GET /".
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
  server: {
    fs: {
      allow: [monorepoRoot],
    },
  },
  plugins: lazyPlugins(() => [
    forceRunnableSsrEnvironment(),
    devtools(),
    powersyncVite(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ]),
});

export default config;
