import { createFileRoute } from '@tanstack/react-router';

import { ComparePage } from '#/modules/compare-page';

export const Route = createFileRoute('/compare/')({
  validateSearch: (search: Record<string, unknown>) => ({
    sessionId: typeof search.sessionId === 'string' ? search.sessionId : '',
  }),
  component: CompareRoute,
  head: () => ({
    meta: [{ title: 'So sánh kèn — WindWise' }],
  }),
});

function CompareRoute() {
  const { sessionId } = Route.useSearch();
  return <ComparePage sessionId={sessionId} />;
}
