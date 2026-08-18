import { Field as FormischField, Form, setErrors, useForm, type SubmitHandler } from '@formisch/react';
import { Link } from '@tanstack/react-router';
import { InfoIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@windwise/ui/components/alert';
import { Button } from '@windwise/ui/components/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@windwise/ui/components/field';
import { Input } from '@windwise/ui/components/input';

import { AuthScreen } from '#/components/auth-screen';
import { PasswordInput } from '#/components/password-input';
import { LoginSchema } from '#/schemas/login.schema';
import { fieldErrorMessage } from '#/utils/auth';

import { useLoginFormActions } from './login.actions';

const Login = () => {
  const { isLoginPending, submitLogin } = useLoginFormActions();

  const loginForm = useForm({
    schema: LoginSchema,
    initialInput: {
      email: '',
      password: '',
    },
  });

  const isSubmitting = loginForm.isSubmitting || isLoginPending;
  const formError = fieldErrorMessage(loginForm.errors);

  const handleSubmit: SubmitHandler<typeof LoginSchema> = async (payload) => {
    try {
      await submitLogin(payload);
    } catch (error) {
      setErrors(loginForm, {
        errors: [error instanceof Error ? error.message : 'Failed to login'],
      });
    }
  };

  return (
    <AuthScreen title="Sign in" description="Use your staff account to login">
      <Form of={loginForm} className="flex flex-col gap-6" aria-busy={isSubmitting} onSubmit={handleSubmit}>
        {formError && (
          <Alert variant="destructive">
            <InfoIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <FieldGroup>
          <FormischField of={loginForm} path={['email']}>
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
          <FormischField of={loginForm} path={['password']}>
            {(passwordField) => (
              <Field data-invalid={passwordField.errors ? true : undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  {...passwordField.props}
                  id="password"
                  value={passwordField.input}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(passwordField.errors)}
                  disabled={isSubmitting}
                  required
                />
                <FieldError>{fieldErrorMessage(passwordField.errors)}</FieldError>
              </Field>
            )}
          </FormischField>
          <Field className="flex items-center gap-3">
            <Button size="lg" type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button nativeButton={false} size="lg" variant="ghost" render={<Link to="/auth/forgot-password" />}>
              Forgot password?
            </Button>
          </Field>
        </FieldGroup>
      </Form>
    </AuthScreen>
  );
};

export default Login;
