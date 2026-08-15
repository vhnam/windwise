import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const env = createEnv({
  server: {
    SERVER_URL: v.optional(v.pipe(v.string(), v.url())),
    OPENAI_API_KEY: v.pipe(v.string(), v.minLength(1)),
    GEMINI_API_KEY: v.pipe(v.string(), v.minLength(1)),
  },
  clientPrefix: 'VITE_',
  client: {
    VITE_APP_TITLE: v.optional(v.pipe(v.string(), v.minLength(1))),
    VITE_POWERSYNC_URL: v.pipe(v.string(), v.url()),
    VITE_POWERSYNC_TOKEN: v.pipe(v.string(), v.minLength(1)),
  },
  runtimeEnv: {
    SERVER_URL: process.env.SERVER_URL ?? import.meta.env.SERVER_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY,
    VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
    VITE_POWERSYNC_URL: import.meta.env.VITE_POWERSYNC_URL,
    VITE_POWERSYNC_TOKEN: import.meta.env.VITE_POWERSYNC_TOKEN,
  },
  emptyStringAsUndefined: true,
});
