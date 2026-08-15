# Contract: Form Fallback Server Functions (`apps/consumer-application`)

Non-AI path required by spec FR-007. These are plain TanStack Start server
functions, not AI tools — no LLM call anywhere in this path. They call the exact
same `@windwise/core` `recommend()` and `@windwise/db` queries the AI tools use,
which is what makes chat/form parity (research.md §3) provable.

## `submitAnswer`

```ts
input: {
  sessionId: string
  question_key: 'level' | 'purpose' | 'budget' | 'age' | 'section_preference' | 'physical_notes'
  value: string
}

output: {
  satisfied: boolean
  missing: string[]
  nextQuestion: { key: string; prompt_vi: string; prompt_en: string } | null
}
```

Persists to `consultation_answers` with `source = 'form'`. Validation and
persistence logic is shared with `collectAnswers` (same underlying `saveAnswers`
query in `@windwise/db`) — the two entry points differ only in how the input
arrives (structured form field vs. LLM-normalized text), not in what happens
after.

## `getRecommendation`

```ts
input: { sessionId: string }

output:
  | { runId: string; items: RecommendationItem[] }   // same shape as recommendInstruments
  | { error: 'INSUFFICIENT_CRITERIA'; missing: string[] }
  | { error: 'NO_MATCH'; limitingConstraint: string }
```

## `getOtherOptions`

```ts
input: { runId: string }

output: { items: RecommendationItem[] }   // next-ranked items from the SAME run (FR-006)
```

Reads `recommendation_items` for the existing `run_id` beyond what was already
shown; does not create a new `recommendation_run`.

## `getSharedResult`

Backing the shareable URL (FR-011). Route: `/result/$runId`.

```ts
input: { runId: string }

output:
  | { items: RecommendationItem[]; criteria: Criteria }
  | { error: 'NOT_FOUND' }
```

Reads exclusively from the persisted `recommendation_run` +
`recommendation_items` rows — never re-runs the engine against current catalog
state, so the result is stable even after the catalog changes (FR-011).
