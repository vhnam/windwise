# Quickstart: UI Core Foundation

Validation guide proving the shared core UI works end-to-end. See
[data-model.md](./data-model.md) and
[contracts/ui-package-exports.md](./contracts/ui-package-exports.md).

## Prerequisites

- Node.js >=22.18.0
- Dependencies installed (`pnpm install` from repo root)

## 1. Inventory and package tests (FR-002, FR-005, FR-007, SC-004)

```bash
vp -C packages/ui test
```

Expect:

- P1 modules listed in the contract exist.
- No domain-named files under `src/components/`.
- P1 golden-path tests pass (button, field error, dialog dismiss, tabs,
  skeleton, toast host).

## 2. Workspace quality gate (constitution)

```bash
vp run ready
```

Expect: check, test, and build pass for `@windwise/ui` and both apps.

## 3. Both apps consume the same primitives (FR-001, FR-004, SC-003, SC-007)

```bash
vp run dev:consumer   # typically :3000
vp run dev:manager    # typically :4000
```

Expect:

- Each home screen renders the shared `Button` (already imported).
- Changing a default class on `packages/ui/src/components/button.tsx` updates
  both apps on reload without editing app source.

## 4. Form + dialog composition (SC-001, FR-014, FR-013)

In either running app (or in the P1 component tests), assemble:

- `Field` + `Input` with a visible label
- `FieldError` when empty
- `Button` to submit
- `Dialog` to confirm

Expect: no new app-local button/field/dialog files. Keyboard: Tab to controls,
open dialog, dismiss, focus returns.

Timebox for a contributor who already knows the workspace: under 30 minutes
using README import paths (SC-001).

## 5. Notices and loading (FR-003)

- Confirm `Toaster` is mounted in **both** app roots.
- Render `Skeleton` as a loading placeholder.
- Trigger a brief toast for success/error.

Expect: same notice and placeholder patterns in both products; no app-local
banner/spinner kit for those jobs.

## 6. Appearance and contrast (FR-009, FR-010, SC-006)

- Toggle appearance (existing `ThemeProvider`; `d` key when not in a field, or
  `setTheme`).
- Confirm core pieces follow `light` / `dark` tokens.
- Spot-check body text on background and primary button label on primary fill in
  both modes against WCAG 2.2 AA.

Expect: no second token sheet in the app that fights `globals.css`.

## 7. Domain boundary (FR-005, User Story 3)

```bash
ls packages/ui/src/components
```

Expect: generic names only. Domain cards/steps live under `apps/*` if they exist
at all.

## Success criteria mapping

| Step | Spec criteria                          |
| ---- | -------------------------------------- |
| 1    | SC-004, FR-002, FR-005, FR-007         |
| 2    | Constitution quality gates             |
| 3    | SC-003, SC-007, FR-001, FR-004         |
| 4    | SC-001, SC-005, FR-008, FR-013, FR-014 |
| 5    | FR-003                                 |
| 6    | SC-006, FR-009, FR-010, FR-011         |
| 7    | SC-004, FR-005                         |
