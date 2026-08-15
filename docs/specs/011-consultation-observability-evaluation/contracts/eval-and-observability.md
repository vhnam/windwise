# Contract: Evaluation CLI & Observability Server Functions

## `packages/eval` CLI (`cli.ts`) — CI entry point

```sh
npx windwise-eval run \
  --suite=<evalSuiteId> \
  --rule-set=<ruleSetId> \
  --question-set=<questionSetId> \
  [--compare-to=<priorEvalRunId>]

# exit code 0 if no case failed AND (no --compare-to, OR regressedCount = 0)
# exit code 1 otherwise — this is what gates the PR (spec SC-002)
```

Output (stdout, machine-readable JSON + human summary):

```ts
{
  runId: string
  passed: number; failed: number; total: number
  metrics: MetricsSummary          // see data-model.md
  regression?: RegressionComparison  // present only when --compare-to given
}
```

**Guarantee**: this command never imports or calls anything from `@windwise/ai`
(research.md §2) — enforced at build time by the package's dependency graph, not
a runtime flag.

## `runDeterministicSuite` (library API, called by CI's `cli.ts` and by dashboard on-demand runs)

```ts
input: { suiteId: string; ruleSetId: string; questionSetId: string }
output: { runId: string; results: EvalResult[]; metrics: MetricsSummary }
```

Calls `@windwise/core`'s `recommend()`/`resolveMention()`/
`compareModelsCore()`/`suggestUpgrade()` directly per case, based on each case's
`scenario_type` (data-model.md).

## `runConversationalSuite` (dashboard-only, nightly or on-demand)

```ts
input: { suiteId: string; ruleSetId: string; questionSetId: string; promptVersionId: string; sampleRate?: number }
output: { runId: string; results: EvalResult[]; metrics: MetricsSummary }
```

Requires role `editor` or above (`apps/manager-dashboard`). Invokes the real
chat/tool infrastructure from `@windwise/ai` — costs money and time, per
platform §2.3, so `sampleRate` bounds how much of the suite actually runs
against the live LLM.

## `compareEvalRuns`

```ts
input: {
  baselineRunId: string;
  currentRunId: string;
}
output: RegressionComparison; // see data-model.md
```

## `searchConsultations`

```ts
input: { dateFrom?: string; dateTo?: string; sessionId?: string; status?: 'in_progress' | 'completed' | 'abandoned' }
output: { results: ConsultationSearchResult[] }
```

Readable by role `viewer` and above.

## `getConsultationDetail`

```ts
input: { sessionId: string }
output: {
  criteria: Criteria | null
  recommendation: RecommendationItem[] | null
  versions: { ruleSetId: string; questionSetId: string; promptVersionId: string; engineVersion: string; llmModel: string }
  transcript: ConversationLogEntry[] | null   // present only for chat-based consultations
}
```

Readable by role `viewer` and above. Sources `transcript` from the existing
conversation-log records `@windwise/ai` already writes during normal chat
operation (research.md §5) — this function does not create or modify any of
them.

## `getAnalyticsSummary`

```ts
input: {
  dateFrom: string;
  dateTo: string;
}
output: AnalyticsSummary; // see data-model.md
```

Readable by role `viewer` and above. Returns zero-valued fields (not an error)
for a date range with no consultations (spec Edge Cases).
