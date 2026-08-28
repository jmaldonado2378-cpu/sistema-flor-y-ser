import { Request, Response } from 'express';
import { FinanceService } from '../services/financeService';
import { ExpenseCategory } from '../types/finance';

/**
 * Controlador de Finanzas, Gastos Operativos y Estructura de Precios & Costos
 * Flor y Ser - Almacén Natural ERP/CRM v2.0
 */
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  // =========================================================================
  // ENDPOINTS DE GASTOS OPERATIVOS (/api/v1/finance/expenses)
  // =========================================================================

  /**
   * GET /api/v1/finance/expenses
   * Obtiene la lista de gastos operativos con filtros opcionales de categoría, rango de fechas y búsqueda.
   */
  getExpenses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, startDate, endDate, searchQuery, minAmount, maxAmount } = req.query;

      const expenses = await this.financeService.getExpenses({
        category: category as ExpenseCategory,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        searchQuery: searchQuery ? String(searchQuery) : undefined,
        minAmount: minAmount ? parseFloat(String(minAmount)) : undefined,
        maxAmount: maxAmount ? parseFloat(String(maxAmount)) : undefined
      });

      res.json({
        status: 'SUCCESS',
        count: expenses.length,
        data: expenses
      });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * GET /api/v1/finance/expenses/summary
   * Obtiene el reporte financiero consolidado de gastos por categoría y promedios.
   */
  getExpenseSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const summary = await this.financeService.getExpenseSummary(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined
      );

      res.json({
        status: 'SUCCESS',
        data: summary
      });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * GET /api/v1/finance/expenses/:id
   * Obtiene el detalle de un gasto operativo por su ID.
   */
  getExpenseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const expense = await this.financeService.getExpenseById(id);

      if (!expense) {
        res.status(404).json({ status: 'ERROR', message: `Gasto con ID ${id} no encontrado.` });
        return;
      }

      res.json({ status: 'SUCCESS', data: expense });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * POST /api/v1/finance/expenses
   * Crea un nuevo gasto operativo.
   */
  createExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { description, category, voucherType, voucherNumber, expenseDate, amount, paymentMethod, supplierId, supplierName, notes } = req.body;

      if (!description || !category || amount === undefined) {
        res.status(400).json({
          status: 'ERROR',
          message: 'Los campos description, category y amount son obligatorios.'
        });
        return;
      }

      const expense = await this.financeService.createExpense({
        description,
        category,
        voucherType,
        voucherNumber,
        expenseDate,
        amount: parseFloat(amount),
        paymentMethod,
        supplierId,
        supplierName,
        notes
      });

      res.status(201).json({
        status: 'SUCCESS',
        message: 'Gasto operativo registrado exitosamente.',
        data: expense
      });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * PUT /api/v1/finance/expenses/:id
   * Actualiza un gasto operativo existente.
   */
  updateExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { description, category, voucherType, voucherNumber, expenseDate, amount, paymentMethod, supplierId, supplierName, notes } = req.body;

      const updatedExpense = await this.financeService.updateExpense(id, {
        description,
        category,
        voucherType,
        voucherNumber,
        expenseDate,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        paymentMethod,
        supplierId,
        supplierName,
        notes
      });

      res.json({
        status: 'SUCCESS',
        message: 'Gasto operativo actualizado exitosamente.',
        data: updatedExpense
      });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * DELETE /api/v1/finance/expenses/:id
   * Elimina un gasto operativo por su ID.
   */
  deleteExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.financeService.deleteExpense(id);

      if (!deleted) {
        res.status(404).json({ status: 'ERROR', message: `No se encontró el gasto con ID ${id} para eliminar.` });
        return;
      }

      res.json({
        status: 'SUCCESS',
        message: 'Gasto operativo eliminado correctamente.'
      });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  // =========================================================================
  // ENDPOINTS DE ESTRUCTURA DE PRECIOS Y COSTOS (/api/v1/finance/pricing-structure)
  // =========================================================================

  /**
   * GET /api/v1/finance/pricing-structure
   * Obtiene la estructura completa de precios y costos para todos los productos.
   */
  getAllPricingStructures = async (req: Request, res: Response): Promise<void> => {
    try {
      const structures = await this.financeService.getAllPricingStructures();
      res.json({
        status: 'SUCCESS',
        count: structures.length,
        data: structures
      });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * GET /api/v1/finance/pricing-structure/overview
   * Obtiene el reporte financiero consolidado de márgenes por canal y comparativa.
   */
  getFinancialOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const overview = await this.financeService.getFinancialOverview();
      res.json({
        status: 'SUCCESS',
        data: overview
      });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * GET /api/v1/finance/pricing-structure/:productId
   * Obtiene la estructura de precios y costos de un producto específico.
   */
  getPricingStructureByProductId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const structure = await this.financeService.getPricingStructureByProductId(productId);

      if (!structure) {
        res.status(404).json({
          status: 'ERROR',
          message: `Estructura de precios no encontrada para el producto ID ${productId}.`
        });
        return;
      }

      res.json({ status: 'SUCCESS', data: structure });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * POST /api/v1/finance/pricing-structure/calculate-preview
   * Simula y calcula el desglose de precios y márgenes sin guardar en base de datos.
   */
  calculatePreview = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        productId, productSku, productName, unitOfMeasure,
        rawMaterialCost, packagingLabelCost, laborCost, allocatedFixedCosts,
        taxPercentage, channels
      } = req.body;

      if (rawMaterialCost === undefined || !channels) {
        res.status(400).json({
          status: 'ERROR',
          message: 'Los campos rawMaterialCost y la configuración de channels (mostrador, whatsapp, tiendaOnline) son obligatorios.'
        });
        return;
      }

      const preview = this.financeService.calculatePricingStructureItem({
        productId,
        productSku,
        productName,
        unitOfMeasure,
        rawMaterialCost: parseFloat(rawMaterialCost),
        packagingLabelCost: packagingLabelCost !== undefined ? parseFloat(packagingLabelCost) : 0,
        laborCost: laborCost !== undefined ? parseFloat(laborCost) : 0,
        allocatedFixedCosts: allocatedFixedCosts !== undefined ? parseFloat(allocatedFixedCosts) : 0,
        taxPercentage: taxPercentage !== undefined ? parseFloat(taxPercentage) : 0,
        channels
      });

      res.json({
        status: 'SUCCESS',
        data: preview
      });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * POST /api/v1/finance/pricing-structure
   * Guarda o actualiza la estructura de precios y costos de un producto.
   */
  savePricingStructure = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        productId, productSku, productName, unitOfMeasure,
        rawMaterialCost, packagingLabelCost, laborCost, allocatedFixedCosts,
        taxPercentage, channels
      } = req.body;

      if (!productId || rawMaterialCost === undefined || !channels) {
        res.status(400).json({
          status: 'ERROR',
          message: 'Los campos productId, rawMaterialCost y la configuración de channels son obligatorios.'
        });
        return;
      }

      const saved = await this.financeService.savePricingStructure({
        productId,
        productSku,
        productName,
        unitOfMeasure,
        rawMaterialCost: parseFloat(rawMaterialCost),
        packagingLabelCost: packagingLabelCost !== undefined ? parseFloat(packagingLabelCost) : 0,
        laborCost: laborCost !== undefined ? parseFloat(laborCost) : 0,
        allocatedFixedCosts: allocatedFixedCosts !== undefined ? parseFloat(allocatedFixedCosts) : 0,
        taxPercentage: taxPercentage !== undefined ? parseFloat(taxPercentage) : 0,
        channels
      });

      res.status(200).json({
        status: 'SUCCESS',
        message: 'Estructura de precios guardada exitosamente.',
        data: saved
      });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  /**
   * POST /api/v1/finance/pricing-structure/allocate-fixed-costs
   * Prorratea los gastos fijos mensuales entre los productos y recalcula sus precios unitarios.
   */
  allocateFixedCosts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { periodMonth, periodYear, totalMonthlyFixedExpenses, allocationMethod, totalActiveProductsCount } = req.body;

      const result = await this.financeService.allocateFixedCosts({
        periodMonth: periodMonth ? parseInt(periodMonth, 10) : undefined,
        periodYear: periodYear ? parseInt(periodYear, 10) : undefined,
        totalMonthlyFixedExpenses: totalMonthlyFixedExpenses !== undefined ? parseFloat(totalMonthlyFixedExpenses) : undefined,
        allocationMethod,
        totalActiveProductsCount: totalActiveProductsCount ? parseInt(totalActiveProductsCount, 10) : undefined
      });

      res.json({
        status: 'SUCCESS',
        message: `Costos fijos prorrateados exitosamente (${result.allocatedFixedCostPerUnit} ARS por unidad en ${result.totalProductsUpdated} productos).`,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  // =========================================================================
  // ENDPOINTS DE COMISIONES Y MONITOR P&L
  // =========================================================================

  getSellerCommissionRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const rates = await this.financeService.getSellerCommissionRates(userId);
      res.json({ status: 'SUCCESS', data: rates });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  setSellerCommissionRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { channel, percentage } = req.body;
      await this.financeService.setSellerCommissionRate(userId, channel, parseFloat(percentage));
      res.json({ status: 'SUCCESS', message: 'Porcentaje de comisión actualizado' });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  getPendingCommissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, startDate, endDate } = req.query;
      const pending = await this.financeService.getPendingCommissions(
        userId ? String(userId) : undefined,
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined
      );
      res.json({ status: 'SUCCESS', data: pending });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  settleCommissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, userName, periodStart, periodEnd, paymentMethod, notes } = req.body;
      const settlement = await this.financeService.settleCommissions(
        userId, userName, periodStart, periodEnd, paymentMethod, notes
      );
      res.json({ status: 'SUCCESS', message: 'Comisiones liquidadas y gasto registrado', data: settlement });
    } catch (error: any) {
      res.status(400).json({ status: 'ERROR', message: error.message });
    }
  };

  getCommissionSettlements = async (req: Request, res: Response): Promise<void> => {
    try {
      const settlements = await this.financeService.getCommissionSettlements();
      res.json({ status: 'SUCCESS', data: settlements });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };

  getProfitabilityMonitor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.financeService.getProfitabilityMonitor(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined
      );
      res.json({ status: 'SUCCESS', data: report });
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  };
}
