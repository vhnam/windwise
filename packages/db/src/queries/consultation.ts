import { randomUUID } from 'node:crypto';

import { and, eq, sql } from 'drizzle-orm';
import * as v from 'valibot';

import type {
  CatalogSnapshot,
  Criteria,
  PublicRecommendationItem,
  RecommendationResult,
  Rule,
  RuleEffect,
  RuleSet,
  VersionPins,
} from '@windwise/schemas';
import { ConditionAstSchema, RuleEffectSchema } from '@windwise/schemas';

import type { Database } from '#/client.ts';
import {
  consultationAnswers,
  consultationSessions,
  instrumentFamilies,
  instrumentModels,
  pricePoints,
  questionSets,
  recommendationItems,
  recommendationRuns,
  ruleSets,
  rules,
} from '#/schema/index.ts';

export class NoPublishedCatalogError extends Error {
  readonly name = 'NoPublishedCatalogError';
  constructor(message = 'No published catalog is available') {
    super(message);
  }
}

export class NoPublishedRuleSetError extends Error {
  readonly name = 'NoPublishedRuleSetError';
  constructor(message = 'No published rule set is available') {
    super(message);
  }
}

export type ConsultationAnswerRecord = {
  sessionId: string;
  questionKey: string;
  rawValue: string;
  normalizedValue: string;
  source: 'chat' | 'form';
};

export type ConsultationSessionRecord = {
  id: string;
  anonId: string;
  questionSetId: string;
  intent: 'discover' | 'compare' | 'upgrade';
  locale: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt: Date | null;
};

export async function getSessionState(
  db: Database,
  sessionId: string,
): Promise<{ session: ConsultationSessionRecord | undefined; answers: ConsultationAnswerRecord[] }> {
  const [session] = await db.select().from(consultationSessions).where(eq(consultationSessions.id, sessionId)).limit(1);

  const answers = await db.select().from(consultationAnswers).where(eq(consultationAnswers.sessionId, sessionId));

  return {
    session: session
      ? {
          id: session.id,
          anonId: session.anonId,
          questionSetId: session.questionSetId,
          intent: session.intent,
          locale: session.locale,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
        }
      : undefined,
    answers: answers.map((row) => ({
      sessionId: row.sessionId,
      questionKey: row.questionKey,
      rawValue: row.rawValue,
      normalizedValue: row.normalizedValue,
      source: row.source,
    })),
  };
}

export async function createSession(
  db: Database,
  input: { questionSetId: string; intent: 'discover' | 'compare' | 'upgrade'; locale: string; anonId?: string },
): Promise<ConsultationSessionRecord> {
  const record: ConsultationSessionRecord = {
    id: randomUUID(),
    anonId: input.anonId ?? randomUUID(),
    questionSetId: input.questionSetId,
    intent: input.intent,
    locale: input.locale,
    status: 'in_progress',
    startedAt: new Date(),
    completedAt: null,
  };

  await db.insert(consultationSessions).values(record);
  return record;
}

export async function saveAnswers(db: Database, sessionId: string, answers: ConsultationAnswerRecord[]): Promise<void> {
  if (answers.length === 0) {
    return;
  }

  await db
    .insert(consultationAnswers)
    .values(answers.map((answer) => ({ ...answer, sessionId })))
    .onConflictDoUpdate({
      target: [consultationAnswers.sessionId, consultationAnswers.questionKey],
      set: {
        rawValue: sql`excluded.raw_value`,
        normalizedValue: sql`excluded.normalized_value`,
        source: sql`excluded.source`,
      },
    });
}

function manufacturerSourceUrl(modelCode: string): string {
  return `https://example.com/instruments/${encodeURIComponent(modelCode)}`;
}

export async function getPublishedCatalog(db: Database): Promise<CatalogSnapshot> {
  const families = await db.select().from(instrumentFamilies);
  const models = await db.select().from(instrumentModels).where(eq(instrumentModels.status, 'published'));
  const prices = await db.select().from(pricePoints);

  if (models.length === 0) {
    throw new NoPublishedCatalogError();
  }

  return {
    families: families.map((family) => ({
      id: family.id,
      slug: family.slug,
      section: family.section,
      nameVi: family.nameVi,
      nameEn: family.nameEn,
      beginnerDifficulty: family.beginnerDifficulty,
      minRecommendedAge: family.minRecommendedAge,
      physicalDemand: family.physicalDemand,
      typicalEnsembles: family.typicalEnsembles ?? [],
    })),
    models: models.map((model) => ({
      id: model.id,
      brandId: model.brandId,
      familyId: model.familyId,
      modelCode: model.modelCode,
      displayName: model.displayName,
      levelTier: model.levelTier,
      status: model.status,
      lastVerifiedAt: model.lastVerifiedAt.toISOString(),
      variantOfModelId: model.variantOfModelId,
      sourceUrl: manufacturerSourceUrl(model.modelCode),
    })),
    prices: prices
      .filter((price) => models.some((model) => model.id === price.modelId))
      .map((price) => ({
        modelId: price.modelId,
        scope: price.scope,
        amountMin: Number(price.amountMin),
        amountMax: Number(price.amountMax),
        isCurrent: price.isCurrent,
      })),
  };
}

