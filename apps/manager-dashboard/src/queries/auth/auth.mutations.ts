import { useMutation, useQueryClient } from '@tanstack/react-query';

import { forgotPassword, login, resetPassword, type AuthLoginRequest, type Session } from '#/services/auth.service';

import { currentSessionQueryOptions } from './auth.queries';

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Session, Error, AuthLoginRequest>({
    mutationFn: (credentials) => login(credentials),
    retry: false,
    onSuccess: (session) => {
      queryClient.setQueryData(currentSessionQueryOptions().queryKey, session);
    },
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => forgotPassword(email),
    retry: false,
  });
};

export const useResetPasswordMutation = () => {
  return useMutation<void, Error, { token: string; newPassword: string }>({
    mutationFn: ({ token, newPassword }) => resetPassword(token, newPassword),
    retry: false,
  });
};
