"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleController = void 0;
const saleService_1 = require("../services/saleService");
function sendError(res, error, fallbackMsg) {
    const status = error instanceof saleService_1.PersistenceError ? error.httpStatus : 500;
    res.status(status).json({
        error: status === 503 ? 'DATABASE_UNAVAILABLE' : status === 404 ? 'NOT_FOUND' : status === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
        message: error?.message || fallbackMsg
    });
}
class SaleController {
    saleService;
    constructor(saleService) {
        this.saleService = saleService;
    }
    /**
     * POST /api/v1/sales/orders
     * Crea un nuevo pedido / venta.
     */
    create = async (req, res) => {
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
            const order = await this.saleService.createOrder({
                ...req.body,
                channel,
                discountAmount: req.body.discountAmount ?? req.body.discount ?? 0,
                deliveryFee: req.body.deliveryFee ?? req.body.shippingFee ?? 0,
                sellerId: req.body.sellerId || req.user?.userId,
                sellerName: req.body.sellerName || req.user?.name
            });
            res.status(201).json({
                status: 'SUCCESS',
                message: 'Pedido / Venta creado exitosamente.',
                data: order
            });
        }
        catch (error) {
            sendError(res, error, 'Error al procesar la venta o pedido.');
        }
    };
    /**
     * GET /api/v1/sales/orders
     * Obtiene la lista de pedidos con filtros opcionales.
     */
    getAll = async (req, res) => {
        try {
            const { customerId, status, paymentStatus, startDate, endDate, search, limit, offset } = req.query;
            const result = await this.saleService.getOrders({
                customerId: customerId,
                status: status,
                paymentStatus: paymentStatus,
                startDate: startDate,
                endDate: endDate,
                search: search,
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined
            });
            res.json({
                status: 'SUCCESS',
                data: result.orders,
                total: result.total
            });
        }
        catch (error) {
            sendError(res, error, 'Error al consultar listado de pedidos.');
        }
    };
    /**
     * GET /api/v1/sales/orders/:id
     * Obtiene un pedido por su ID.
     */
    getById = async (req, res) => {
        try {
            const { id } = req.params;
            const order = await this.saleService.getOrderById(id);
            res.json({
                status: 'SUCCESS',
                data: order
            });
        }
        catch (error) {
            sendError(res, error, 'Pedido no encontrado.');
        }
    };
    /**
     * PATCH /api/v1/sales/orders/:id/status
     * Actualiza el estado operativo o de pago de un pedido.
     */
    updateStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const updatedOrder = await this.saleService.updateOrderStatus(id, req.body);
            res.json({
                status: 'SUCCESS',
                message: 'Estado de pedido actualizado correctamente.',
                data: updatedOrder
            });
        }
        catch (error) {
            sendError(res, error, 'Error al actualizar el estado del pedido.');
        }
    };
}
exports.SaleController = SaleController;
