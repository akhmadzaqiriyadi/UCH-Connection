import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { logger } from '../lib/utils.ts';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/uch_connection_db';

async function runMigrations() {
  logger.info('🚀 Running migrations...');
  
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('✅ Migrations completed successfully');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
