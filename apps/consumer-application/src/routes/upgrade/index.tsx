import { createFileRoute } from '@tanstack/react-router';

import { UpgradePage } from '#/modules/upgrade-page';

export const Route = createFileRoute('/upgrade/')({
  validateSearch: (search: Record<string, unknown>) => ({
    sessionId: typeof search.sessionId === 'string' ? search.sessionId : '',
  }),
  component: UpgradeRoute,
  head: () => ({
    meta: [{ title: 'Nâng cấp kèn — WindWise' }],
  }),
});

function UpgradeRoute() {
  const { sessionId } = Route.useSearch();
  return <UpgradePage sessionId={sessionId} />;
}
