import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins/organization';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

import {
  account,
  getDb,
  invitation,
  member,
  organization as organizationTable,
  session,
  user,
  verification,
} from '@windwise/db';

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
      organization: organizationTable,
      member,
      invitation,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    sendResetPassword: async ({ user, url }) => {
      // No mailer is configured yet; log the reset URL so local/dev can complete the flow.
      console.info(`[auth] Password reset for ${user.email}: ${url}`);
    },
  },
  advanced: {
    database: {
      generateId: 'uuid',
    },
  },
  plugins: [
    organization({
      schema: {
        member: {
          additionalFields: {
            role: {
              type: 'string',
              defaultValue: 'viewer',
              required: true,
            },
          },
        },
      },
    }),
    tanstackStartCookies(),
  ],
});
