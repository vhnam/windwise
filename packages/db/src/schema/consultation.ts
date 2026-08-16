import { integer, jsonb, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { instrumentFamilies, instrumentModels } from './catalog.ts';

export const sessionIntentEnum = pgEnum('session_intent', ['discover', 'compare', 'upgrade']);
export const sessionStatusEnum = pgEnum('session_status', ['in_progress', 'completed', 'abandoned']);
export const answerSourceEnum = pgEnum('answer_source', ['chat', 'form']);
export const ruleKindEnum = pgEnum('rule_kind', ['constraint', 'modifier']);
export const ruleTargetEnum = pgEnum('rule_target', ['family', 'model', 'brand']);
export const publishStatusEnum = pgEnum('publish_status', ['draft', 'published']);

export const questionSets = pgTable('question_sets', {
  id: uuid('id').primaryKey(),
  status: publishStatusEnum('status').notNull(),
});

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey(),
  questionSetId: uuid('question_set_id')
    .notNull()
    .references(() => questionSets.id),
  key: text('key').notNull(),
  required: integer('required').notNull(),
  promptVi: text('prompt_vi').notNull(),
});

export const consultationSessions = pgTable('consultation_sessions', {
  id: uuid('id').primaryKey(),
  anonId: text('anon_id').notNull(),
  questionSetId: uuid('question_set_id')
    .notNull()
    .references(() => questionSets.id),
  intent: sessionIntentEnum('intent').notNull(),
  locale: text('locale').notNull(),
  status: sessionStatusEnum('status').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const consultationAnswers = pgTable(
  'consultation_answers',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => consultationSessions.id),
    questionKey: text('question_key').notNull(),
    rawValue: text('raw_value').notNull(),
    normalizedValue: text('normalized_value').notNull(),
    source: answerSourceEnum('source').notNull(),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.questionKey] })],
);

export const ruleSets = pgTable('rule_sets', {
  id: uuid('id').primaryKey(),
  status: publishStatusEnum('status').notNull(),
});

export const rules = pgTable('rules', {
  id: uuid('id').primaryKey(),
  ruleSetId: uuid('rule_set_id')
    .notNull()
    .references(() => ruleSets.id),
  kind: ruleKindEnum('kind').notNull(),
  target: ruleTargetEnum('target').notNull(),
  condition: jsonb('condition').notNull(),
  effect: jsonb('effect').notNull(),
  reasonTemplateVi: text('reason_template_vi').notNull(),
  reasonTemplateEn: text('reason_template_en').notNull(),
});

export const recommendationRuns = pgTable('recommendation_runs', {
  id: uuid('id').primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => consultationSessions.id),
  criteria: jsonb('criteria').notNull(),
  ruleSetId: uuid('rule_set_id')
    .notNull()
    .references(() => ruleSets.id),
  questionSetId: uuid('question_set_id')
    .notNull()
    .references(() => questionSets.id),
  promptVersionId: text('prompt_version_id').notNull(),
  engineVersion: text('engine_version').notNull(),
  llmModel: text('llm_model').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  noMatch: jsonb('no_match'),
});

export const recommendationItems = pgTable('recommendation_items', {
  id: uuid('id').primaryKey(),
  runId: uuid('run_id')
    .notNull()
    .references(() => recommendationRuns.id),
  rank: integer('rank').notNull(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => instrumentFamilies.id),
  modelId: uuid('model_id')
    .notNull()
    .references(() => instrumentModels.id),
  score: numeric('score').notNull(),
  scoreBreakdown: jsonb('score_breakdown').notNull(),
  reasons: text('reasons').array().notNull(),
  excludedBy: jsonb('excluded_by'),
});
