# `@windwise/ui`

Shared visual baseline for Windwise apps: Tailwind v4, shadcn tokens, and
primitives.

This package must not depend on Windwise business concepts. Domain UI belongs in
`apps/consumer-application` or `apps/manager-dashboard`.

Workflow: [AGENTS.md](../../AGENTS.md).

## Required core (P1)

| Spec name           | Import                              | Notes                                                                                                                           |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| button              | `@windwise/ui/components/button`    |                                                                                                                                 |
| text input          | `@windwise/ui/components/input`     |                                                                                                                                 |
| textarea            | `@windwise/ui/components/textarea`  |                                                                                                                                 |
| select              | `@windwise/ui/components/select`    |                                                                                                                                 |
| field               | `@windwise/ui/components/field`     | Use with `FieldLabel`, `FieldDescription`, and `FieldError`. Pair with `label` via `@windwise/ui/components/label` when needed. |
| card                | `@windwise/ui/components/card`      |                                                                                                                                 |
| badge               | `@windwise/ui/components/badge`     |                                                                                                                                 |
| tabs                | `@windwise/ui/components/tabs`      |                                                                                                                                 |
| dialog              | `@windwise/ui/components/dialog`    | Irreversible confirmations.                                                                                                     |
| loading placeholder | `@windwise/ui/components/skeleton`  |                                                                                                                                 |
| separator           | `@windwise/ui/components/separator` |                                                                                                                                 |
| brief notice        | `@windwise/ui/components/toast`     | Mount `Toaster` in the app shell.                                                                                               |

## Extra (allowed, not required for done)

These may stay in the package and must remain domain-free: attachment, avatar,
chart, dropdown-menu, empty, input-group, pagination, popover, questionnaire,
sheet, sidebar, table, tooltip.

`questionnaire` is a generic multi-step control. It is not Windwise consultation
UI. `Empty` is a generic empty/denied layout; catalog copy stays in the
dashboard.

## Forbidden in this package

Do not add instrument, recommendation, consultation, or catalog-provider cards
and steps. Examples: `InstrumentCard`, `RecommendationCard`, `ConsultationStep`,
`ProviderPriceTable`. Compose those in the owning app from core primitives.

## Promotion

Build a missing generic pattern in the owning app first. Promote it into this
package only when both products need it and the name stays domain-free. Domain
empty copy stays in the app; compose `@windwise/ui/components/empty` there.

## Notice vs dialog

Use Dialog for irreversible confirmations. Use toast for short status. Do not
invent a third pattern for the same job.

## Spacing vs restyle

Layout and gap around a primitive are allowed. Do not fork appearance or
interaction with an app-local copy or a one-off restyle of the primitive. Change
the shared module instead.

## Accessible names

Every field and every icon-only action needs a visible label or equivalent.

## Appearance / contrast review

Both apps wrap the document with `ThemeProvider`. Spot-check body text on
`--background` and the primary label on `--primary` in light and dark against
WCAG 2.2 AA. Token pairs are asserted in tests; the AA check is manual.

## Usage

In the app root route:

```ts
import { ThemeProvider } from "@windwise/ui/lib/theme-provider";
import { Toaster } from "@windwise/ui/components/toast";
import appCss from "@windwise/ui?url";
```

Then add `{ rel: 'stylesheet', href: appCss }` to the route `head().links`, wrap
the document with `ThemeProvider`, and mount `Toaster` inside `ThemeProvider`.

Do not copy this CSS into an app. App-specific styles belong next to the
feature, or as additional exports from this package when they are reused.

```ts
import { Button } from "@windwise/ui/components/button";
import { cn } from "@windwise/ui/lib/utils";
```

Add shadcn primitives only in this package. Apps must not run `shadcn add` or
import `shadcn` / `@base-ui/react` directly.

```bash
pnpm dlx shadcn@latest add button -c packages/ui
```

The Tailwind Vite plugin is applied in
[`@windwise/vite-config`](../vite-config/README.md), not here.

## Scripts

From the repo root:

```bash
vp -C packages/ui test
```
