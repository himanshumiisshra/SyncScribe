// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(private authService: AuthService) {}

  // Arrow function binds 'this' automatically for Express routes
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await this.authService.login(email, password);
      
      return res.status(200).json(result);
    } catch (error: any) {
      // The service throws an error if auth fails
      return res.status(401).json({ error: error.message });
    }
  }

  register = async (req: Request, res: Response) => {
    try {
      console.log("checking with req body", req.body)
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const result = await this.authService.register(email, password, name);
      return res.status(201).json({ message: 'User registered successfully', user: result });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}