// src/services/DocumentService.ts
import { IDocumentRepository } from '../domain/interfaces/IDocumentRepository';
import * as Y from 'yjs';

export class DocumentService {
  constructor(private readonly documentRepo: IDocumentRepository) {}

  async loadDocument(documentId: string, userId: string): Promise<Y.Doc> {
    const ydoc = new Y.Doc();
    // Fetch state from DB using RLS
    const binaryState = await this.documentRepo.getDocumentState(documentId, userId);
    
    if (binaryState) {
      Y.applyUpdate(ydoc, binaryState);
    }
    return ydoc;
  }

  async persistDocument(documentId: string, ydoc: Y.Doc, userId: string): Promise<void> {
    const stateVector = Y.encodeStateAsUpdate(ydoc);
    await this.documentRepo.saveDocumentState(documentId, stateVector, userId);
  }

  async saveVersion(documentId: string, userId: string, stateVector: Buffer, snapshotName: string) {
    return await this.documentRepo.saveVersion(documentId, userId, stateVector, snapshotName);
  }

  async getVersions(documentId: string) {
    return await this.documentRepo.getVersions(documentId);
  }

  async getTitle(documentId: string) {
    return await this.documentRepo.getTitle(documentId);
  }

  async updateTitle(documentId: string, title: string) {
    return await this.documentRepo.updateTitle(documentId, title);
  }
}