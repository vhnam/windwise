import { createDb, createPostgresClient } from './client.ts';
import { dbEnv } from './env.ts';
import { seedDatabase } from './seed.ts';

const client = createPostgresClient(dbEnv.DATABASE_URL);
const db = createDb(dbEnv.DATABASE_URL, client);

try {
  await seedDatabase(db);
  console.log('Seed complete');
} finally {
  await client.end({ timeout: 5 });
}
