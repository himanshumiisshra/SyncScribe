import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Singleton Pattern for Database Connection
export const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});