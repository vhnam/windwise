# Quickstart: Project Codebase Bootstrap

Validation guide proving the bootstrap works end-to-end. See
[data-model.md](./data-model.md) for entity definitions and
[contracts/workspace-commands.md](./contracts/workspace-commands.md) for command
contracts.

## Prerequisites

- Node.js >=22.18.0
- pnpm (version pinned via `devEngines.packageManager` in root `package.json`;
  run `vp env doctor` if unsure)

## 1. Install (validates FR-001, SC-001)

```bash
pnpm install
```

Expect: single install resolves all `apps/*` and `packages/*` dependencies. No
per-package `pnpm install` needed.

## 2. Configure environment (validates FR-005–FR-007, SC-004)

```bash
cp apps/consumer-application/.env.example apps/consumer-application/.env
# fill in OPENAI_API_KEY, GEMINI_API_KEY, VITE_POWERSYNC_URL, VITE_POWERSYNC_TOKEN

cp apps/manager-dashboard/.env.example apps/manager-dashboard/.env
# fill in BETTER_AUTH_SECRET (32+ chars), BETTER_AUTH_URL
```

Expect: if a required variable is left blank, starting the app (step 3) fails
immediately naming that variable — not a generic crash.

## 3. Run each app locally (validates FR-002, User Story 1)

```bash
pnpm dev:consumer   # consumer-application on :3000
pnpm dev:manager    # manager-dashboard
```

Expect: each starts independently; the other app does not need to be running.

## 4. Validate the whole workspace (validates FR-003, FR-011, SC-002, User Story 2)

```bash
pnpm run ready
# equivalent to: vp check && vp run -r test && vp run -r build
```

Expect: checks, tests, and builds run across every app and package; a failure in
any single member is identifiable in the output without needing to inspect the
whole run.

## 5. Confirm shared-package consumption (validates FR-004, User Story 3)

```bash
# edit packages/ui/src/styles.css or packages/query/src/index.ts
# with pnpm dev:consumer (or dev:manager) still running, confirm the change
# is reflected without editing the app's own source
```

Expect: hot-reload or restart picks up the shared-package change; no
relative-path import was needed.

## Success criteria mapping

| Step | Spec criteria                                                     |
| ---- | ----------------------------------------------------------------- |
| 1    | SC-001 (part 1: install)                                          |
| 2–3  | SC-001 (part 2: apps running), SC-004 (env failure is actionable) |
| 4    | SC-002 (per-member validation coverage)                           |
| 5    | SC-003 (shared-package change propagation)                        |
