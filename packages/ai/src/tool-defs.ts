import { toolDefinition } from '@tanstack/ai';
import { toStandardJsonSchema } from '@valibot/to-json-schema';

import {
  CollectAnswersInputSchema,
  CollectAnswersOutputSchema,
  RecommendInstrumentsInputSchema,
  RecommendationResultSchema,
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
