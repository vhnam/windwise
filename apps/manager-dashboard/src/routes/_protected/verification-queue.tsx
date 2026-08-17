import { createFileRoute } from '@tanstack/react-router';

import { getVerificationQueueFn } from '#/lib/server/catalog';
import { CatalogVerification } from '#/modules/catalog/catalog-verification';

export const Route = createFileRoute('/_protected/verification-queue')({
  loader: async () => getVerificationQueueFn(),
  component: CatalogVerification,
});
