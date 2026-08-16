import { describe, expect, it, vi } from 'vite-plus/test';

let postgresModuleLoaded = false;

vi.mock('postgres', () => {
  postgresModuleLoaded = true;
  return { default: () => ({}) };
});

describe('consult chat route stays off the postgres client', () => {
  it('does not load postgres when the route module is imported', async () => {
    await import('../routes/api/consult/chat.ts');
    expect(postgresModuleLoaded).toBe(false);
  });
});
