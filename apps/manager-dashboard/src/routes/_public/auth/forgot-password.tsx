import { createFileRoute } from '@tanstack/react-router';

import AuthLayout from '#/layouts/auth-layout';
import ForgotPassword from '#/modules/auth/forgot-password';

export const Route = createFileRoute('/_public/auth/forgot-password')({
  component: ForgotPasswordRoute,
});

function ForgotPasswordRoute() {
  return (
    <AuthLayout>
      <ForgotPassword />
    </AuthLayout>
  );
}
