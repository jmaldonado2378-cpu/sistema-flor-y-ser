import { Request, Response } from 'express';
import { RawMaterialService } from '../services/rawMaterialService';

export class RawMaterialController {
  constructor(private rawMaterialService: RawMaterialService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const materials = await this.rawMaterialService.getAll();
      res.json({ status: 'SUCCESS', count: materials.length, data: materials });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, name, unit, currentStock, minStock, costPerUnit, supplierName, storageLocation } = req.body;

      if (!code || !name || currentStock === undefined) {
        res.status(400).json({ status: 'ERROR', message: 'Los campos code, name y currentStock son obligatorios.' });
        return;
      }

      const created = await this.rawMaterialService.create({
        code,
        name,
        unit: unit || 'KG',
        currentStock: parseFloat(currentStock),
        minStock: minStock ? parseFloat(minStock) : 5.0,
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : 0,
        supplierName,
        storageLocation
      });

      res.status(201).json({ status: 'SUCCESS', data: created });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  updateStock = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { newStock } = req.body;

      if (newStock === undefined) {
        res.status(400).json({ status: 'ERROR', message: 'El campo newStock es obligatorio.' });
        return;
      }

      const updated = await this.rawMaterialService.updateStock(id, parseFloat(newStock));
      if (!updated) {
        res.status(404).json({ status: 'ERROR', message: 'Materia prima no encontrada.' });
        return;
      }

      res.json({ status: 'SUCCESS', data: updated });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };
}
