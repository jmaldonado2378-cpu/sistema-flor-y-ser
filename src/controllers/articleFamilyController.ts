import { Request, Response } from 'express';
import { ArticleFamilyService } from '../services/articleFamilyService';

export class ArticleFamilyController {
  constructor(private articleFamilyService: ArticleFamilyService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.articleFamilyService.getAll();
      res.json({ status: 'SUCCESS', data });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  getByScope = async (req: Request, res: Response): Promise<void> => {
    try {
      const { scope } = req.params;
      const data = await this.articleFamilyService.getByScope(scope);
      res.json({ status: 'SUCCESS', data });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.articleFamilyService.getById(id);
      if (!data) {
        res.status(404).json({ status: 'ERROR', message: 'Familia de artículos no encontrada' });
        return;
      }
      res.json({ status: 'SUCCESS', data });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.articleFamilyService.create(req.body);
      res.status(201).json({ status: 'SUCCESS', data });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.articleFamilyService.update(id, req.body);
      if (!data) {
        res.status(404).json({ status: 'ERROR', message: 'Familia de artículos no encontrada' });
        return;
      }
      res.json({ status: 'SUCCESS', data });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.articleFamilyService.delete(id);
      if (!success) {
        res.status(404).json({ status: 'ERROR', message: 'Familia de artículos no encontrada' });
        return;
      }
      res.json({ status: 'SUCCESS', message: 'Familia de artículos eliminada correctamente' });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };
}
