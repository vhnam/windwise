import { useForgotPasswordMutation } from '#/queries/auth';
import type { ForgotPasswordSchemaType } from '#/schemas/forgot-password.schema';

export const useForgotPasswordFormActions = () => {
  const forgotPasswordMutation = useForgotPasswordMutation();

  const submitForgotPassword = async (payload: ForgotPasswordSchemaType) => {
    await forgotPasswordMutation.mutateAsync({
      email: payload.email,
    });
  };

  return {
    isForgotPasswordPending: forgotPasswordMutation.isPending,
    forgotPasswordMutation,
    submitForgotPassword,
  };
};
