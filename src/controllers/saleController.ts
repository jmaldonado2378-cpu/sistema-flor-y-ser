import { Request, Response } from 'express';
import { SaleService } from '../services/saleService';

export class SaleController {
  constructor(private saleService: SaleService) {}

  /**
   * POST /api/v1/sales/orders
   * Crea un nuevo pedido / venta.
   */
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, items } = req.body;
      const channel = req.body.channel || 'LOCAL';

      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Debe especificar customerId e items (un array no vacío con al menos un producto).'
        });
        return;
      }

      const order = await this.saleService.createOrder({ ...req.body, channel });
      res.status(201).json({
        status: 'SUCCESS',
        message: 'Pedido / Venta creado exitosamente.',
        data: order
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error al procesar la venta o pedido.'
      });
    }
  };

  /**
   * GET /api/v1/sales/orders
   * Obtiene la lista de pedidos con filtros opcionales.
   */
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, status, paymentStatus, startDate, endDate, search, limit, offset } = req.query;

      const result = await this.saleService.getOrders({
        customerId: customerId as string,
        status: status as any,
        paymentStatus: paymentStatus as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined
      });

      res.json({
        status: 'SUCCESS',
        data: result.orders,
        total: result.total
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error al consultar listado de pedidos.'
      });
    }
  };

  /**
   * GET /api/v1/sales/orders/:id
   * Obtiene un pedido por su ID.
   */
  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await this.saleService.getOrderById(id);
      res.json({
        status: 'SUCCESS',
        data: order
      });
    } catch (error: any) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message || 'Pedido no encontrado.'
      });
    }
  };

  /**
   * PATCH /api/v1/sales/orders/:id/status
   * Actualiza el estado operativo o de pago de un pedido.
   */
  public updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedOrder = await this.saleService.updateOrderStatus(id, req.body);
      res.json({
        status: 'SUCCESS',
        message: 'Estado de pedido actualizado correctamente.',
        data: updatedOrder
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error al actualizar el estado del pedido.'
      });
    }
  };
}
