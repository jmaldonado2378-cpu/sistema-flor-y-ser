import { Request, Response } from 'express';
import { ReportsService } from '../services/reportsService';

export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  /**
   * GET /api/v1/reports/kpis
   * Resumen Ejecutivo Consolidado para Dashboard Principales
   */
  getExecutiveSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.reportsService.getExecutiveSummary();
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo el resumen ejecutivo de KPIs.',
        details: error.message
      });
    }
  };

  /**
   * GET /api/v1/reports/ticket-promedio
   * Evolución de ticket promedio por canal de venta y top clientes
   */
  getTicketPromedio = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.reportsService.getTicketPromedioReport();
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo reporte de ticket promedio.',
        details: error.message
      });
    }
  };

  /**
   * GET /api/v1/reports/productos-estrella?dietaryCode=VEGAN
   * Ranking de productos más vendidos por dieta
   */
  getStarProductsByDiet = async (req: Request, res: Response): Promise<void> => {
    try {
      const dietaryCode = (req.query.dietaryCode as string) || 'VEGAN';
      const report = await this.reportsService.getStarProductsByDiet(dietaryCode);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo productos estrella por perfil dietético.',
        details: error.message
      });
    }
  };

  /**
   * GET /api/v1/reports/tasa-recompra
   * Métricas de retención y recompra de clientes
   */
  getRepurchaseRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.reportsService.getRepurchaseRateReport();
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo tasa de recompra y fidelización.',
        details: error.message
      });
    }
  };

  /**
   * GET /api/v1/reports/clientes-inactivos?daysRange=30|60|90
   * Clientes sin compras en los últimos 30, 60 y 90 días
   */
  getInactiveCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
      const daysRangeStr = req.query.daysRange as string;
      const daysRange = daysRangeStr ? parseInt(daysRangeStr, 10) : undefined;
      const report = await this.reportsService.getInactiveCustomersReport(daysRange);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo listado de clientes inactivos.',
        details: error.message
      });
    }
  };

  /**
   * GET /api/v1/reports/arqueo-caja?date=2026-07-22
   * Arqueo diario de caja, cobros por medio de pago y diferencia
   */
  getDailyCashAudit = async (req: Request, res: Response): Promise<void> => {
    try {
      const dateStr = req.query.date as string;
      const report = await this.reportsService.getDailyCashAudit(dateStr);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo arqueo diario de caja.',
        details: error.message
      });
    }
  };

  /**
   * POST /api/v1/reports/arqueo-caja/cerrar
   * Cierre de arqueo diario con registro de efectivo real contado
   */
  closeCashShift = async (req: Request, res: Response): Promise<void> => {
    try {
      const { actualCashInHand, notes } = req.body;

      if (actualCashInHand === undefined || isNaN(parseFloat(actualCashInHand))) {
        res.status(400).json({
          success: false,
          error: 'El campo actualCashInHand es obligatorio y debe ser un número.'
        });
        return;
      }

      const report = await this.reportsService.closeCashShift({
        actualCashInHand: parseFloat(actualCashInHand),
        notes
      });

      res.json({
        success: true,
        message: 'Arqueo de caja cerrado correctamente.',
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error cerrando el arqueo de caja.',
        details: error.message
      });
    }
  };

  /**
   * GET /api/v1/reports/cuentas-corrientes
   * Balance global de Cuentas Corrientes y estados de deuda
   */
  getCurrentAccountsBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.reportsService.getGlobalCurrentAccountsReport();
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo balance de cuentas corrientes.',
        details: error.message
      });
    }
  };
}
