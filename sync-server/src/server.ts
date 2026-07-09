// src/server.ts
// @ts-nocheck
import * as HocusPkg from '@hocuspocus/server';
const Server = HocusPkg.Server || (HocusPkg as any).Hocuspocus;

import express from 'express';
import expressWebsockets from 'express-ws';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { DocumentController } from './controllers/DocumentController';
import { initializeDatabase } from './infrastructure/database/init-db';
import { PostgresDocumentRepository } from './infrastructure/repositories/PostgresDocumentRepository';
import { DocumentService } from './services/DocumentService';
// FIX: Added handleCompletion import
import { handleGenieChat, handleCompletion } from './services/GenieService'; 
import { AuthController } from './controllers/AuthController';
import { AuthService } from './services/AuthService';
import { PostgresUserRepository } from './infrastructure/repositories/PostgresUserRepository';
import { requireAuth } from './middleware/authMiddleware';
import { VersionController } from './controllers/VersionController';

// 1. Initialize Express + WebSockets
const { app } = expressWebsockets(express());
app.use(express.json());
app.use(cors());

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 1234;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// 2. Initialize Layered Dependencies
const documentRepo = new PostgresDocumentRepository();
const documentService = new DocumentService(documentRepo);
const userRepository = new PostgresUserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);
const versionController = new VersionController(documentService);
const documentController = new DocumentController(documentService);

// 3. Define Routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);

// AI Routes
app.post('/genie', requireAuth, handleGenieChat); 
app.post('/api/completion', requireAuth, handleCompletion); // <-- NEW: Added Auto-Complete route

// Document & Version Routes
app.post('/api/versions', requireAuth, versionController.saveSnapshot);
app.get('/api/versions', requireAuth, versionController.getSnapshots);
app.get('/api/documents/:id/title', requireAuth, documentController.getTitle);
app.patch('/api/documents/:id/title', requireAuth, documentController.updateTitle);

// 4. Setup Hocuspocus Server
const hocuspocusServer = new Server({
  async onAuthenticate(data) {
    if (!data.token) throw new Error('Unauthorized');
    try {
      const decoded = jwt.verify(data.token, JWT_SECRET);
      return { user: { id: decoded.userId } };
    } catch (err) {
      throw new Error('Unauthorized');
    }
  },
  async onLoadDocument(data) {
    return await documentService.loadDocument(data.documentName, data.context.user.id);
  },
  async onStoreDocument(data) {
    await documentService.persistDocument(data.documentName, data.document, data.context.user.id);
  }
});

// 5. Connect WebSocket Route
app.ws('/', (websocket, request) => {
  hocuspocusServer.handleConnection(websocket, request);
});

// 6. Start Server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database schema verified/initialized.');
    app.listen(port, () => {
      console.log(`🚀 SyncScribe API & WS Engine running on port ${port}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();