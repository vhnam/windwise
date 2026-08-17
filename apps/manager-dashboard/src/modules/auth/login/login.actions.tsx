import { useRouter } from '@tanstack/react-router';

import { useLoginMutation } from '#/queries/auth';
import type { LoginSchemaType } from '#/schemas/login.schema';

export const useLoginFormActions = () => {
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const submitLogin = async (payload: LoginSchemaType) => {
    await loginMutation.mutateAsync(payload);
    await router.navigate({ to: '/catalog' });
  };

  return {
    isLoginPending: loginMutation.isPending,
    loginMutation,
    submitLogin,
  };
};