export async function getPublishedQuestionSetId(db: Database): Promise<string> {
  const [row] = await db.select().from(questionSets).where(eq(questionSets.status, 'published')).limit(1);
  if (!row) {
    throw new Error('No published question set is available');
  }
  return row.id;
}

export async function getPublishedRuleSet(db: Database): Promise<RuleSet> {
  const [set] = await db.select().from(ruleSets).where(eq(ruleSets.status, 'published')).limit(1);
  if (!set) {
    throw new NoPublishedRuleSetError();
  }

  const rows = await db.select().from(rules).where(eq(rules.ruleSetId, set.id));

  return {
    ruleSetId: set.id,
    rules: rows.map((row): Rule => ({
      id: row.id,
      kind: row.kind,
      target: row.target,
      condition: v.parse(ConditionAstSchema, row.condition),
      effect: v.parse(RuleEffectSchema, row.effect) as RuleEffect,
      reasonTemplateVi: row.reasonTemplateVi,
      reasonTemplateEn: row.reasonTemplateEn,
    })),
  };
}

export async function persistRun(
  db: Database,
  result: RecommendationResult,
  pins: VersionPins & { sessionId: string; criteria: Criteria },
): Promise<{ runId: string }> {
  const runId = result.runId || randomUUID();
  const createdAt = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(recommendationRuns).values({
      id: runId,
      sessionId: pins.sessionId,
      criteria: pins.criteria,
      ruleSetId: pins.ruleSetId,
      questionSetId: pins.questionSetId,
      promptVersionId: pins.promptVersionId,
      engineVersion: pins.engineVersion,
      llmModel: pins.llmModel,
      latencyMs: pins.latencyMs,
      createdAt,
      noMatch: result.noMatch ?? null,
    });

    if (result.items.length > 0) {
      await tx.insert(recommendationItems).values(
        result.items.map((item) => ({
          id: randomUUID(),
          runId,
          rank: item.rank,
          familyId: item.familyId,
          modelId: item.modelId,
          score: String(item.score),
          scoreBreakdown: item.scoreBreakdown,
          reasons: item.reasons,
          excludedBy: null,
        })),
      );
    }

    await tx
      .update(consultationSessions)
      .set({ status: 'completed', completedAt: createdAt })
      .where(and(eq(consultationSessions.id, pins.sessionId), eq(consultationSessions.status, 'in_progress')));
  });

  return { runId };
}

export async function getRun(
  db: Database,
  runId: string,
): Promise<{
  run:
    | {
        id: string;
        sessionId: string;
        criteria: Criteria;
        ruleSetId: string;
        questionSetId: string;
        promptVersionId: string;
        engineVersion: string;
        llmModel: string;
        latencyMs: number;
        createdAt: Date;
        noMatch?: { limitingConstraint: string; suggestion: string };
      }
    | undefined;
  items: PublicRecommendationItem[];
}> {
  const [run] = await db.select().from(recommendationRuns).where(eq(recommendationRuns.id, runId)).limit(1);
  const items = await db.select().from(recommendationItems).where(eq(recommendationItems.runId, runId));

  return {
    run: run
      ? {
          id: run.id,
          sessionId: run.sessionId,
          criteria: run.criteria as Criteria,
          ruleSetId: run.ruleSetId,
          questionSetId: run.questionSetId,
          promptVersionId: run.promptVersionId,
          engineVersion: run.engineVersion,
          llmModel: run.llmModel,
          latencyMs: run.latencyMs,
          createdAt: run.createdAt,
          noMatch: (run.noMatch as { limitingConstraint: string; suggestion: string } | null) ?? undefined,
        }
      : undefined,
    items: items
      .map((item) => ({
        rank: item.rank,
        familyId: item.familyId,
        modelId: item.modelId,
        score: Number(item.score),
        scoreBreakdown: item.scoreBreakdown as PublicRecommendationItem['scoreBreakdown'],
        reasons: item.reasons ?? [],
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}
