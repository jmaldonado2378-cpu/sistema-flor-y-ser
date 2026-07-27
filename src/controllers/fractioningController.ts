import { Request, Response } from 'express';
import { FractioningService } from '../services/fractioningService';

export class FractioningController {
  constructor(private fractioningService: FractioningService) {}

  preview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rawMaterialId, finalProductId, inputQtyKg, actualOutputUnits } = req.body;

      if (!rawMaterialId || !finalProductId || inputQtyKg === undefined) {
        res.status(400).json({ status: 'ERROR', message: 'Los campos rawMaterialId, finalProductId e inputQtyKg son obligatorios.' });
        return;
      }

      const previewData = await this.fractioningService.calculatePreview({
        rawMaterialId,
        finalProductId,
        inputQtyKg: parseFloat(inputQtyKg),
        actualOutputUnits: actualOutputUnits !== undefined ? parseInt(actualOutputUnits, 10) : undefined
      });

      res.json({ status: 'SUCCESS', data: previewData });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  execute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        rawMaterialId, finalProductId, inputQtyKg, actualOutputUnits, wasteReason, 
        rawMaterialBatch, generatedBatch, expirationDate, operatorName, notes 
      } = req.body;

      if (!rawMaterialId || !finalProductId || inputQtyKg === undefined || actualOutputUnits === undefined || !rawMaterialBatch || !expirationDate || !operatorName) {
        res.status(400).json({ status: 'ERROR', message: 'Faltan campos obligatorios para ejecutar el fraccionado.' });
        return;
      }

      const result = await this.fractioningService.executeFractioning({
        rawMaterialId,
        finalProductId,
        inputQtyKg: parseFloat(inputQtyKg),
        actualOutputUnits: parseInt(actualOutputUnits, 10),
        wasteReason,
        rawMaterialBatch,
        generatedBatch,
        expirationDate,
        operatorName,
        notes
      });

      res.status(201).json({ status: 'SUCCESS', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const history = await this.fractioningService.getHistory();
      res.json({ status: 'SUCCESS', count: history.length, data: history });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };
}
