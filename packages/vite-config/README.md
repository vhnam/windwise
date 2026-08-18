# `@windwise/vite-config`

Shared Vite+ plugins for Windwise TanStack Start apps.

`tanstackAppPlugins()` installs, in order:

1. SSR runnable-environment workaround
2. Any extra plugins you pass (for example PowerSync)
3. Tailwind Vite
4. TanStack Start
5. `@vitejs/plugin-react`
6. React Compiler (`babel-plugin-react-compiler` via `@rolldown/plugin-babel`)

Import config and plugin types from `vite-plus`, not `vite`. Workflow:
[AGENTS.md](../../AGENTS.md).

## Usage

```ts
import { defineConfig } from "vite-plus";
import { tanstackAppPlugins } from "@windwise/vite-config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: tanstackAppPlugins(/* extra Plugin args */),
});
```

## Scripts

From the repo root:

```bash
vp -C packages/vite-config test
vp -C packages/vite-config check
```
