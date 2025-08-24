import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../shared/schema';
import './types'; // Import D1 type definitions

export function createD1Database(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createD1Database>;