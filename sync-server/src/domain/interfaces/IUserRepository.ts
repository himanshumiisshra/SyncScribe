// src/domain/interfaces/IUserRepository.ts
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  // create(user: Omit<User, 'id'>): Promise<User>; // You can add this later for signup
  create(email: string, passwordHash: string, name: string): Promise<User>;
}