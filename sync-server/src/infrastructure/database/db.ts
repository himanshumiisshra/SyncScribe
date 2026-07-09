// src/infrastructure/database/db.ts
import { Pool } from 'pg';

// Export dbPool directly as a named export
export const dbPool = new Pool({
  // Use Vercel's env variable, fallback to local Postgres for local development
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/edTech',
  
  // Supabase requires SSL connections from external servers like Vercel
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});