export const authQueryKeys = {
  all: ['auth'] as const,
  currentSession: () => [...authQueryKeys.all, 'current-session'] as const,
};
