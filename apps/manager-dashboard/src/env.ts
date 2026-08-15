import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const env = createEnv({
  server: {
    SERVER_URL: v.optional(v.pipe(v.string(), v.url())),
    BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(32)),
    BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
  },
  clientPrefix: 'VITE_',
  client: {
    VITE_APP_TITLE: v.optional(v.pipe(v.string(), v.minLength(1))),
  },
  runtimeEnv: {
    SERVER_URL: process.env.SERVER_URL ?? import.meta.env.SERVER_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
  },
  emptyStringAsUndefined: true,
});
