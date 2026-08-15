# Implementation Plan: UI Core Foundation

**Branch**: `004-ui-core-foundation` | **Date**: 2026-08-15 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/004-ui-core-foundation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

Git branch name (work item stays `004-ui-core-foundation`): prefer
`feat/ui-core-foundation` if creating a dedicated implementation branch.

## Summary

Make `@windwise/ui` the single reusable core for both Windwise apps: keep the
existing shadcn/Base UI/Tailwind v4 primitives, classify P1 vs extra vs
forbidden domain UI, document the inventory, add tests that enforce the boundary
and keyboard/field/dialog behavior, and mount the shared notice host (`Toaster`)
in the member app as well as the staff app.

Most P1 modules already exist. This plan is gap-close and contract lock-in, not
a greenfield component rewrite.

## Technical Context

**Language/Version**: TypeScript (workspace `typescript` catalog `^7.0.2`),
React 19, Node `>=22.18.0`

**Primary Dependencies**: `@windwise/ui` internals already in catalog —
`@base-ui/react`, `@shadcn/react`, `shadcn`, `tailwindcss` v4,
`class-variance-authority`, `lucide-react`. Apps consume only `@windwise/ui`.
Test-only (if render tests require them): `@testing-library/react` and
`happy-dom` or `jsdom`, pinned in `pnpm-workspace.yaml` `catalog:` and used as
devDependencies of `@windwise/ui` only.

**Storage**: N/A for product data. Appearance preference may use `localStorage`
key `theme` (existing `ThemeProvider`).

**Testing**: Vite+ `vp test` / `vp -C packages/ui test`; workspace gate
`vp run ready`. Inventory tests plus P1 component tests; contrast spot-check in
[quickstart.md](./quickstart.md).

**Target Platform**: Member app and staff app (TanStack Start, local ports 3000
/ 4000). Shared package is source-consumed (`workspace:*`), not published.

**Project Type**: Shared UI library in a pnpm monorepo (`packages/ui` →
`apps/consumer-application`, `apps/manager-dashboard`)

**Performance Goals**: No new runtime dependency in app bundles beyond what
`@windwise/ui` already ships. Test-only deps MUST NOT be app dependencies.
Changes MUST NOT require copying CSS into apps (existing `?url` import).

**Constraints**: Domain-free package (FR-005). Apps MUST NOT import `shadcn` /
`@base-ui/react`. Accessibility: WCAG 2.2 AA contrast and keyboard for P1
(constitution III). shadcn add only with `-c packages/ui`. Changesets when
public behavior/exports change (see research).

**Scale/Scope**: One package, twelve P1 primitives (including field/label,
skeleton, separator, toast), extra generics retained, two app shells. No new
workspace members.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality**: Changes stay in `@windwise/ui` plus app-root wiring;
  public exports documented. PR review required. PASS.
- **II. Testing Standards**: Plan adds inventory + P1 behavior tests in the UI
  package; apps already import `Button` (cross-boundary smoke). New test
  libraries are test-only. PASS (closes the current test gap rather than waiving
  it).
- **III. User Experience Consistency**: This work item exists to enforce shared
  primitives, matching loading/notice/form patterns, and a11y basics. PASS.
- **IV. Performance Requirements**: No new production dependencies planned.
  Optional Testing Library is dev-only. PASS.
- **Additional Constraints**: pnpm + Vite + TypeScript; verification through
  `vp`. Shared package remains the UI source of truth. PASS.

No violations; Complexity Tracking is unused.

### Post-Phase 1 re-check

Design artifacts (inventory model, export contract, quickstart) do not add apps,
domain UI in `packages/ui`, or a Storybook member. Consumer `Toaster` is parity
with manager, not a new pattern. Gates still PASS.

## Project Structure

### Documentation (this feature)

```text
docs/specs/004-ui-core-foundation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-package-exports.md
└── tasks.md             # Phase 2 (/speckit-tasks) — NOT created here
```

### Source Code (repository root)

```text
packages/ui/
├── components.json                 # only shadcn config in the repo
├── package.json                    # exports + (optional) test devDeps
├── README.md                       # P1 vs extra vs forbidden inventory
└── src/
    ├── components/                 # P1 + extra primitives
    │   ├── button.tsx
    │   ├── input.tsx
    │   ├── textarea.tsx
    │   ├── select.tsx
    │   ├── field.tsx
    │   ├── label.tsx
    │   ├── card.tsx
    │   ├── badge.tsx
    │   ├── tabs.tsx
    │   ├── dialog.tsx
    │   ├── skeleton.tsx
    │   ├── separator.tsx
    │   ├── toast.tsx
    │   └── …                       # extra: avatar, chart, sidebar, …
    ├── hooks/
    ├── lib/
    │   ├── theme-provider.tsx
    │   └── utils.ts
    └── styles/
        ├── globals.css
        └── typeset.css

apps/consumer-application/src/routes/__root.tsx   # ThemeProvider + Toaster + CSS
apps/manager-dashboard/src/routes/__root.tsx      # already Toaster + ThemeProvider
```

**Structure Decision**: Existing monorepo layout. No new package or app. Work is
classify/document/test P1 modules in `packages/ui` and align consumer shell with
the notice-host contract.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — this section is not applicable.
