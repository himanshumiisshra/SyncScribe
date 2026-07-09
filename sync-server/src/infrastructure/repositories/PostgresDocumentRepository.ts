// src/infrastructure/repositories/PostgresDocumentRepository.ts
import { IDocumentRepository } from '../../domain/interfaces/IDocumentRepository';
import { dbPool } from '../database/db';

export class PostgresDocumentRepository implements IDocumentRepository {
  
  /**
   * Helper function to execute queries inside a transaction with the RLS user context set.
   */
  private async withUserContext<T>(userId: string, queryFn: (client: any) => Promise<T>): Promise<T> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      // Inject the user ID into PostgreSQL's session context for RLS policies to read
      await client.query(`SET LOCAL app.current_user_id = $1`, [userId]);
      const result = await queryFn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyUserAccess(documentId: string, userId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM document_collaborators WHERE document_id = $1 AND user_id = $2';
    const result = await dbPool.query(query, [documentId, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDocumentState(documentId: string, userId: string): Promise<Uint8Array | null> {
    return this.withUserContext(userId, async (client) => {
      const query = 'SELECT state_vector FROM documents WHERE id = $1';
      const result = await client.query(query, [documentId]);
      return result.rows[0]?.state_vector || null;
    });
  }

  async saveDocumentState(documentId: string, stateVector: Uint8Array, userId: string): Promise<void> {
    return this.withUserContext(userId, async (client) => {
      const query = `
        INSERT INTO documents (id, state_vector, updated_at) 
        VALUES ($1, $2, NOW()) 
        ON CONFLICT (id) 
        DO UPDATE SET state_vector = EXCLUDED.state_vector, updated_at = NOW()
      `;
      await client.query(query, [documentId, Buffer.from(stateVector)]);
    });
  }

  async saveVersionSnapshot(documentId: string, stateVector: Uint8Array, userId: string, snapshotName: string): Promise<void> {
    return this.withUserContext(userId, async (client) => {
      // 1. Ensure the parent document exists (Prevents the Foreign Key error)
      await client.query(`
        INSERT INTO public.documents (id, title) 
        VALUES ($1, 'Auto-created Document') 
        ON CONFLICT (id) DO NOTHING`, 
        [documentId]
      );

      // 2. Now insert the version
      await client.query(`
        INSERT INTO public.document_versions (document_id, created_by, state_vector, snapshot_name) 
        VALUES ($1, $2, $3, $4)`,
        [documentId, userId, Buffer.from(stateVector), snapshotName]
      );
    });
  }


  async saveVersion(documentId: string, userId: string, stateVector: Buffer, snapshotName: string) {
    const result = await dbPool.query(
      `INSERT INTO document_versions (document_id, created_by, state_vector, snapshot_name) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [documentId, userId, stateVector, snapshotName]
    );
    return result.rows[0];
  }


  async getVersions(documentId: string) {
    // encode(state_vector, 'base64') automatically converts the BYTEA format 
    // into a base64 string so the frontend can easily decode it!
    const result = await dbPool.query(
      `SELECT id, snapshot_name, created_at, encode(state_vector, 'base64') as state_vector 
       FROM document_versions 
       WHERE document_id = $1 
       ORDER BY created_at DESC`,
      [documentId]
    );
    return result.rows;
  }

  async getTitle(documentId: string): Promise<string> {
    const result = await dbPool.query('SELECT title FROM documents WHERE id = $1', [documentId]);
    return result.rows.length > 0 ? result.rows[0].title : 'Untitled Document';
  }

  async updateTitle(documentId: string, title: string): Promise<void> {
    await dbPool.query('UPDATE documents SET title = $1, updated_at = NOW() WHERE id = $2', [title, documentId]);
  }

}