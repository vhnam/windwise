# Phase 0 Research: UI Core Foundation

No `[NEEDS CLARIFICATION]` markers were left in spec.md. Research confirms the
already-adopted `@windwise/ui` stack, classifies inventory against
FR-002–FR-005, and records the remaining gaps this plan must close.

## Decision: Keep `@windwise/ui` as the single shared UI home

- **Decision**: Do not create a second UI package. Fill `packages/ui`
  (`@windwise/ui`) as the core library both apps consume via `workspace:*`.
- **Rationale**: Constitution Additional Constraints and AGENTS.md §9 already
  name this package as the source of truth. Both apps already depend on it,
  import `ThemeProvider` and global CSS, and render `Button` from
  `@windwise/ui/components/button`. A second home would violate FR-001 and
  FR-011.
- **Alternatives considered**: Per-app component folders that later get
  extracted — rejected; constitution forbids duplicating shared UI. A new
  `packages/design-system` — rejected as speculative renaming with no product
  benefit.

## Decision: Stay on the existing shadcn / Base UI / Tailwind v4 stack

- **Decision**: Continue adding and wrapping primitives only in `packages/ui`
  using the existing `components.json` (`style: base-lyra`), `@base-ui/react`,
  `@shadcn/react`, Tailwind v4 tokens in `src/styles/globals.css`, and
  `class-variance-authority`. Apps MUST import from `@windwise/ui/...` only —
  never `shadcn`, `@shadcn/react`, or `@base-ui/react`.
- **Rationale**: Already wired (fonts, CSS variables, dark variant, Vite
  Tailwind plugin via `@windwise/vite-config`). Replacing the kit would be a new
  brand system, which spec Assumptions explicitly out of scope. App grep today
  shows zero direct `shadcn` / `@base-ui` imports outside `packages/ui`.
- **Alternatives considered**: Hand-rolled primitives — rejected; duplicates
  focus-trap and keyboard behavior already provided by Base UI. A different
  component kit — rejected as an unjustified shared-package dependency swap
  (constitution IV).

## Decision: P1 inventory vs extra generic vs domain

- **Decision**: Treat the following as **P1 required** for this work item
  (FR-002, FR-003):

  | Spec name                 | Module                                   |
  | ------------------------- | ---------------------------------------- |
  | button                    | `src/components/button.tsx`              |
  | text input                | `src/components/input.tsx`               |
  | textarea                  | `src/components/textarea.tsx`            |
  | select                    | `src/components/select.tsx`              |
  | field                     | `src/components/field.tsx` + `label.tsx` |
  | card                      | `src/components/card.tsx`                |
  | badge                     | `src/components/badge.tsx`               |
  | tabs                      | `src/components/tabs.tsx`                |
  | dialog                    | `src/components/dialog.tsx`              |
  | loading placeholder       | `src/components/skeleton.tsx`            |
  | separator                 | `src/components/separator.tsx`           |
  | brief non-blocking notice | `src/components/toast.tsx`               |

  Treat all other current files as **extra generic** (allowed to remain, not
  required for “done”): avatar, chart, dropdown-menu, input-group, popover,
  questionnaire, sheet, sidebar, table, tooltip, plus `hooks/use-mobile.ts`.

  **Domain**: none of the current files encode Windwise catalog, recommendation,
  consultation, or provider concepts. `questionnaire.tsx` is the shadcn generic
  multi-step control, not a Windwise consultation flow — keep it extra generic.
  Do **not** add `InstrumentCard`, `RecommendationCard`, `ConsultationStep`, or
  `ProviderPriceTable`.

- **Rationale**: Matches spec Assumptions (“core is FR-002/FR-003; extras may
  already exist”). Moving extras out would churn without serving SC-004.
  Inventing domain components in this package would fail FR-005.
- **Alternatives considered**: Promote sidebar/table/chart into P1 — rejected;
  spec explicitly lists them as optional extras. Delete `questionnaire.tsx`
  because the name resembles consultation — rejected; the primitive is generic
  and unused by apps today. Deleting unused extras — optional cleanup, not
  required.

## Decision: Document inventory in `packages/ui/README.md` (FR-007)

- **Decision**: Expand the existing README with an explicit P1 vs extra vs
  forbidden table and the import/add rules. Do not invent a second catalog site
  or Storybook in this work item.
- **Rationale**: Contributors already look at the package README. Spec SC-001 is
  “assemble a screen in under 30 minutes,” not “stand up a design-docs app.”
  Storybook would add a workspace member and bundle cost without a spec
  requirement.
