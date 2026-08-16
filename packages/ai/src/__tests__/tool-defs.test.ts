import { describe, expect, it } from 'vite-plus/test';

import { collectAnswersToolDef, recommendInstrumentsToolDef } from '../tool-defs.ts';

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

    expect(hasJsonSchemaConverter(collectAnswers.inputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(collectAnswers.outputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(recommendInstruments.inputSchema)).toBe(true);
    expect(hasJsonSchemaConverter(recommendInstruments.outputSchema)).toBe(true);
  });
});
