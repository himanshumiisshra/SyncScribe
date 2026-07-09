// src/services/AuthService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../domain/interfaces/IUserRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

export class AuthService {
  constructor(private userRepository: IUserRepository) {}

async login(email: string, passwordPlain: string) {
    console.log(`Attempting login for: ${email}`);

    // 1. Fetch user from DB via Repository
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      console.log(`❌ Login Failed: User with email ${email} not found in database.`);
      throw new Error('Invalid email or password');
    }
    
    console.log(`✅ User found in DB: ${user.email}`);

    // 2. Verify Password
    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      console.log(`❌ Login Failed: Password does not match for ${email}.`);
      throw new Error('Invalid email or password');
    }

    console.log(`✅ Password matches for: ${email}. Generating Token...`);

    // 3. Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name }
    };
  }

  async register(email: string, passwordPlain: string, name: string) {
    console.log("check")
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    console.log("checking with existing user",existingUser)
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);
    console.log("checking with password Hash", passwordHash)

    // 3. Create User
    const user = await this.userRepository.create(email, passwordHash, name);
    return { id: user.id, email: user.email, name: user.name };
  }
}