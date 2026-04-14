import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5433/fbagent';

const queryClient = postgres(DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export const connection = queryClient;

export async function closeConnection() {
  await queryClient.end();
}

export * from './schema';