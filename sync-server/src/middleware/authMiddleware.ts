// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const FALLBACK_SECRET = process.env.AUTH_SECRET || 'your_fallback_secret_here';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Temporary bypass for your Genie route during development
  if (authHeader === FALLBACK_SECRET) {
    return next();
  }

  try {
    // Expecting header format: "Bearer <token>"
    const token = (authHeader as string).split(' ')[1] || authHeader;
    const decoded = jwt.verify(token as string, JWT_SECRET);
    
    // Attach decoded user info to the request for your controllers to use
    (req as any).user = decoded; 
    
    next(); // Token is valid, proceed to the route!
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};