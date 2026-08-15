# Quickstart: Guided Instrument Consultation

Validation guide — proves the feature works end-to-end. Not an implementation
guide; see [data-model.md](./data-model.md) and [contracts/](./contracts/) for
the shapes referenced below.

## Prerequisites

- PostgreSQL running locally, `@windwise/db` migrations applied
- Minimal seed data loaded (see data-model.md): 4 instrument families, a handful
  of `published` models across student/intermediate/professional tiers, one
  seeded `rule_set` (v1, published), one seeded `question_set` (v1, published)
- `apps/consumer-application` running (`pnpm dev:consumer`)
- `OPENAI_API_KEY` / `GEMINI_API_KEY` set for the chat path (form path needs
  neither)

## Scenario 1 — Chat path produces a recommendation

1. Open the consultation chat entry point (`/consult`).
2. Answer: level = beginner, purpose = school, budget = under_20m.
3. **Expect**: `recommendInstruments` returns 2-3 items, each with a
   plain-language reason and a `lastVerifiedAt`/`sourceUrl` pair.
4. Ask "gợi ý khác" (other options).
5. **Expect**: the next-ranked items from the _same_ `runId` are shown — no new
   LLM generation call for the ranking itself (FR-006).

## Scenario 2 — Form path matches chat path exactly

1. Open the form fallback (`/form`) with the LLM provider intentionally
   disabled/misconfigured to prove FR-007.
2. Submit the identical answers from Scenario 1 via `submitAnswer` →
   `getRecommendation`.
3. **Expect**: the returned `items` are identical (family, model, rank, reasons)
   to Scenario 1's chat result, modulo `runId` — this is the chat/form parity
   check from research.md §3 and spec SC-004.

## Scenario 3 — Missing required criteria is refused, not guessed

1. Call `getRecommendation` (or `recommendInstruments`) after answering only
   `level`.
2. **Expect**:
   `{ error: 'INSUFFICIENT_CRITERIA', missing: ['purpose', 'budget'] }` — no
   fabricated recommendation (FR-008).

## Scenario 4 — Hard constraint cannot be out-scored

1. Seed a candidate that both matches a large positive modifier (e.g., strong
   purpose fit) and an active exclusion constraint (e.g., `min_recommended_age`
   above the stated `age`).
2. Run a recommendation with criteria that trigger both.
3. **Expect**: the candidate does not appear in `items` at all — verifies the
   constraint/modifier split (research.md §2) actually vetoes rather than merely
   penalizing.

## Scenario 5 — Shareable result is stable across catalog changes

1. Complete a consultation, note the `runId` / result URL.
2. Change the underlying model's `last_verified_at` or price in the catalog
   (simulating a later catalog update).
3. Reload the shared result URL (`getSharedResult`).
4. **Expect**: the originally shown items/reasons are unchanged — the page reads
   the persisted `recommendation_items`, not a live re-run (FR-011).

## Scenario 6 — No instrument satisfies combined criteria

1. Submit criteria engineered to exclude every seeded candidate (e.g., an age
   band below every family's `min_recommended_age` in the seed set).
2. **Expect**: `{ error: 'NO_MATCH', limitingConstraint: '<specific field>' }` —
   a plain, specific explanation, not an empty grid or a crash (FR-013).

## Scenario 7 — Output validator blocks unsourced catalog data

1. (Test-only) Stub the chat model to emit a model code or price not present in
   the last `recommendInstruments` tool result.
2. **Expect**: the assistant's shown message does not contain that unsourced
   token — either a regenerated message or the templated fallback is shown
   instead (research.md §5).

## Success criteria mapped

| Quickstart scenario | Spec success criterion                                             |
| ------------------- | ------------------------------------------------------------------ |
| 1                   | SC-001 (time to first recommendation)                              |
| 2                   | SC-004 (form/chat parity)                                          |
| 3, 6                | SC-002 (non-empty result on satisfied criteria; explicit no-match) |
| 4                   | correctness invariant underlying SC-002                            |
| 5                   | SC-005 (shared result stability)                                   |
| 1, 5                | SC-003 (trust info always present)                                 |
