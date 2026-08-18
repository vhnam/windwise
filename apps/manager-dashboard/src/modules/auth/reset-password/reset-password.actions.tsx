import { useRouter } from '@tanstack/react-router';

import { useResetPasswordMutation } from '#/queries/auth';

export const useResetPasswordFormActions = () => {
  const router = useRouter();
  const resetPasswordMutation = useResetPasswordMutation();

  const submitResetPassword = async (payload: { token: string; password: string }) => {
    await resetPasswordMutation.mutateAsync({
      token: payload.token,
      newPassword: payload.password,
    });
    await router.navigate({ to: '/auth/login' });
  };

  return {
    isResetPasswordPending: resetPasswordMutation.isPending,
    resetPasswordMutation,
    submitResetPassword,
  };
};
