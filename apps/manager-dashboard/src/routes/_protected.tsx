import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import ProtectedLayout from '#/layouts/protected-layout';
import { auth } from '#/lib/auth';

const getProtectedSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  return session?.user ? { id: session.user.id } : null;
});

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const session = await getProtectedSessionFn();
    if (!session) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: ProtectedRoute,
});

function ProtectedRoute() {
  return (
    <ProtectedLayout>
      <Outlet />
    </ProtectedLayout>
  );
}
