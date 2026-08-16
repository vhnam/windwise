import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const dbEnv = createEnv({
  server: {
    DATABASE_URL: v.pipe(v.string(), v.minLength(1)),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  emptyStringAsUndefined: true,
});
