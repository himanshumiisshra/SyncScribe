// src/controllers/DocumentController.ts
import { Request, Response } from 'express';
import { DocumentService } from '../services/DocumentService';

export class DocumentController {
  constructor(private documentService: DocumentService) {}

  getTitle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const title = await this.documentService.getTitle(id);
      return res.status(200).json({ title });
    } catch (error: any) {
      console.error('Error fetching title:', error);
      return res.status(500).json({ error: 'Failed to fetch title' });
    }
  }

  updateTitle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }

      await this.documentService.updateTitle(id, title.trim());
      return res.status(200).json({ message: 'Title updated successfully' });
    } catch (error: any) {
      console.error('Error updating title:', error);
      return res.status(500).json({ error: 'Failed to update title' });
    }
  }
}