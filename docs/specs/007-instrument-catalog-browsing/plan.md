# Implementation Plan: Instrument Catalog Browsing

**Branch**: `007-instrument-catalog-browsing` | **Date**: 2026-08-16 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
`/docs/specs/007-instrument-catalog-browsing/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its
definition describes the execution workflow.

## Summary

Published instruments are browsable via SSR'd listing pages (filterable by
section, family, budget band, brand) and detail pages (specs, images, scoped
pricing, verification trust signals, variant grouping) reachable without
starting any consultation. This is a read path over the same `@windwise/db`
catalog tables [005](../005-guided-instrument-consultation/plan.md) introduced —
no new engine logic, no AI tools; the only new work is query/filter functions,
SSR route loaders, and presentation components.

## Technical Context

**Language/Version**: TypeScript, Node.js >=22.18.0, React 19 (same as 005/006)

**Primary Dependencies**: TanStack Start (SSR route loaders — this feature's
primary reason to be TanStack Start rather than a client-only SPA, per platform
§5.2 "SSR for catalog/SEO pages"), TanStack Router (typed search params for
filter state — the platform plan calls this out as router's strongest use case),
TanStack Query (catalog fetch, prefetch on hover), `@windwise/db`,
`@windwise/ui`. No AI/tool dependency — this feature has no conversational
surface.

**Storage**: PostgreSQL via `@windwise/db` — read-only queries against
`instrument_models`, `instrument_families`, `price_points`, `model_images`,
`sources`, `brands` (all already modeled in 005's data-model.md or platform
§3.2-3.3); no new tables required for the browsing surface itself.

**Testing**: `vp run -r test`; unit tests on filter/budget-band query functions
in `@windwise/db` (deterministic given fixed catalog + price data — same
`vn_street`-preferred, MSRP-fallback logic as 005's budget filtering, reused not
reimplemented); route-loader integration tests verifying only `published`
records ever reach a rendered page.

**Target Platform**: Web — SSR + browser, same deployment target as
`apps/consumer-application`

**Project Type**: Web application, same monorepo — no new app or package, new
routes and query functions only

**Performance Goals**: Standard SSR page-load expectations (no
platform-plan-specific number is given for browsing, unlike the 50ms engine /
1.5s first-token targets that apply to consultation); this plan adopts "listing
and detail pages render on first paint via SSR, no client loading spinner for
the primary content" as the working target, consistent with the platform plan's
framing of this surface as "the SEO surface."

**Constraints**: Only `published` records may ever appear (spec FR-007);
budget-band filtering MUST prefer `vn_street` price over an MSRP-derived
estimate, and MUST flag the estimate when used (spec FR-006, same rule 005 uses
for consultation budget matching and
[006](../006-instrument-compare-upgrade/plan.md) now also uses for
`compareModelsCore`'s per-model price display and `suggestUpgrade`'s
`upgradeBudget` matching — one shared query function, three callers, not three
copies); every image requires `credit`/`license_note` before it can render on a
published page (spec FR-003, platform plan's licensing risk note in §4.3).

**Scale/Scope**: Same v1 catalog target as 005/006 — ~60-90 published models
across ~14 families at full content maturity, a handful at MVP;
filtering/listing must remain correct at either scale since it is a
straightforward indexed query, not a scale-sensitive algorithm.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Code Quality** — PASS. Budget-band price resolution
  (`vn_street`-preferred, MSRP-fallback-with-estimate-flag) is implemented once
  in `@windwise/db` and imported by this feature's listing filter, 005's
  consultation budget matching, and 006's `compareModelsCore`/`suggestUpgrade`
  price displays — three callers of one function, rather than being
  reimplemented per caller, directly the kind of duplication the constitution's
  Code Quality principle prohibits.
- **II. Testing Standards** — PASS. New behavior (filtering, variant grouping,
  published-only visibility) ships with unit tests on the query layer and an
  integration test on the SSR route loader confirming draft/in-review/archived
  records never reach the rendered page — the correctness invariant spec 007
  states as SC-001/FR-007.
- **III. UX Consistency** — PASS. Listing and detail pages reuse `@windwise/ui`
  primitives already used by 005/006's wizard and result pages; the "zero
  results for this filter combination" and "instrument not available" states are
  designed once, consistent with the empty-state pattern established in 005.
- **IV. Performance Requirements** — PASS. No new dependency introduced. SSR
  route loaders must be checked for N+1 query patterns when fetching variant
  groups + images + current price per listing row — flagged as an
  implementation-time performance check per the constitution's requirement that
  data-fetching changes include a before/after note when non-trivial.
- **Additional Constraints — stack compatibility**: unchanged from 005/006's
  analysis; this feature does not touch PowerSync at all (pure server-rendered
  read path), so the flagged-not-blocked note there does not apply here —
  nothing to re-flag.

**Post-Phase-1 re-check**: data-model.md and contracts/ confirm this feature
adds no new tables and no new cross-cutting concern — it is a
read/query/presentation layer over the schema 005 already established. No new
constitution gate risk identified during design.

## Project Structure

### Documentation (this feature)

```text
docs/specs/007-instrument-catalog-browsing/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/
└── db/                            # EXTENDED (from 005)
    └── src/
        └── queries/
            ├── list-published-instruments.ts   # NEW — section/family/budget/brand filters
            ├── get-instrument-detail.ts         # NEW — model + variants + images + sources
            └── resolve-budget-price.ts          # NEW (or promoted from 005) — vn_street-preferred, MSRP-fallback shared query

apps/
└── consumer-application/          # EXISTING app, new routes/components added
    └── src/
        └── routes/
            ├── catalog/
            │   ├── index.tsx        # NEW — listing page, typed search params for filters
            │   └── $familySlug.tsx  # NEW — family-scoped listing
            └── instrument/
                └── $modelId.tsx     # NEW — detail page (specs, images, variants, trust signals)
```

**Structure Decision**: No new shared package — this feature is entirely new
query functions in the existing `@windwise/db` (promoting/reusing the
budget-price resolution logic 005 needs anyway) plus new SSR routes in
`apps/consumer-application`. `@windwise/core` is untouched since browsing
involves no scoring or recommendation, only filtering and display.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. This feature is a straightforward read/presentation layer with no
new architectural surface.
