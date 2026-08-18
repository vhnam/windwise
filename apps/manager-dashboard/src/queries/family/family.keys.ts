export const familyQueryKeys = {
  all: ['family'] as const,
  families: () => [...familyQueryKeys.all, 'families'] as const,
};
