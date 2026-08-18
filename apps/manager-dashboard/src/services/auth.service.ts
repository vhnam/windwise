import { authClient } from '#/lib/auth-client';

export type Session = typeof authClient.$Infer.Session;

type AuthClientError = {
  message?: string;
  status?: number;
  statusCode?: number;
  code?: string;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};

const getAuthErrorMessage = (error: AuthClientError | null | undefined, fallbackMessage: string) => {
  return error?.message ?? fallbackMessage;
};

const isUnauthenticatedError = (error: AuthClientError | null | undefined) => {
  return error?.status === 401 || error?.statusCode === 401 || error?.code === 'UNAUTHORIZED';
};

export const login = async (credentials: AuthLoginRequest): Promise<Session> => {
  const { error } = await authClient.signIn.email({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error, 'Failed to login'));
  }

  const session = await getCurrentSession();

  if (!session) {
    throw new Error('Failed to fetch current session');
  }

  return session;
};

export const forgotPassword = async (email: string): Promise<void> => {
  const { error } = await authClient.requestPasswordReset({
    email,
    redirectTo: '/auth/reset-password',
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error, 'Failed to send reset email'));
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const { error } = await authClient.resetPassword({
    token,
    newPassword,
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error, 'Failed to reset password'));
  }
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data, error } = await authClient.getSession();

  if (isUnauthenticatedError(error)) {
    return null;
  }

  if (error) {
    throw new Error(getAuthErrorMessage(error, 'Failed to fetch current session'));
  }

  return data;
};
