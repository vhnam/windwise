import { createFileRoute } from '@tanstack/react-router';

import { getInstrumentRecordFn } from '#/lib/server/catalog';
import { CatalogEdit } from '#/modules/catalog/catalog-edit';

export const Route = createFileRoute('/_protected/catalog/$modelId/edit')({
  loader: async ({ params }) => {
    if (params.modelId === 'new') {
      return null;
    }
    return getInstrumentRecordFn({ data: { modelId: params.modelId } });
  },
  component: CatalogEdit,
});
