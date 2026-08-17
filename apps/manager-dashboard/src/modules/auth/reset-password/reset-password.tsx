import { Field as FormischField, Form, setErrors, useForm, type SubmitHandler } from '@formisch/react';
import { Link } from '@tanstack/react-router';
import { InfoIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@windwise/ui/components/alert';
import { Button } from '@windwise/ui/components/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@windwise/ui/components/field';

import { AuthScreen } from '#/components/auth-screen';
import { PasswordInput } from '#/components/password-input';
import { ResetPasswordSchema } from '#/schemas/reset-password.schema';
import { fieldErrorMessage } from '#/utils/auth';

import { useResetPasswordFormActions } from './reset-password.actions';

type ResetPasswordProps = {
  token: string;
  tokenError?: string;
};

const ResetPassword = ({ token, tokenError }: ResetPasswordProps) => {
  const { submitResetPassword, isResetPasswordPending } = useResetPasswordFormActions();

  const resetPasswordForm = useForm({
    schema: ResetPasswordSchema,
    initialInput: {
      password: '',
      confirmPassword: '',
    },
  });

  const isSubmitting = resetPasswordForm.isSubmitting || isResetPasswordPending;
  const formError = fieldErrorMessage(resetPasswordForm.errors);
  const hasValidToken = Boolean(token) && !tokenError;

  const handleSubmit: SubmitHandler<typeof ResetPasswordSchema> = async (payload) => {
    try {
      await submitResetPassword({ token, password: payload.password });
    } catch (error) {
      setErrors(resetPasswordForm, {
        errors: [error instanceof Error ? error.message : 'Failed to reset password'],
      });
    }
  };

  if (!hasValidToken) {
    return (
      <AuthScreen
        title="Reset link is invalid"
        description="This password reset link is invalid or has expired. Request a new one to continue."
      >
        <FieldDescription>
          <Link to="/auth/forgot-password">Request a new reset link</Link>
        </FieldDescription>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Set a new password" description="Choose a new password for your staff account.">
      <Form of={resetPasswordForm} className="flex flex-col gap-6" aria-busy={isSubmitting} onSubmit={handleSubmit}>
        {formError && (
          <Alert variant="destructive">
            <InfoIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <FieldGroup>
          <FormischField of={resetPasswordForm} path={['password']}>
            {(passwordField) => (
              <Field data-invalid={passwordField.errors ? true : undefined}>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <PasswordInput
                  {...passwordField.props}
                  id="password"
                  value={passwordField.input}
                  autoComplete="new-password"
                  aria-invalid={Boolean(passwordField.errors)}
                  disabled={isSubmitting}
                  required
                />
                <FieldError>{fieldErrorMessage(passwordField.errors)}</FieldError>
              </Field>
            )}
          </FormischField>
          <FormischField of={resetPasswordForm} path={['confirmPassword']}>
            {(confirmPasswordField) => (
              <Field data-invalid={confirmPasswordField.errors ? true : undefined}>
                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                <PasswordInput
                  {...confirmPasswordField.props}
                  id="confirmPassword"
                  value={confirmPasswordField.input}
                  autoComplete="new-password"
                  aria-invalid={Boolean(confirmPasswordField.errors)}
                  disabled={isSubmitting}
                  required
                />
                <FieldError>{fieldErrorMessage(confirmPasswordField.errors)}</FieldError>
              </Field>
            )}
          </FormischField>
          <Field>
            <Button size="lg" type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving password…' : 'Save new password'}
            </Button>
            <Link to="/auth/login" className="text-sm text-muted-foreground">
              Remember your password? Sign in
            </Link>
          </Field>
        </FieldGroup>
      </Form>
    </AuthScreen>
  );
};

export default ResetPassword;
