# Phase 1 Data Model: Consultation Observability & Evaluation Suites

Reads (never writes) the consultation/recommendation entities already modeled in
[005](../005-guided-instrument-consultation/data-model.md) and
[006](../006-instrument-compare-upgrade/data-model.md), plus a `ConversationLog`
entity assumed to already exist as a byproduct of `@windwise/ai`'s chat tool
infrastructure (referenced, not newly defined, per research.md §5). New entities
below are all evaluation-domain.

## EvalSuite (`@windwise/db`, new)

| Field                 | Type                                    | Notes                                             |
| --------------------- | --------------------------------------- | ------------------------------------------------- |
| `id`                  | uuid                                    |                                                   |
| `name`, `description` | text                                    |                                                   |
| `kind`                | enum: `deterministic \| conversational` | governs which runner (research.md §2) executes it |

## EvalCase (`@windwise/db`, new)

| Field           | Type                                   | Notes                                                                                                       |
| --------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `id`            | uuid                                   | stable identity across suite edits — used by the regression comparison (research.md §3)                     |
| `suite_id`      | uuid (fk)                              |                                                                                                             |
| `criteria`      | jsonb                                  | same `Criteria` shape as 005, or `MentionInput`/`UpgradeCriteria` shape from 006 depending on scenario type |
| `scenario_type` | enum: `discover \| compare \| upgrade` | ensures compare/upgrade coverage per spec Edge Cases                                                        |
| `expected`      | text[]                                 | family/model identifiers that MUST appear (e.g., in top-3)                                                  |
| `forbidden`     | text[]                                 | family/model identifiers that MUST NOT appear                                                               |
| `weight`        | numeric, nullable                      |                                                                                                             |
| `note`          | text                                   |                                                                                                             |

## EvalRun (`@windwise/db`, new)

| Field                            | Type                                    | Notes                                                   |
| -------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| `id`                             | uuid                                    |                                                         |
| `suite_id`                       | uuid (fk)                               |                                                         |
| `kind`                           | enum: `deterministic \| conversational` |                                                         |
| `rule_set_id`, `question_set_id` | uuid (fk)                               | version pins, deterministic suites always specify these |
| `prompt_version_id`              | uuid (fk), nullable                     | conversational suites only                              |
| `engine_version`                 | text                                    |                                                         |
| `started_at`, `finished_at`      | timestamp                               |                                                         |
| `summary`                        | jsonb                                   | aggregate metrics (research.md §4)                      |

## EvalResult (`@windwise/db`, new)

| Field     | Type      | Notes                                               |
| --------- | --------- | --------------------------------------------------- |
| `run_id`  | uuid (fk) |                                                     |
| `case_id` | uuid (fk) |                                                     |
| `passed`  | boolean   |                                                     |
| `actual`  | jsonb     | what the engine/chat actually returned              |
| `diff`    | jsonb     | expected/forbidden vs. actual, populated on failure |

## RegressionComparison (in-memory shape, `@windwise/schemas`)

Output of `compare-runs.ts` (research.md §3) — not persisted as its own table;
computed on demand from two `EvalRun`s' `EvalResult` rows.

```ts
{
  baselineRunId: string;
  currentRunId: string;
  cases: Array<{
    caseId: string;
    classification:
      "new" | "removed" | "regressed" | "fixed" | "stable-pass" | "stable-fail";
  }>;
  regressedCount: number; // the number surfaced as the primary failure signal (spec FR-009)
}
```

## MetricsSummary (in-memory shape, `@windwise/schemas`)

Output of `metrics.ts` (research.md §4), attached to `EvalRun.summary`.

```ts
{
  recommendationAccuracy: {
    type: "quality";
    value: number;
  } // platform §5.7 formula
  constraintViolations: {
    type: "invariant";
    value: number;
  } // target: 0
  invalidToolCalls: {
    type: "quality";
    value: number;
  }
  hallucinatedCatalogData: {
    type: "invariant";
    value: number;
  } // target: 0
  completionRate: {
    type: "quality";
    value: number;
  }
}
```

`type: 'invariant'` fields are rendered/reported as pass/fail gates;
`type: 'quality'` fields are rendered as tracked-over-time numbers (research.md
§4).

## ConsultationSearchResult (in-memory shape, `@windwise/schemas`)

Output of `search-consultations.ts`.

```ts
{
  sessionId: string;
  startedAt: string;
  status: "in_progress" | "completed" | "abandoned";
  intent: "discover" | "compare" | "upgrade";
  criteria: Criteria | null;
  hasTranscript: boolean;
}
```

## AnalyticsSummary (in-memory shape, `@windwise/schemas`)

Output of `analytics-summary.ts`.

```ts
{
  dateRange: {
    from: string;
    to: string;
  }
  volume: number;
  completionRate: number;
  dropOffByStep: Array<{ questionKey: string; abandonCount: number }>;
  mostRecommendedFamilies: Array<{ familySlug: string; count: number }>;
  clickThroughRate: number;
  showOtherOptionsRate: number;
}
```

## State Transitions

```text
EvalSuite / EvalCase: no lifecycle of their own beyond ordinary CRUD
  (unlike RuleSet/QuestionSet/PromptVersion, eval suites don't gate
  live traffic — they gate CI/merge decisions, so "draft vs published"
  doesn't apply the same way)

EvalRun: created once per execution, immutable once finished — a re-run
  against the same suite+rule_set_id always creates a NEW EvalRun row,
  never updates a prior one, preserving the ability to compare across
  runs (research.md §3)
```
