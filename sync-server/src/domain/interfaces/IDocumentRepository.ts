// src/domain/interfaces/IDocumentRepository.ts
export interface IDocumentRepository {
  getDocumentState(documentId: string, userId: string): Promise<Uint8Array | null>;
  saveDocumentState(documentId: string, stateVector: Uint8Array, userId: string): Promise<void>;
  verifyUserAccess(documentId: string, userId: string): Promise<boolean>;
  saveVersionSnapshot(documentId: string, stateVector: Uint8Array, userId: string, snapshotName: string): Promise<void>;
  saveVersion(documentId: string, userId: string, stateVector: Buffer, snapshotName: string): Promise<any>;
  getVersions(documentId: string): Promise<any[]>;
  getTitle(documentId: string): Promise<string>;
  updateTitle(documentId: string, title: string): Promise<void>;
}