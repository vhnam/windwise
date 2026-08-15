# Phase 1 Data Model: Instrument Compare & Upgrade Flows

Extends [005's data model](../005-guided-instrument-consultation/data-model.md).
Entities already defined there (`InstrumentModel`, `PricePoint`,
`ConsultationSession`, `RecommendationRun`/`Item`) are reused unchanged; only
new/modified entities are described here.

## ModelAlias (`@windwise/db`, new)

| Field      | Type                          | Notes                               |
| ---------- | ----------------------------- | ----------------------------------- |
| `id`       | uuid                          |                                     |
| `model_id` | uuid (fk → instrument_models) |                                     |
| `alias`    | text                          | e.g. `"bach strad 37"`, `"ytr8335"` |
| `locale`   | text                          | `vi \| en`, unique with `alias`     |

Seeded alongside 005's minimal model seed for the models named in the platform
plan's canonical scenario ("Bach 37 vs. Yamaha YTR-8335").

## ModelComparisonNote (`@windwise/db`, new)

| Field                      | Type                                                     | Notes                                                         |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `id`                       | uuid                                                     |                                                               |
| `model_a_id`, `model_b_id` | uuid (fk)                                                | unordered pair, normalized lesser-id-first on write           |
| `aspect`                   | enum: `tone \| weight_response \| projection \| general` |                                                               |
| `note_vi`, `note_en`       | text                                                     | human-authored, reviewed (spec FR-005)                        |
| `source_id`                | uuid (fk → sources)                                      |                                                               |
| `author`, `reviewed_by`    | text                                                     |                                                               |
| `published_at`             | timestamp                                                | only published notes are ever returned by `compareModelsCore` |

## ConsultationSession (extended)

Adds two fields to the entity 005 defined:

| Field                 | Type                                   | Notes                                                                                         |
| --------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `intent`              | enum: `discover \| compare \| upgrade` | already anticipated in 005's schema; this feature is the first to write non-`discover` values |
| `reference_model_ids` | uuid[]                                 | populated for compare/upgrade once confirmed                                                  |

## ConfirmedReference (`@windwise/db`, new)

The session-scoped confirmation gate state (research.md §2).

| Field          | Type      | Notes |
| -------------- | --------- | ----- |
| `session_id`   | uuid (fk) |       |
| `model_id`     | uuid (fk) |       |
| `confirmed_at` | timestamp |       |

Unique on `(session_id, model_id)`. `compareModels` and `suggestUpgrade` both
read this table via the single shared `confirmed-model-ids.ts` query
(research.md §2) before proceeding.

## MentionCandidate (in-memory shape, `@windwise/schemas`)

Not persisted — the ranked output of `resolveMention()`.

| Field          | Type       | Notes                           |
| -------------- | ---------- | ------------------------------- |
| `modelId`      | uuid       |                                 |
| `displayName`  | text       |                                 |
| `confidence`   | number 0-1 | deterministic similarity score  |
| `matchedAlias` | text       | which alias/name string matched |

## ComparisonResult (in-memory shape, `@windwise/schemas`)

Output of `compareModelsCore()`.

| Field                | Type                                       | Notes                                                                          |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| `models`             | array of `{ modelId, specs, tier, price }` | pure diff from `instrument_models` + `price_points`                            |
| `notes`              | array of `{ aspect, note_vi, note_en }`    | only aspects with a published `ModelComparisonNote`; empty array if none exist |
| `highlightedAspects` | array of `ComparisonAspect`                | derived from the visitor's stated priority (spec FR-006)                       |

## UpgradeCriteria (in-memory shape, `@windwise/schemas`)

Input to `suggestUpgrade()`.

| Field            | Type                                     | Notes                                         |
| ---------------- | ---------------------------------------- | --------------------------------------------- |
| `currentModelId` | uuid                                     | must be a confirmed reference                 |
| `reason`         | text                                     | free-text, normalized like other chat answers |
| `currentLevel`   | enum, same as `Criteria.level` from 005  |                                               |
| `upgradeBudget`  | enum, same as `Criteria.budget` from 005 |                                               |

## State Transitions

```text
ConsultationSession.intent: set once at session creation, never changes
  (discover | compare | upgrade)

ConfirmedReference: created only via confirmMention; never updated, only
  read. A session with intent = compare|upgrade cannot proceed to
  compareModels/suggestUpgrade until at least one (compare: two) confirmed
  references exist for the model IDs being acted on.

MentionCandidate: never persisted — recomputed on each resolveMention call,
  deterministic for a fixed catalog snapshot (research.md §1).
```
