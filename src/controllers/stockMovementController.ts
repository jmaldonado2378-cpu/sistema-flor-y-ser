import { Request, Response } from 'express';
import { StockMovementService } from '../services/stockMovementService';

export class StockMovementController {
  constructor(private stockMovementService: StockMovementService) {}

  getMovements = async (req: Request, res: Response): Promise<void> => {
    try {
      const { itemId, itemType, movementType, startDate, endDate, search, limit, offset } = req.query;

      const result = await this.stockMovementService.getMovements({
        itemId: itemId as string,
        itemType: itemType as any,
        movementType: movementType as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined
      });

      res.json({
        status: 'SUCCESS',
        data: result.movements,
        total: result.total
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al consultar movimientos de stock' });
    }
  };

  adjustStock = async (req: Request, res: Response): Promise<void> => {
    try {
      const { itemType, itemId, adjustmentType, quantity, reason, notes } = req.body;

      if (!itemType || !itemId || !adjustmentType || quantity === undefined) {
        res.status(400).json({
          error: 'itemType, itemId, adjustmentType y quantity son campos requeridos.'
        });
        return;
      }

      const userName = req.user?.name || 'Administrador';

      const result = await this.stockMovementService.adjustStock({
        itemType,
        itemId,
        adjustmentType,
        quantity: parseFloat(quantity),
        reason: reason || 'Ajuste manual de inventario',
        notes
      }, userName);

      res.status(200).json({
        status: 'SUCCESS',
        message: 'Ajuste de stock registrado exitosamente.',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al procesar el ajuste de stock' });
    }
  };
}
