import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '#/schema/index.ts';

import { dbEnv } from './env.ts';

export type Database = PostgresJsDatabase<typeof schema>;
export type PostgresClient = ReturnType<typeof postgres>;

export function createPostgresClient(url: string): PostgresClient {
  return postgres(url, { max: 10 });
}

export function createDb(url: string, client: PostgresClient = createPostgresClient(url)): Database {
  return drizzle(client, { schema });
}

let cached: Database | undefined;

export function getDb(): Database {
  cached ??= createDb(dbEnv.DATABASE_URL);
  return cached;
}
