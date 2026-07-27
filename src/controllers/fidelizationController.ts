import { Request, Response } from 'express';
import { FidelizationService } from '../services/fidelizationService';

export class FidelizationController {
  constructor(private fidelizationService: FidelizationService) {}

  /**
   * POST /api/v1/customers/:id/points/accumulate
   * Acumular puntos por compra realizada.
   */
  accumulate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { amountSpent, referenceId, description } = req.body;

      if (amountSpent === undefined || amountSpent <= 0) {
        res.status(400).json({ success: false, error: 'El monto de la compra (amountSpent) debe ser mayor a cero.' });
        return;
      }

      const result = await this.fidelizationService.accumulatePoints({
        customerId: id,
        amountSpent: parseFloat(amountSpent),
        referenceId,
        description
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Se acumularon ${result.pointsEarned} puntos exitosamente. Nuevo saldo: ${result.newBalance} pts.`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Error al acumular puntos de fidelidad.', details: error.message });
    }
  };

  /**
   * POST /api/v1/customers/:id/points/redeem
   * Canjear puntos acumulados por descuento monetario.
   */
  redeem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { pointsToRedeem, referenceId, description } = req.body;

      if (!pointsToRedeem || parseInt(pointsToRedeem, 10) <= 0) {
        res.status(400).json({ success: false, error: 'La cantidad de puntos a canjear (pointsToRedeem) es requerida y debe ser mayor a cero.' });
        return;
      }

      const result = await this.fidelizationService.redeemPoints({
        customerId: id,
        pointsToRedeem: parseInt(pointsToRedeem, 10),
        referenceId,
        description
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `¡Canje exitoso de ${result.pointsRedeemed} pts por un descuento de $${result.discountAmount.toLocaleString()}! Saldo restante: ${result.newBalance} pts.`
      });
    } catch (error: any) {
      if (error.message && error.message.includes('Saldo insuficiente')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }

      res.status(500).json({ success: false, error: 'Error al procesar el canje de puntos.', details: error.message });
    }
  };

  /**
   * POST /api/v1/customers/:id/points/adjust
   * Ajuste manual de puntos por parte de la administración.
   */
  adjust = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { pointsDelta, reason } = req.body;

      if (pointsDelta === undefined || pointsDelta === 0 || !reason) {
        res.status(400).json({ success: false, error: 'Los campos pointsDelta (diferente de 0) y reason son obligatorios para realizar un ajuste manual.' });
        return;
      }

      const result = await this.fidelizationService.adjustPoints({
        customerId: id,
        pointsDelta: parseInt(pointsDelta, 10),
        reason
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Ajuste manual aplicado correctamente. Nuevo saldo: ${result.newBalance} pts.`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Error al aplicar el ajuste manual de puntos.', details: error.message });
    }
  };

  /**
   * GET /api/v1/customers/:id/points/history
   * Consulta del historial de transacciones de puntos.
   */
  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const history = await this.fidelizationService.getPointsHistory(id);

      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Error al obtener historial de puntos.', details: error.message });
    }
  };

  /**
   * GET /api/v1/customers/:id/points/summary
   * Resumen de puntos y equivalencia monetaria.
   */
  getSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const summary = await this.fidelizationService.getPointsSummary(id);

      res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Error al obtener resumen de puntos.', details: error.message });
    }
  };
}
