import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const createOpenaiChat = vi.fn((model: string, apiKey: string) => ({ model, apiKey }));

vi.mock('@tanstack/ai-openai', () => ({
  createOpenaiChat,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  createOpenaiChat.mockClear();
});

describe('createConsultationAdapter', () => {
  it('builds the adapter from package-owned model and provider config', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    const { createConsultationAdapter } = await import('../adapter.ts');
    const { DEFAULT_LLM_MODEL } = await import('../constants.ts');

    expect(createConsultationAdapter()).toEqual({ model: DEFAULT_LLM_MODEL, apiKey: 'sk-test' });
    expect(createOpenaiChat).toHaveBeenCalledWith(DEFAULT_LLM_MODEL, 'sk-test');
  });

  it('throws ProviderUnavailableError when the provider key is missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const { createConsultationAdapter } = await import('../adapter.ts');
    const { ProviderUnavailableError } = await import('../errors.ts');

    expect(() => createConsultationAdapter()).toThrow(ProviderUnavailableError);
    expect(createOpenaiChat).not.toHaveBeenCalled();
  });
});
