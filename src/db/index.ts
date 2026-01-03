import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.ts';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/uch_connection_db';

// Create postgres client
export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
