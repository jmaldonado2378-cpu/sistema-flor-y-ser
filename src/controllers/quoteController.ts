import { Request, Response } from 'express';
import { QuoteService } from '../services/quoteService';

export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  /**
   * POST /api/v1/sales/quotes
   * Emite un nuevo presupuesto formal.
   */
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, expirationDate, items } = req.body;

      if (!customerId || !expirationDate || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Debe especificar customerId, expirationDate e items (un array no vacío de productos).'
        });
        return;
      }

      const quote = await this.quoteService.createQuote(req.body);
      res.status(201).json({
        status: 'SUCCESS',
        message: 'Presupuesto creado correctamente.',
        data: quote
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error al emitir el presupuesto.'
      });
    }
  };

  /**
   * GET /api/v1/sales/quotes
   * Obtiene presupuestos registrados con filtros opcionales.
   */
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, status, startDate, endDate, search, limit, offset } = req.query;

      const result = await this.quoteService.getQuotes({
        customerId: customerId as string,
        status: status as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined
      });

      res.json({
        status: 'SUCCESS',
        data: result.quotes,
        total: result.total
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error al consultar presupuestos.'
      });
    }
  };

  /**
   * GET /api/v1/sales/quotes/:id
   * Obtiene un presupuesto por su ID.
   */
  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const quote = await this.quoteService.getQuoteById(id);
      res.json({
        status: 'SUCCESS',
        data: quote
      });
    } catch (error: any) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message || 'Presupuesto no encontrado.'
      });
    }
  };

  /**
   * PATCH /api/v1/sales/quotes/:id
   * Actualiza el estado o la fecha de vencimiento del presupuesto.
   */
  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedQuote = await this.quoteService.updateQuote(id, req.body);
      res.json({
        status: 'SUCCESS',
        message: 'Presupuesto actualizado correctamente.',
        data: updatedQuote
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error al actualizar el presupuesto.'
      });
    }
  };

  /**
   * POST /api/v1/sales/quotes/:id/convert-to-order
   * CONVERSIÓN EN 1 CLIC: Convierte un Presupuesto a un Pedido/Venta firme inmediatamente.
   */
  public convertToOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.quoteService.convertQuoteToOrder(id, req.body);

      res.status(200).json({
        status: 'SUCCESS',
        message: 'Presupuesto convertido a Pedido exitosamente en 1 clic.',
        data: {
          order: result.order,
          quote: result.quote
        }
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: error.message || 'Error al convertir el presupuesto a pedido.'
      });
    }
  };
}
