# Phase 1 Data Model: UI Core Foundation

This feature does not persist business records. Entities are library/inventory
concepts that map to files under `packages/ui` and consumption in both apps.

## Core primitive

A reusable, domain-free interface building block.

| Field          | Type     | Notes                                                             |
| -------------- | -------- | ----------------------------------------------------------------- |
| name           | string   | Generic English name (e.g. `button`, `dialog`)                    |
| modulePath     | path     | `packages/ui/src/components/<name>.tsx`                           |
| publicImport   | string   | `@windwise/ui/components/<name>`                                  |
| tier           | enum     | `p1` \| `extra`                                                   |
| slots          | string[] | `data-slot` values used in the module                             |
| states         | set      | at least: default, disabled, focused where interactive            |
| accessibleName | rule     | visible label or equivalent required for interactive use (FR-008) |
| domainEncoded  | boolean  | MUST be `false` (FR-005)                                          |

**P1 instances (required for done):** button, input, textarea, select, field
(with label), card, badge, tabs, dialog, skeleton, separator, toast.

**Extra instances (may remain):** avatar, chart, dropdown-menu, input-group,
popover, questionnaire, sheet, sidebar, table, tooltip.

**Forbidden names / roles:** instrument, recommendation, consultation, provider
(as product concepts), and any equivalent domain card/step/table.

Validation:

- `tier = p1` modules MUST exist and be listed in `package.json` exports
  (`./components/*`).
- File base names MUST NOT match a domain denylist (inventory test).
- Interactive P1 primitives MUST be keyboard operable (FR-008, FR-013).

## Shared visual baseline

The common type, color, spacing, and radius decisions.

| Field         | Type   | Notes                                                              |
| ------------- | ------ | ------------------------------------------------------------------ |
| tokenFile     | path   | `packages/ui/src/styles/globals.css`                               |
| typeFile      | path   | `packages/ui/src/styles/typeset.css`                               |
| cssExport     | string | `@windwise/ui` and `@windwise/ui/globals.css`                      |
| colorTokens   | map    | `--background`, `--foreground`, `--primary`, `--destructive`, etc. |
| radiusToken   | string | `--radius`                                                         |
| appCssSources | glob   | `@source "../../../apps/**/*.{ts,tsx}"` in globals.css             |

Apps MUST NOT ship a second `:root` token set that redefines the same names for
a conflicting baseline (FR-011). Local layout spacing around a primitive is
allowed.

## Appearance mode

A named set of baseline colors applied to core primitives.

| Field          | Type   | Notes                                           |
| -------------- | ------ | ----------------------------------------------- |
| id             | enum   | `light` \| `dark` \| `system`                   |
| resolved       | enum   | `light` \| `dark` (`system` resolves via OS)    |
| htmlClass      | string | `light` or `dark` on `document.documentElement` |
| providerModule | path   | `packages/ui/src/lib/theme-provider.tsx`        |
| publicImport   | string | `@windwise/ui/lib/theme-provider`               |
| persistenceKey | string | default `theme` in `localStorage`               |

State transitions:

```text
system → (prefers-color-scheme) → light | dark
light  → (user toggle) → dark
dark   → (user toggle) → light
```

Core primitives MUST read colors from CSS variables so they follow the resolved
class without per-app forks (FR-010).

## Product screen

A member- or staff-facing view that composes primitives.

| Field       | Type             | Notes                                             |
| ----------- | ---------------- | ------------------------------------------------- |
| owningApp   | enum             | `consumer-application` \| `manager-dashboard`     |
| routeModule | path             | under `apps/<app>/src/routes/`                    |
| primitives  | Core primitive[] | imported from `@windwise/ui/components/*`         |
| domainUI    | boolean          | if true, lives in the app, never in `packages/ui` |

Rule: domain screens are not Core primitives. Instrument / recommendation /
consultation UI belongs here.

## Package export surface

The public contract of `@windwise/ui` (see
[contracts/ui-package-exports.md](./contracts/ui-package-exports.md)).

| Field    | Type | Notes                                    |
| -------- | ---- | ---------------------------------------- |
| export   | glob | `package.json` `exports` keys            |
| target   | path | file under `packages/ui/src/`            |
| consumer | App  | `workspace:*` dependency, never relative |

No database, migrations, or sync entities are introduced.
