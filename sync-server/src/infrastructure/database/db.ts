import { Pool } from 'pg';

// Fallback to local DB if no Vercel environment variable is found
const connectionString = process.env.DATABASE_URL;
// || 'postgresql://postgres:password@localhost:5432/syncscribe';

// Only use SSL if we are in Vercel (production) or specifically using Supabase
const requiresSSL = process.env.NODE_ENV === 'production';

export const dbPool = new Pool({
  connectionString,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false
});