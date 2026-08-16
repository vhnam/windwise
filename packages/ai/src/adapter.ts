import { createOpenaiChat } from '@tanstack/ai-openai';

import { DEFAULT_LLM_MODEL } from '#/constants.ts';
import { ProviderUnavailableError } from '#/errors.ts';

export function createConsultationAdapter() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ProviderUnavailableError();
  }
  return createOpenaiChat(DEFAULT_LLM_MODEL, apiKey);
}
