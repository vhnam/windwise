# Contract: `@windwise/ui` public surface

The interface this feature exposes is the `@windwise/ui` package export map and
the import rules apps must follow. Not a network API.

## Package identity

- **Name**: `@windwise/ui`
- **Location**: `packages/ui`
- **Consumers**: `apps/consumer-application`, `apps/manager-dashboard` via
  `"@windwise/ui": "workspace:*"`
- **Rule (FR-001, FR-006)**: apps MUST NOT import UI primitives via relative
  paths into `packages/ui`, and MUST NOT copy primitive source into the app.

## Export map

Current `package.json` `exports` (contract to preserve; extend only when adding
a new extra/P1 module that is not covered by a glob):

| Export                 | Target                         | Purpose                                  |
| ---------------------- | ------------------------------ | ---------------------------------------- |
| `.`                    | `./src/styles/globals.css`     | Shared visual baseline (app root `?url`) |
| `./globals.css`        | `./src/styles/globals.css`     | Explicit CSS import                      |
| `./components/*`       | `./src/components/*.tsx`       | Core and extra primitives                |
| `./lib/theme-provider` | `./src/lib/theme-provider.tsx` | Appearance mode provider                 |
| `./lib/*`              | `./src/lib/*.ts`               | Helpers (e.g. `cn`)                      |
| `./hooks/*`            | `./src/hooks/*.ts`             | Shared hooks (e.g. `use-mobile`)         |

Internal `#/*` imports are package-private (`imports` in `package.json`). Apps
MUST NOT rely on `#/` from outside `@windwise/ui`.

## P1 import examples (FR-002, FR-003)

```ts
import { Button } from "@windwise/ui/components/button";
import { Input } from "@windwise/ui/components/input";
import { Textarea } from "@windwise/ui/components/textarea";
import { Select } from "@windwise/ui/components/select";
import { Field, FieldLabel, FieldError } from "@windwise/ui/components/field";
import { Card } from "@windwise/ui/components/card";
import { Badge } from "@windwise/ui/components/badge";
import { Tabs } from "@windwise/ui/components/tabs";
import { Dialog } from "@windwise/ui/components/dialog";
import { Skeleton } from "@windwise/ui/components/skeleton";
import { Separator } from "@windwise/ui/components/separator";
import { Toaster } from "@windwise/ui/components/toast";
import { ThemeProvider } from "@windwise/ui/lib/theme-provider";
import appCss from "@windwise/ui?url";
```

Exact named exports may include compound parts (e.g. `DialogContent`). The
module path is the stable contract; named exports are the module’s public
symbols.

## App shell contract

Both app root routes MUST:

1. Link the shared stylesheet (`appCss` from `@windwise/ui?url`).
2. Wrap the document with `ThemeProvider`.
3. Mount `Toaster` so brief notices have a host (FR-003). Manager already does;
   consumer MUST match.

## Forbidden imports (FR-006, AGENTS.md §9)

Apps and other packages MUST NOT:

- Import `shadcn`, `@shadcn/react`, or `@base-ui/react`
- Add `components.json` outside `packages/ui`
- Run `shadcn add` targeting an app directory

Adding a primitive:

```bash
pnpm dlx shadcn@latest add <name> -c packages/ui
```

## Domain denylist (FR-005, SC-004)

No file under `packages/ui/src/components/` may have a path or primary export
name that encodes: `instrument`, `recommendation`, `consultation`, `provider`
(product sense), or obvious equivalents (`InstrumentCard`, `RecommendationCard`,
`ConsultationStep`, `ProviderPriceTable`).

Generic names (`questionnaire`, `card`, `table`, `chart`) are allowed as extra
primitives.

## Failure modes

- Missing P1 module path → inventory test fails; contributor cannot assemble
  FR-002 screens.
- App-local fork of a P1 primitive → review / grep failure against this contract
  (FR-006, SC-002).
- Domain-named file in `packages/ui` → inventory test fails (SC-004).
