import { createFileRoute } from '@tanstack/react-router';

import { getActorContextFn } from '#/lib/server/actor';
import { listCatalogRecordsFn } from '#/lib/server/catalog';
import { CatalogReview } from '#/modules/catalog/catalog-review';

export const Route = createFileRoute('/_protected/catalog/review/')({
  loader: async () => {
    const [list, actor] = await Promise.all([
      listCatalogRecordsFn({ data: { status: 'in_review' } }),
      getActorContextFn(),
    ]);
    return { records: list.items, actor };
  },
  component: CatalogReview,
});
