# Phase 1 Data Model: Guided Instrument Consultation

Scoped to this feature only. Full catalog/pricing/rules/flow domain lives in the
platform plan §3; only the entities and fields this feature's engine and
persistence layer actually touch are modeled here. Later features (006-011)
extend these same tables rather than replacing them.

## Criteria (in-memory / tool I/O shape, `@windwise/schemas`)

The structured input to `recommend()`. Not a table — this is the Valibot shape
shared by chat tool input, form submission, and stored as
`recommendation_runs.criteria` (jsonb).

| Field                | Type                                                                        | Required | Notes                                                      |
| -------------------- | --------------------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| `level`              | enum: `beginner \| 1_3_years \| advanced \| professional`                   | yes      | Maps to `level_tier` filtering                             |
| `purpose`            | enum: `school \| concert_band \| jazz \| orchestra \| marching \| personal` | yes      | Drives family scoring                                      |
| `budget`             | enum: `under_20m \| 20_50m \| 50_100m \| over_100m` (VND)                   | yes      | Hard filter                                                |
| `age`                | enum: age band                                                              | no       | Size/weight constraint input                               |
| `section_preference` | enum: `undecided \| brass \| woodwind \| <family_slug>`                     | no       | Skips family-stage scoring when a specific family is given |
| `physical_notes`     | array of enum: `braces \| small_hands \| asthma`                            | no       | Softens/excludes specific families                         |

Validation: a recursive Valibot object schema; `recommendInstruments` rejects
(server-side, per TR-4) any call missing `level`/`purpose`/`budget`.

## InstrumentFamily (read-only subset of platform §3.2, `@windwise/db`)

| Field                 | Type                      | Notes                     |
| --------------------- | ------------------------- | ------------------------- |
| `id`                  | uuid                      |                           |
| `slug`                | text                      |                           |
| `section`             | enum: `brass \| woodwind` |                           |
| `name_vi`, `name_en`  | text                      |                           |
| `beginner_difficulty` | int 1-5                   |                           |
| `min_recommended_age` | int                       |                           |
| `physical_demand`     | int 1-5                   |                           |
| `typical_ensembles`   | text[]                    | matched against `purpose` |

Seeded manually for v1 scope (4 families per platform plan M0 exit criterion:
trumpet, clarinet, flute, alto sax); full 14-family/60-90-model seed is a
content task, not part of this feature's code.

## InstrumentModel (read-only subset, `@windwise/db`)

| Field                        | Type                                                      | Notes                                      |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| `id`                         | uuid                                                      |                                            |
| `brand_id`, `family_id`      | uuid (fk)                                                 |                                            |
| `model_code`, `display_name` | text                                                      |                                            |
| `level_tier`                 | enum: `student \| intermediate \| professional \| custom` |                                            |
| `status`                     | enum: `draft \| in_review \| published \| archived`       | consultation engine only reads `published` |
| `last_verified_at`           | timestamp                                                 | surfaced as a trust signal (FR-009)        |
| `variant_of_model_id`        | uuid, nullable                                            | groups near-duplicate variants             |

This feature reads this table; it does not implement the authoring/review
workflow that writes it (see [008](../008-catalog-management-workflow/spec.md)).
A minimal seed script inserts a handful of `published` rows so this feature is
testable end-to-end.

## PricePoint (read-only subset, `@windwise/db`)

| Field                      | Type                             | Notes                                                                                                           |
| -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `model_id`                 | uuid (fk)                        |                                                                                                                 |
| `scope`                    | enum: `msrp_global \| vn_street` | budget filtering prefers `vn_street` (FR-006 in 007, but the same rule applies to consultation budget matching) |
| `amount_min`, `amount_max` | numeric                          |                                                                                                                 |
| `is_current`               | boolean                          |                                                                                                                 |

## RuleSet / Rule (minimal v0, `@windwise/core` + `@windwise/db`)

