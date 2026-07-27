"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    /**
     * POST /api/v1/sales/payments
     * Registra un nuevo cobro (Efectivo, Mercado Pago, Transferencia o Imputación a Cuenta Corriente).
     */
    register = async (req, res) => {
        try {
            const { customerId, paymentMethod, amount } = req.body;
            if (!customerId || !paymentMethod || !amount || amount <= 0) {
                res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: 'Debe especificar customerId, paymentMethod y un monto (amount) mayor a 0.'
                });
                return;
            }
            const payment = await this.paymentService.registerPayment(req.body);
            res.status(201).json({
                status: 'SUCCESS',
                message: 'Cobro registrado correctamente.',
                data: payment
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al registrar el cobro.'
            });
        }
    };
    /**
     * GET /api/v1/sales/customers/:customerId/payments
     * Obtiene la lista de cobros de un cliente específico.
     */
    getByCustomer = async (req, res) => {
        try {
            const { customerId } = req.params;
            const payments = await this.paymentService.getPaymentsByCustomer(customerId);
            res.json({
                status: 'SUCCESS',
                data: payments
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al consultar cobros del cliente.'
            });
        }
    };
    /**
     * GET /api/v1/sales/orders/:orderId/payments
     * Obtiene la lista de cobros asociados a un pedido.
     */
    getByOrder = async (req, res) => {
        try {
            const { orderId } = req.params;
            const payments = await this.paymentService.getPaymentsByOrder(orderId);
            res.json({
                status: 'SUCCESS',
                data: payments
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al consultar cobros del pedido.'
            });
        }
    };
    /**
     * GET /api/v1/sales/payments/:id
     * Obtiene un comprobante de cobro por su ID.
     */
    getById = async (req, res) => {
        try {
            const { id } = req.params;
            const payment = await this.paymentService.getPaymentById(id);
            res.json({
                status: 'SUCCESS',
                data: payment
            });
        }
        catch (error) {
            res.status(404).json({
                error: 'NOT_FOUND',
                message: error.message || 'Cobro no encontrado.'
            });
        }
    };
}
exports.PaymentController = PaymentController;
