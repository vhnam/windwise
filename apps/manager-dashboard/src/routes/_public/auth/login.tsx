import { createFileRoute } from '@tanstack/react-router';

import AuthLayout from '#/layouts/auth-layout';
import Login from '#/modules/auth/login';

export const Route = createFileRoute('/_public/auth/login')({
  component: LoginRoute,
});

function LoginRoute() {
  return (
    <AuthLayout>
      <Login />
    </AuthLayout>
  );
}
