# Quickstart: Instrument Compare & Upgrade Flows

Validation guide. See [data-model.md](./data-model.md) and
[contracts/](./contracts/) for referenced shapes. Builds on the prerequisites in
[005's quickstart](../005-guided-instrument-consultation/quickstart.md) (seeded
catalog, DB running, app running).

## Additional prerequisites

- `model_aliases` seeded for at least two models (e.g., Bach Strad 37, Yamaha
  YTR-8335 — the platform plan's canonical scenario)
- At least one published `model_comparison_notes` row for that pair

## Scenario 1 — Choosing an entry intent

1. Open `/consult`.
2. **Expect**: three options presented — discover, compare, upgrade.
3. Select "discover".
4. **Expect**: routes into 005's unchanged flow (no compare/upgrade question
   appears).

## Scenario 2 — Compare flow requires confirmation before comparing

1. Select "compare".
2. Type free text naming two models: "bach strad 37 vs yamaha ytr-8335".
3. **Expect**: `resolveMention` returns ranked candidates for each mention — not
   an auto-selected pair.
4. Attempt to view a comparison before confirming either candidate.
5. **Expect**: refused with `UNCONFIRMED_MODEL`, listing both unconfirmed IDs
   (spec FR-010).
6. Confirm both candidates via `confirmMention`.
7. Request the comparison again.
8. **Expect**: a structured side-by-side with specs, tier, price, and the seeded
   comparison note for at least one aspect.

## Scenario 3 — Comparison narrows by stated priority

1. From the confirmed comparison in Scenario 2, answer the follow-up priority
   question with "tone".
2. **Expect**: `highlightedAspects` includes `tone`; the response foregrounds
   tone-related rows rather than an undifferentiated full spec dump (spec
   FR-006).

## Scenario 4 — No fabricated character claims

1. Query a comparison for a model pair with zero published
   `model_comparison_notes` rows.
2. **Expect**: `notes` is an empty array — no character claim is present
   anywhere in the response (spec FR-005, research.md §4).

## Scenario 5 — Upgrade flow skips family selection

1. Select "upgrade".
2. Name a current instrument (a seeded student-tier model), confirm it.
3. Answer reason / current level / upgrade budget.
4. **Expect**: `items` are all in the same family as the confirmed current
   instrument, at or above its `level_tier` (spec FR-009) — verify no item from
   a different family appears, which would indicate Stage A ran when it should
   have been skipped.

## Scenario 6 — No upgrade available

1. Confirm a current instrument that is already the top tier in its family (no
   higher-tier candidate exists in the seed data).
2. Request an upgrade recommendation.
3. **Expect**: `{ error: 'NO_UPGRADE_AVAILABLE', reason: ... }` — not a lateral
   or lower-tier suggestion (spec Edge Cases).

## Scenario 7 — Form fallback parity for compare/upgrade

1. Repeat Scenarios 2 and 5 using the form-fallback endpoints
   (`searchCatalogForMention` → `confirmReference` → `getComparison` /
   `getUpgradeRecommendation`) instead of the chat tools.
2. **Expect**: identical results to the chat-driven scenarios for the same
   inputs — same parity guarantee 005 establishes for discover.

## Success criteria mapped

| Quickstart scenario | Spec success criterion                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| 2                   | SC-001 (confirmed comparison in ≤3 steps), SC-002 (zero unconfirmed compares) |
| 4                   | SC-004 (zero unbacked character claims)                                       |
| 5, 6                | SC-003 (upgrade returns valid same-family candidate or explicit none)         |
| 2, 5                | SC-005 (Bach 37 vs YTR-8335 canonical scenario)                               |
