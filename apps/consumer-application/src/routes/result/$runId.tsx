import { createFileRoute } from '@tanstack/react-router';

import { getSharedResult } from '#/lib/server/consultation';
import { ResultPage } from '#/modules/result-page';

export const Route = createFileRoute('/result/$runId')({
  loader: async ({ params }) => getSharedResult({ data: { runId: params.runId } }),
  component: ResultRoute,
  head: () => ({
    meta: [{ title: 'Kết quả tư vấn — WindWise' }],
  }),
});

function ResultRoute() {
  const data = Route.useLoaderData();
  const { runId } = Route.useParams();
  return <ResultPage data={data} runId={runId} />;
}
