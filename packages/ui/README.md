# `@windwise/ui`

Shared visual baseline for Windwise apps: Tailwind v4 import plus document
reset.

This package must not depend on Windwise business concepts. Appropriate: Button,
Input, Field, Dialog, Card, Tabs, Badge. Not appropriate: `InstrumentCard`,
`RecommendationCard`, `ConsultationStep`. Domain UI belongs in
`apps/consumer-application` or `apps/manager-dashboard`.

Workflow: [AGENTS.md](../../AGENTS.md).

## Usage

In the app root route:

```ts
import appCss from "@windwise/ui?url";
```

Then add `{ rel: 'stylesheet', href: appCss }` to the route `head().links`.

Do not copy this CSS into an app. App-specific styles belong next to the
feature, or as additional exports from this package when they are reused.

The Tailwind Vite plugin is applied in
[`@windwise/vite-config`](../vite-config/README.md), not here.

## Scripts

From the repo root:

```bash
vp -C packages/ui test
```
