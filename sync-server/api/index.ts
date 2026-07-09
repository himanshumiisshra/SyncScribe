import * as HocusPkg from '@hocuspocus/server';
const Server = HocusPkg.Server || (HocusPkg as any).Hocuspocus;

import express from 'express';
import expressWebsockets from 'express-ws';
import jwt from 'jsonwebtoken';
import cors from 'cors';

import { DocumentController } from '../src/controllers/DocumentController';
import { initializeDatabase } from '../src/infrastructure/database/init-db';
import { PostgresDocumentRepository } from '../src/infrastructure/repositories/PostgresDocumentRepository';
import { DocumentService } from '../src/services/DocumentService';
import { handleGenieChat, handleCompletion } from '../src/services/GenieService';
import { AuthController } from '../src/controllers/AuthController';
import { AuthService } from '../src/services/AuthService';
import { PostgresUserRepository } from '../src/infrastructure/repositories/PostgresUserRepository';
import { requireAuth } from '../src/middleware/authMiddleware';
import { VersionController } from '../src/controllers/VersionController';

const { app } = expressWebsockets(express());
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// Initialize Layered Dependencies
const documentRepo = new PostgresDocumentRepository();
const documentService = new DocumentService(documentRepo);
const userRepository = new PostgresUserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);
const versionController = new VersionController(documentService);
const documentController = new DocumentController(documentService);

// Define Routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);
app.post('/api/chat', requireAuth, handleGenieChat); 
app.post('/api/completion', requireAuth, handleCompletion);
app.post('/api/versions', requireAuth, versionController.saveSnapshot);
app.get('/api/versions', requireAuth, versionController.getSnapshots);
app.get('/api/documents/:id/title', requireAuth, documentController.getTitle);
app.patch('/api/documents/:id/title', requireAuth, documentController.updateTitle);

// ⚠️ WARNING: This WebSocket configuration will be ignored/dropped by Vercel's infrastructure
const hocuspocusServer = new Server({
  async onAuthenticate(data: any) {
    if (!data.token) throw new Error('Unauthorized');
    try {
      const decoded = jwt.verify(data.token, JWT_SECRET) as any;
      return { user: { id: decoded.userId } };
    } catch (err) {
      throw new Error('Unauthorized');
    }
  },
  async onLoadDocument(data: any) {
    return await documentService.loadDocument(data.documentName, data.context.user.id);
  },
  async onStoreDocument(data: any) {
    await documentService.persistDocument(data.documentName, data.document, data.context.user.id);
  }
});

// app.ws('/', (websocket, request) => {
//   hocuspocusServer.handleConnection(websocket, request);
// });

app.ws('/', (websocket, request) => {
  // Cast hocuspocusServer to 'any' to bypass TS strict mode 
  // losing the method signature from our CJS import hack
  (hocuspocusServer as any).handleConnection(websocket, request);
});

// Initialize DB on cold start
let isDbInitialized = false;
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    await initializeDatabase();
    isDbInitialized = true;
  }
  next();
});

// EXPORT for Vercel (Do not use app.listen)
export default app;