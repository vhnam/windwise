import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/consult/chat')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { handleConsultChat } = await import('#/lib/server/consult-chat');
        return handleConsultChat(request);
      },
    },
  },
} as never);
