import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create postgres connection
const connectionString = process.env.DATABASE_URL!;
const queryClient = postgres(connectionString);

// Create drizzle client
export const db: PostgresJsDatabase<typeof schema> = drizzle(queryClient, { schema });