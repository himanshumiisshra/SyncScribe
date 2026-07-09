// src/infrastructure/repositories/PostgresUserRepository.ts
import { IUserRepository, User } from '../../domain/interfaces/IUserRepository';
import { dbPool } from '../database/db'; // Assuming this is your db connection

export class PostgresUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await dbPool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  async create(email: string, passwordHash: string, name: string): Promise<User> {
    const result = await dbPool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, password_hash, name',
      [email, passwordHash, name]
    );
    return result.rows[0];
  }

  async getTitle(documentId: string): Promise<string> {
    const result = await dbPool.query('SELECT title FROM documents WHERE id = $1', [documentId]);
    return result.rows.length > 0 ? result.rows[0].title : 'Untitled Document';
  }

  async updateTitle(documentId: string, title: string): Promise<void> {
    await dbPool.query('UPDATE documents SET title = $1, updated_at = NOW() WHERE id = $2', [title, documentId]);
  }
}