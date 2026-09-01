import { Request, Response } from 'express';
import { SystemService } from '../services/systemService';

export class SystemController {
  constructor(private systemService: SystemService) {}

  getDbStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.systemService.getDbStatus();
      res.json({ status: 'SUCCESS', data: status });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  purgeSeedData = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.systemService.purgeSeedData();
      res.json({ status: 'SUCCESS', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };
}