- **Alternatives considered**: A `/ui` preview route in both apps — rejected as
  product surface not in spec. Storybook / Ladle — deferred; unjustified new
  app.

## Decision: Appearance modes stay on `ThemeProvider` (`light` / `dark` / `system`)

- **Decision**: Keep `packages/ui/src/lib/theme-provider.tsx` as the appearance
  implementation: CSS class `light` | `dark` on `<html>`, tokens in
  `globals.css` `:root` and `.dark`. Both app roots already wrap with
  `ThemeProvider`. This work item does not redesign persistence or the `d`
  keyboard toggle.
- **Rationale**: Satisfies FR-010 and FR-011 with code that already exists. Spec
  only requires core pieces to respect the active mode.
- **Alternatives considered**: Per-app theme files — rejected (FR-011). Removing
  `system` — rejected; it still resolves to light or dark.

## Decision: Notice pattern requires `Toaster` in both app shells

- **Decision**: Mirror manager-dashboard’s root `Toaster` (and keep
  `ThemeProvider`) in consumer-application so FR-003/FR-004 notices work in both
  products. Do not add a second toast kit.
- **Rationale**: Manager already mounts `@windwise/ui/components/toast`.
  Consumer does not; a contributor following the README would have nowhere to
  render notices in the member app.
- **Alternatives considered**: App-local banners — rejected; that is a third
  pattern forbidden by the spec edge case. Leaving consumer without `Toaster` —
  fails FR-004.

## Decision: Tests live in `@windwise/ui`; add Testing Library only if render tests need it

- **Decision**:
  1. **Inventory contract tests** (no DOM): glob `src/components/*.tsx` and fail
     on domain-named files; assert P1 modules exist and are exported via
     `package.json` `exports`.
  2. **P1 behavior tests**: render golden-path Button, Field (label + error),
     Dialog (open/dismiss), Tabs, Skeleton, Toast using Vite+ `vp test`. Prefer
     `@testing-library/react` + a DOM environment (`happy-dom` or `jsdom`)
     pinned in the workspace `catalog:` as **devDependencies of `@windwise/ui`
     only**, justified as test-only (constitution IV: not shipped in app
     bundles).
  3. **Contrast (SC-006)**: document the token pairs (`--foreground` /
     `--background`, `--primary` / `--primary-foreground`) and verify both
     `:root` and `.dark` define them. Automated WCAG contrast math is optional;
     a manual check is in [quickstart.md](./quickstart.md).
  4. **Cross-boundary**: both apps already import `Button`; keep that and add
     consumer `Toaster`. No new integration app is required.

- **Rationale**: Constitution II requires tests for new behavior and integration
  coverage when crossing package boundaries. Current UI tests only cover `cn()`
  and that `globals.css` is non-empty — insufficient for FR-008, FR-013, FR-014.
- **Alternatives considered**: Visual regression (Playwright screenshots) —
  deferred; heavier than needed for primitive existence/a11y names. Relying on
  shadcn’s upstream tests — rejected; they do not run in this workspace.

## Decision: Adding primitives stays `shadcn add` scoped to `packages/ui`

- **Decision**: New generic primitives are added with
  `pnpm dlx shadcn@latest add <name> -c packages/ui` (already documented). Apps
  MUST NOT contain `components.json`.
- **Rationale**: FR-012; AGENTS.md §9. Confirmed: only
  `packages/ui/components.json` exists.
- **Alternatives considered**: Copy-paste from registries into apps — rejected
  (FR-006).

## Decision: Changeset impact when implementation ships

- **Decision**: If implementation only adds tests, README inventory, and
  consumer `Toaster` wiring, record a **patch** changeset for
  `@windwise/consumer-application` (shell behavior) and skip `@windwise/ui`
  unless a public export or primitive behavior changes. If P1 modules are
  missing and must be added, or exports/behavior of `@windwise/ui` change,
  record **minor** for `@windwise/ui`.
- **Rationale**: AGENTS.md Changesets policy. Most P1 files already exist.
- **Alternatives considered**: Always minor for `@windwise/ui` — unnecessary if
  the public surface is unchanged.

## Gap summary (inputs to Phase 1)

| Gap                                         | Spec refs                  |
| ------------------------------------------- | -------------------------- |
| README lacks P1 vs extra vs forbidden table | FR-007                     |
| No inventory/domain-name automated check    | FR-005, SC-004             |
| No P1 component/a11y tests                  | FR-008, FR-013–014, SC-005 |
| Consumer app has no `Toaster`               | FR-003, FR-004             |
| Contrast not in a validation checklist      | FR-009, SC-006             |
