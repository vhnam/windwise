import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/consult/intent')({
  beforeLoad: () => {
    throw redirect({ to: '/consult' });
  },
});
