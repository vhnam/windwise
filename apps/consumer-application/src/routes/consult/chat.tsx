import { createFileRoute } from '@tanstack/react-router';

import { ConsultChatPage } from '#/modules/consult-page';

export const Route = createFileRoute('/consult/chat')({
  component: ConsultChatPage,
  head: () => ({
    meta: [{ title: 'Hội thoại tư vấn — WindWise' }],
  }),
});
