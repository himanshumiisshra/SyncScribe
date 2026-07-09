// src/infrastructure/database/init-db.ts
import { dbPool } from './db';

export async function initializeDatabase() {
  const schema = `
    -- TEMPORARY: Drop the users table to force a schema reset for the missing password_hash column
    -- WARNING: Delete this line after you successfully run the server once!
    -- DROP TABLE IF EXISTS users CASCADE;

    -- Create the Enum if it doesn't exist
    DO $$ BEGIN
        CREATE TYPE collaborator_role AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- Users Table (Now includes password_hash)
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Documents Table
    CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled Document',
        state_vector BYTEA, 
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Collaborators Table
    CREATE TABLE IF NOT EXISTS document_collaborators (
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role collaborator_role NOT NULL DEFAULT 'VIEWER',
        PRIMARY KEY (document_id, user_id)
    );

    -- Version History Table
    CREATE TABLE IF NOT EXISTS document_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        state_vector BYTEA NOT NULL,
        snapshot_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  try {
    await dbPool.query(schema);
    console.log('✅ Database schema initialized successfully.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}