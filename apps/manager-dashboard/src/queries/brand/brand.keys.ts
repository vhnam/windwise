export const brandQueryKeys = {
  all: ['brand'] as const,
  brands: () => [...brandQueryKeys.all, 'brands'] as const,
};
