# Contract: Compare & Upgrade Form Fallback Server Functions

Extends
[005's form-fallback contract](../../005-guided-instrument-consultation/contracts/form-fallback.md).
These mirror the AI tools exactly (same server-side gates, same `@windwise/core`
functions), so a visitor without LLM access can still compare or upgrade — the
platform's non-AI-fallback principle (spec 005 FR-007) applies here too even
though it is not separately re-stated as an FR in spec 006.

## `searchCatalogForMention`

```ts
input: { text: string }
output: { candidates: MentionCandidate[] }   // same shape as resolveMention
```

## `confirmReference`

```ts
input: {
  sessionId: string;
  candidateModelId: string;
}
output: {
  confirmed: true;
}
```

## `getComparison`

```ts
input: { sessionId: string; modelIds: string[]; focus?: ComparisonAspect[] }
output: ComparisonResult | { error: 'UNCONFIRMED_MODEL'; unconfirmedIds: string[] }
```

Uses the exact same `confirmed-model-ids.ts` query and `compareModelsCore()`
call as the `compareModels` tool — no separate confirmation logic (research.md
§2).

## `getUpgradeRecommendation`

```ts
input: {
  sessionId: string
  currentModelId: string
  reason: string
  currentLevel: Criteria['level']
  upgradeBudget: Criteria['budget']
}
output: { runId: string; items: RecommendationItem[] } | { error: 'UNCONFIRMED_MODEL' | 'NO_UPGRADE_AVAILABLE' }
```
