# Phase 1 Data Model: Consultation Question Flow & Prompt Version Management

Promotes 005's minimal single-row `QuestionSet`/`Question` (005 data-model.md)
into the full versioned entities below, and introduces `PromptVersion`
(referenced but not populated by anything other than a single seed row until
now, per 005's TR-6 pin).

## QuestionSet (`@windwise/db`)

| Field          | Type                       | Notes                                                              |
| -------------- | -------------------------- | ------------------------------------------------------------------ |
| `id`           | uuid                       |                                                                    |
| `version`      | int                        |                                                                    |
| `status`       | enum: `draft \| published` | exactly one published at a time, same pattern as 009's `rule_sets` |
| `published_at` | timestamp                  |                                                                    |
| `note`         | text                       |                                                                    |

## Question (`@windwise/db`)

| Field                                          | Type                                                    | Notes                                                                       |
| ---------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`                                           | uuid                                                    |                                                                             |
| `question_set_id`                              | uuid (fk)                                               |                                                                             |
| `key`                                          | text                                                    | e.g. `level`, `purpose` — matches `Criteria` field names from 005's schemas |
| `sort_order`                                   | int                                                     |                                                                             |
| `type`                                         | enum: `single \| multi \| number \| range \| free_text` |                                                                             |
| `prompt_vi`, `prompt_en`, `help_vi`, `help_en` | text                                                    |                                                                             |
| `required`                                     | boolean                                                 |                                                                             |
| `visible_when`                                 | jsonb, nullable                                         | same Condition AST shape as 009's `rules.condition` (research.md §1)        |

## QuestionOption (`@windwise/db`)

| Field                  | Type      | Notes                                                                 |
| ---------------------- | --------- | --------------------------------------------------------------------- |
| `id`                   | uuid      |                                                                       |
| `question_id`          | uuid (fk) |                                                                       |
| `label_vi`, `label_en` | text      |                                                                       |
| `sort_order`           | int       |                                                                       |
| `domain_path`          | text      | e.g. `purpose.jazz` — the value written into `Criteria` when selected |

## PromptVersion (`@windwise/db`, new)

| Field          | Type                                       | Notes                                                                         |
| -------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| `id`           | uuid                                       |                                                                               |
| `key`          | text                                       | which prompt this is a version of (e.g., the main consultation system prompt) |
| `version`      | int                                        |                                                                               |
| `status`       | enum: `draft \| experimental \| published` | only `published` is read by live traffic (research.md §2)                     |
| `content`      | text                                       |                                                                               |
| `created_by`   | uuid (fk)                                  |                                                                               |
| `published_at` | timestamp, nullable                        |                                                                               |

## ConsultationSession (extended, from 005/006)

No new fields — this feature is the first to exercise the `question_set_id` pin
(005 data-model.md) against a _changing_ set of published question sets, rather
than a single unchanging seed row.

```text
consultation_sessions.question_set_id  # written once at creation, never updated
```

## RecommendationRun (extended, from 005)

No new fields — `prompt_version_id` (already in 005's schema per TR-6) is now
written from a real, manager-published `PromptVersion.id` instead of a single
hardcoded seed value.

## ReplaySession (in-memory, `@windwise/schemas`, non-persisted)

Output shape for both preview and replay (research.md §4) — never written to any
table.

```ts
{
  mode: 'preview' | 'replay'
  questionSetId: string          // draft or published, for preview
  promptVersionId?: string       // for replay against an experimental version
  steps: Array<{
    questionKey: string
    shown: boolean               // reflects visible_when evaluation
    simulatedAnswer?: string     // for replay, taken from the original consultation_answers
  }>
  originalTranscript?: ConversationLogEntry[]   // for replay — read-only reference, from 011's conversation_logs
}
```

## State Transitions

```text
QuestionSet.status:
  (new/edit) --always--> draft
  draft --publish (blocked if any visible_when references a removed question, spec FR-008)--> published
    # demotes previously published row; exactly one published at a time

PromptVersion.status:
  (new) --always--> draft
  draft --mark experimental--> experimental      # usable by playground/replay, never by live traffic
  experimental --publish--> published            # becomes active for new live consultations
  published --rollback (research.md §5: copy-then-publish)--> (new row) published

ConsultationSession.question_set_id: immutable after creation (spec FR-004)
RecommendationRun.prompt_version_id: immutable after creation (inherited from 005's TR-6 pin)

ReplaySession / preview walkthrough: never persisted, never transitions
  any real entity's state (spec FR-010/FR-011)
```

## Publish-Time Validation (spec FR-008)

Before a `QuestionSet` transitions draft → published:

1. Every `visible_when` condition's referenced question `key` exists within the
   same question set.
2. Every `Condition` passes the shared `ast-schema.ts` validator (research.md
   §1) — depth/operator constraints identical to 009's rules.

Before removing a `QuestionOption` (spec FR-009, not a hard block):

1. Check whether any `enabled` rule in the currently published `rule_set` (009's
   table) references this option's `domain_path`.
2. If so, surface a warning requiring explicit confirmation before the removal
   proceeds.