v0 ships as a single seeded "version 1" published rule set (see research.md §2)
with a small fixed list of constraint/modifier rules. The storage shape matches
platform plan §3.4 so 009 can extend it without a migration rewrite:

| Field                                      | Type                                                                                            | Notes                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `rule_set_id`                              | uuid                                                                                            | one row, `status = published` for v0              |
| `kind`                                     | enum: `constraint \| modifier`                                                                  |                                                   |
| `target`                                   | enum: `family \| model \| brand`                                                                |                                                   |
| `condition`                                | jsonb (fixed-operator AST)                                                                      |                                                   |
| `effect`                                   | jsonb: `{type: score, delta}` \| `{type: exclude, reason_key}` \| `{type: require, reason_key}` |                                                   |
| `reason_template_vi`, `reason_template_en` | text                                                                                            | rendered into FR-005's plain-language explanation |

## QuestionSet / Question (minimal v0, `@windwise/db`)

v0 ships one seeded, published `question_set` covering exactly the six criteria
fields above (three required, three optional), so
`consultation_sessions.question_set_id` has something real to pin to.
Reordering, conditional visibility, and the authoring UI are
[010](../010-consultation-flow-configuration/spec.md)'s scope.

## ConsultationSession

| Field                        | Type                                          | Notes                                    |
| ---------------------------- | --------------------------------------------- | ---------------------------------------- |
| `id`                         | uuid                                          |                                          |
| `anon_id`                    | text                                          | session cookie ID only — no PII (FR-012) |
| `question_set_id`            | uuid (fk)                                     | pinned at creation, never changes        |
| `intent`                     | enum: `discover \| compare \| upgrade`        | this feature always writes `discover`    |
| `locale`                     | text                                          | `vi` for v1                              |
| `started_at`, `completed_at` | timestamp                                     |                                          |
| `status`                     | enum: `in_progress \| completed \| abandoned` |                                          |

## ConsultationAnswer

| Field              | Type                 | Notes                                                |
| ------------------ | -------------------- | ---------------------------------------------------- |
| `session_id`       | uuid (fk)            |                                                      |
| `question_key`     | text                 | e.g. `level`, `purpose`                              |
| `raw_value`        | text                 | original free text or form value                     |
| `normalized_value` | text                 | after `collectAnswers` normalization                 |
| `source`           | enum: `chat \| form` | used by the parity integration test (research.md §3) |

## RecommendationRun

| Field                                                                                | Type      | Notes                                                    |
| ------------------------------------------------------------------------------------ | --------- | -------------------------------------------------------- |
| `id`                                                                                 | uuid      | this is the shareable `runId` in the result URL (FR-011) |
| `session_id`                                                                         | uuid (fk) |                                                          |
| `criteria`                                                                           | jsonb     | the Criteria shape above                                 |
| `rule_set_id`, `question_set_id`, `prompt_version_id`, `engine_version`, `llm_model` |           | version pins, per TR-6                                   |
| `latency_ms`                                                                         | int       |                                                          |
| `created_at`                                                                         | timestamp |                                                          |

## RecommendationItem

| Field                   | Type            | Notes                                                                                       |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `run_id`                | uuid (fk)       |                                                                                             |
| `rank`                  | int             |                                                                                             |
| `family_id`, `model_id` | uuid            |                                                                                             |
| `score`                 | numeric         |                                                                                             |
| `score_breakdown`       | jsonb           | full detail; consumer `publicView` omits `excluded_by` per TR-4's server-side tool contract |
| `reasons`               | text[]          | rendered from matched rules' `reason_template_vi/en`                                        |
| `excluded_by`           | jsonb, nullable | present only in internal/manager views (out of scope for consumer app, relevant to 009)     |

## State Transitions

```text
ConsultationSession.status:
  in_progress --(all required criteria answered + run persisted)--> completed
  in_progress --(visitor leaves without completing)--> abandoned  [analytics only, out of scope here]

RecommendationRun: immutable once created — "show other options" (FR-006)
  reads the next-ranked items from the SAME run, it does not create a new run.
```
