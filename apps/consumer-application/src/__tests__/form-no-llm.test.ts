import { describe, expect, it, vi } from 'vite-plus/test';

const createOpenaiChat = vi.fn(() => {
  throw new Error('LLM provider must not be called on the form path');
});

vi.mock('@tanstack/ai-openai', () => ({
  createOpenaiChat,
  openaiText: createOpenaiChat,
}));

vi.mock('@tanstack/ai-gemini', () => ({
  geminiText: createOpenaiChat,
}));

vi.mock('#/lib/server/consultation', () => ({
  submitForm: vi.fn(),
}));

describe('form fallback does not call LLM providers', () => {
  it('can import the form route without touching provider SDKs', async () => {
    await import('../routes/form/index.tsx');
    expect(createOpenaiChat).not.toHaveBeenCalled();
  });
});
