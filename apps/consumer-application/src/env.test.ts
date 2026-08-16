import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const VALID_ENV = {
  VITE_POWERSYNC_URL: 'https://powersync.example.com',
  VITE_POWERSYNC_TOKEN: 'test-powersync-token',
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

    expect(env.VITE_POWERSYNC_URL).toBe(VALID_ENV.VITE_POWERSYNC_URL);
    expect(env.VITE_POWERSYNC_TOKEN).toBe(VALID_ENV.VITE_POWERSYNC_TOKEN);
  });

  it('throws with the specific variable name when a required variable is missing', async () => {
    // Stub every variable, including the target one set to "" — omitting the
    // stub would leave a real ambient value (e.g. from .env.local) in place.
    stubAllEnv({ VITE_POWERSYNC_TOKEN: '' });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(import('./env.ts')).rejects.toThrow('Invalid environment variables');

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid environment variables'),
      expect.arrayContaining([expect.objectContaining({ path: ['VITE_POWERSYNC_TOKEN'] })]),
    );
  });
});
