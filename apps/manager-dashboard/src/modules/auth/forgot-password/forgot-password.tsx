import { Field as FormischField, Form, type SubmitHandler, useForm, setErrors } from '@formisch/react';
import { Link } from '@tanstack/react-router';
import { InfoIcon } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@windwise/ui/components/alert';
import { Button } from '@windwise/ui/components/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@windwise/ui/components/field';
import { Input } from '@windwise/ui/components/input';

import { AuthScreen } from '#/components/auth-screen';
import { ForgotPasswordSchema } from '#/schemas/forgot-password.schema';
import { fieldErrorMessage } from '#/utils/auth';

import { useForgotPasswordFormActions } from './forgot-password.actions';

const ForgotPassword = () => {
  const { submitForgotPassword, isForgotPasswordPending } = useForgotPasswordFormActions();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const forgotPasswordForm = useForm({
    schema: ForgotPasswordSchema,
    initialInput: {
      email: '',
    },
  });

  const isSubmitting = forgotPasswordForm.isSubmitting || isForgotPasswordPending;
  const formError = fieldErrorMessage(forgotPasswordForm.errors);

  const handleSubmit: SubmitHandler<typeof ForgotPasswordSchema> = async (payload) => {
    try {
      await submitForgotPassword(payload);
      setIsSubmitted(true);
    } catch (error) {
      setErrors(forgotPasswordForm, {
        errors: [error instanceof Error ? error.message : 'Failed to send reset email'],
      });
    }
  };

  if (isSubmitted) {
    return (
      <AuthScreen
        title="Check your email"
        description="If an account exists for that address, we sent a password reset link."
      >
        <FieldDescription>
          Remember your password?{' '}
          <Link to="/auth/login" className="text-sm text-muted-foreground">
            Sign in
          </Link>
        </FieldDescription>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Forgot password" description="Enter your staff email and we will send a reset link.">
      <Form of={forgotPasswordForm} className="flex flex-col gap-6" aria-busy={isSubmitting} onSubmit={handleSubmit}>
        {formError && (
          <Alert variant="destructive">
            <InfoIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <FieldGroup>
          <FormischField of={forgotPasswordForm} path={['email']}>
            {(emailField) => (
              <Field data-invalid={emailField.errors ? true : undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...emailField.props}
                  id="email"
                  type="email"
                  value={emailField.input}
                  placeholder="you@example.com"
                  autoComplete="username"
                  aria-invalid={Boolean(emailField.errors)}
                  disabled={isSubmitting}
                  required
                />
                <FieldError>{fieldErrorMessage(emailField.errors)}</FieldError>
              </Field>
            )}
          </FormischField>
          <Field>
            <Button size="lg" type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending reset email…' : 'Send reset email'}
            </Button>
            <FieldDescription className="text-center">
              Remember your password?{' '}
              <Link to="/auth/login" className="text-muted-foreground">
                Sign in
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </Form>
    </AuthScreen>
  );
};

export default ForgotPassword;
