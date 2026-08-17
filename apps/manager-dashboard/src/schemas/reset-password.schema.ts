import * as v from 'valibot';

export const ResetPasswordSchema = v.pipe(
  v.object({
    password: v.pipe(
      v.string('Please enter a new password.'),
      v.nonEmpty('Please enter a new password.'),
      v.minLength(8, 'Your password must have 8 characters or more.'),
    ),
    confirmPassword: v.pipe(v.string('Please confirm your password.'), v.nonEmpty('Please confirm your password.')),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      'Passwords do not match.',
    ),
    ['confirmPassword'],
  ),
);

export type ResetPasswordSchemaType = v.InferOutput<typeof ResetPasswordSchema>;
