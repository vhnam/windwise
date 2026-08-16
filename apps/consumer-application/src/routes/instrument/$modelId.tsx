import { createFileRoute } from '@tanstack/react-router';

import { getInstrumentDetailFn } from '#/lib/server/catalog';
import { InstrumentDetailPage } from '#/modules/instrument-detail-page';

export const Route = createFileRoute('/instrument/$modelId')({
  loader: async ({ params }) => getInstrumentDetailFn({ data: { modelId: params.modelId } }),
  component: InstrumentDetailRoute,
  head: () => ({
    meta: [{ title: 'Chi tiết nhạc cụ — WindWise' }],
  }),
});

function InstrumentDetailRoute() {
  const detail = Route.useLoaderData();
  return <InstrumentDetailPage detail={detail} />;
}
