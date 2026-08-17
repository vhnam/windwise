import { createServerFn } from '@tanstack/react-start';

export const getActorContextFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getActorContext } = await import('#/lib/server/session.ts');
  return getActorContext();
});
