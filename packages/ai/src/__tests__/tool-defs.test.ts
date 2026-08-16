import { describe, expect, it } from 'vite-plus/test';

import {
  collectAnswersToolDef,
  compareModelsToolDef,
  confirmMentionToolDef,
  recommendInstrumentsToolDef,
  resolveMentionToolDef,
  suggestUpgradeToolDef,
} from '../tool-defs.ts';

function hasJsonSchemaConverter(schema: unknown) {
  if (typeof schema !== 'object' || schema === null || !('~standard' in schema)) {
    return false;
  }
  const standard = schema['~standard'];
  return (
    typeof standard === 'object' &&
    standard !== null &&
    'jsonSchema' in standard &&
    typeof standard.jsonSchema === 'object' &&
    standard.jsonSchema !== null &&
    'input' in standard.jsonSchema &&
    typeof standard.jsonSchema.input === 'function'
  );
}

describe('tool definitions', () => {
  it('exposes Standard JSON Schema converters for TanStack AI', () => {
    const collectAnswers = collectAnswersToolDef.client();
    const recommendInstruments = recommendInstrumentsToolDef.client();
    const resolveMention = resolveMentionToolDef.client();
    const confirmMention = confirmMentionToolDef.client();
    const compareModels = compareModelsToolDef.client();
    const suggestUpgrade = suggestUpgradeToolDef.client();

    expect(hasJsonSchemaConverter(collectAnswers.inputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(collectAnswers.outputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(recommendInstruments.inputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(recommendInstruments.outputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(resolveMention.inputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(resolveMention.outputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(confirmMention.inputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(confirmMention.outputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(compareModels.inputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(compareModels.outputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(suggestUpgrade.inputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(suggestUpgrade.outputSchema)).toBe(true);
  });
});
