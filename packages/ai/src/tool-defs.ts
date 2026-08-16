import { toolDefinition } from '@tanstack/ai';
import { toStandardJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';

import {
  CollectAnswersInputSchema,
  CollectAnswersOutputSchema,
  CompareInput,
  CompareModelsOutputSchema,
  ConfirmInput,
  ConfirmOutputSchema,
  MentionCandidateSchema,
  MentionInput,
  RecommendInstrumentsInputSchema,
  RecommendationResultSchema,
  SuggestUpgradeOutputSchema,
  UpgradeCriteriaSchema,
} from '@windwise/schemas';

export const collectAnswersToolDef = toolDefinition({
  name: 'collectAnswers',
  description: 'Normalize a visitor chat message into structured consultation criteria.',
  inputSchema: toStandardJsonSchema(CollectAnswersInputSchema),
  outputSchema: toStandardJsonSchema(CollectAnswersOutputSchema),
});

export const recommendInstrumentsToolDef = toolDefinition({
  name: 'recommendInstruments',
  description: 'Run the shared recommendation engine once required criteria are present.',
  inputSchema: toStandardJsonSchema(RecommendInstrumentsInputSchema),
  outputSchema: toStandardJsonSchema(RecommendationResultSchema),
});

export const resolveMentionToolDef = toolDefinition({
  name: 'resolveMention',
  description: 'Resolve free-text instrument mentions to ranked catalog candidates. Never auto-confirms.',
  inputSchema: toStandardJsonSchema(MentionInput),
  outputSchema: toStandardJsonSchema(v.array(MentionCandidateSchema)),
});

export const confirmMentionToolDef = toolDefinition({
  name: 'confirmMention',
  description: 'Record an explicit visitor confirmation of a catalog model for this session.',
  inputSchema: toStandardJsonSchema(ConfirmInput),
  outputSchema: toStandardJsonSchema(ConfirmOutputSchema),
});

export const compareModelsToolDef = toolDefinition({
  name: 'compareModels',
  description: 'Compare confirmed catalog models. Refuses any model not confirmed in this session.',
  inputSchema: toStandardJsonSchema(CompareInput),
  outputSchema: toStandardJsonSchema(CompareModelsOutputSchema),
});

export const suggestUpgradeToolDef = toolDefinition({
  name: 'suggestUpgrade',
  description: 'Recommend same-family, same-or-higher-tier models from a confirmed current instrument.',
  inputSchema: toStandardJsonSchema(UpgradeCriteriaSchema),
  outputSchema: toStandardJsonSchema(SuggestUpgradeOutputSchema),
});
