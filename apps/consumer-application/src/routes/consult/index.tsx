import { createFileRoute } from '@tanstack/react-router';

import { IntentChoicePage } from '#/modules/intent-page';

export const Route = createFileRoute('/consult/')({
  component: IntentChoicePage,
  head: () => ({
    meta: [{ title: 'Chọn cách tư vấn — WindWise' }],
  }),
});
