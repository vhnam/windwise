import * as v from 'valibot';

export const ForgotPasswordSchema = v.object({
  email: v.pipe(
    v.string('Please enter your email.'),
    v.trim(),
    v.toLowerCase(),
    v.nonEmpty('Please enter your email.'),
    v.email('The email address is badly formatted.'),
  ),
});

export type ForgotPasswordSchemaType = v.InferOutput<typeof ForgotPasswordSchema>;
