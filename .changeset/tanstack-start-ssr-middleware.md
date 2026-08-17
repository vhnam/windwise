---
"@windwise/vite-config": patch
---

Keep TanStack Start SSR HTML middleware working on Vite 8 / Vite+ by duck-typing
the SSR env (`runner`) instead of `instanceof` / `dispatchFetch`.
