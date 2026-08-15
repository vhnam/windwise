import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const VALID_SECRET = 'a'.repeat(32);
const VALID_ENV = {
  BETTER_AUTH_SECRET: VALID_SECRET,
  BETTER_AUTH_URL: 'http://localhost:4000',
};

function stubAllEnv(overrides: Partial<typeof VALID_ENV> = {}) {
  const values = { ...VALID_ENV, ...overrides };
  for (const [key, value] of Object.entries(values)) {
    vi.stubEnv(key, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('env', () => {
  it('parses successfully when all required variables are valid', async () => {
    stubAllEnv();

    const { env } = await import('./env.ts');

    expect(env.BETTER_AUTH_SECRET).toBe(VALID_ENV.BETTER_AUTH_SECRET);
    expect(env.BETTER_AUTH_URL).toBe(VALID_ENV.BETTER_AUTH_URL);
  });

  it('throws when BETTER_AUTH_SECRET is missing', async () => {
    // Stub every variable, including the target one set to "" — omitting the
    // stub would leave a real ambient value (e.g. from .env.local) in place.
    stubAllEnv({ BETTER_AUTH_SECRET: '' });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(import('./env.ts')).rejects.toThrow('Invalid environment variables');

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid environment variables'),
      expect.arrayContaining([expect.objectContaining({ path: ['BETTER_AUTH_SECRET'] })]),
    );
  });

  it('throws when BETTER_AUTH_SECRET is shorter than 32 characters', async () => {
    stubAllEnv({ BETTER_AUTH_SECRET: 'too-short' });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(import('./env.ts')).rejects.toThrow('Invalid environment variables');

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid environment variables'),
      expect.arrayContaining([expect.objectContaining({ path: ['BETTER_AUTH_SECRET'] })]),
    );
  });
});
