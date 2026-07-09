import { Request, Response } from 'express';
import { DocumentService } from '../services/DocumentService';

export class VersionController {
  constructor(private documentService: DocumentService) {}

  saveSnapshot = async (req: Request, res: Response) => {
    try {
      const { documentId, snapshotName, stateVector } = req.body;
      
      // req.user is populated by your authMiddleware
      const userId = (req as any).user.userId; 
      
      // Convert the incoming Base64 string back into a binary Buffer for Postgres
      const buffer = Buffer.from(stateVector, 'base64');
      
      await this.documentService.saveVersion(documentId, userId, buffer, snapshotName);
      
      return res.status(201).json({ message: 'Snapshot saved successfully' });
    } catch (error: any) {
      console.error('Error saving snapshot:', error);
      return res.status(500).json({ error: 'Failed to save snapshot' });
    }
  }

  getSnapshots = async (req: Request, res: Response) => {
    try {
      const documentId = req.query.documentId as string;
      
      if (!documentId) {
        return res.status(400).json({ error: 'documentId is required' });
      }

      const versions = await this.documentService.getVersions(documentId);
      return res.status(200).json(versions);
    } catch (error: any) {
      console.error('Error fetching snapshots:', error);
      return res.status(500).json({ error: 'Failed to fetch snapshots' });
    }
  }
}