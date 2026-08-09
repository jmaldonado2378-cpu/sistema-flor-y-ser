"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingAccountController = void 0;
class CheckingAccountController {
    checkingAccountService;
    constructor(checkingAccountService) {
        this.checkingAccountService = checkingAccountService;
    }
    /**
     * GET /api/v1/sales/checking-accounts
     * Obtiene la lista completa de cuentas corrientes de todos los clientes.
     */
    getAllAccounts = async (req, res) => {
        try {
            const accounts = await this.checkingAccountService.getAllAccounts();
            res.json({
                status: 'SUCCESS',
                count: accounts.length,
                data: accounts
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al obtener cuentas corrientes.'
            });
        }
    };
    /**
     * GET /api/v1/sales/customers/:customerId/checking-account
     * Obtiene el resumen del estado de cuenta corriente de un cliente.
     */
    getSummary = async (req, res) => {
        try {
            const { customerId } = req.params;
            const summary = await this.checkingAccountService.getSummary(customerId);
            res.json({
                status: 'SUCCESS',
                data: summary
            });
        }
        catch (error) {
            res.status(404).json({
                error: 'NOT_FOUND',
                message: error.message || 'Cuenta corriente de cliente no encontrada.'
            });
        }
    };
    /**
     * GET /api/v1/sales/customers/:customerId/checking-account/statement
     * Emisión de extracto de cuenta corriente (estándar o detallado con desglose de ítems)
     * listo para envío formateado por WhatsApp.
     */
    getStatement = async (req, res) => {
        try {
            const { customerId } = req.params;
            const { startDate, endDate, detailed, incluirDetalleItems } = req.query;
            if (detailed === 'true' || incluirDetalleItems === 'true') {
                const statement = await this.checkingAccountService.getExtractoDetallado({
                    clienteId: customerId,
                    fechaInicio: startDate,
                    fechaFin: endDate,
                    incluirDetalleItems: true
                });
                res.json({
                    status: 'SUCCESS',
                    data: statement
                });
                return;
            }
            const statement = await this.checkingAccountService.getStatement({
                customerId,
                startDate: startDate,
                endDate: endDate
            });
            res.json({
                status: 'SUCCESS',
                data: statement
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al emitir el extracto de cuenta corriente.'
            });
        }
    };
    /**
     * POST /api/v1/sales/customers/:customerId/checking-account/collections
     * POST /api/v1/sales/customers/:customerId/checking-account/payments
     * Registra un cobro a cuenta de un cliente en su cuenta corriente (disminuye la deuda de la cuenta corriente).
     */
    registerCollection = async (req, res) => {
        try {
            const { customerId } = req.params;
            const { monto, amount, metodoPago, paymentMethod, numeroComprobanteRef, referenceNumber, pedidoId, orderId, notas, notes } = req.body;
            const montoFinal = monto !== undefined ? monto : amount;
            const metodoFinal = metodoPago || paymentMethod || 'CASH';
            const refFinal = numeroComprobanteRef || referenceNumber;
            const pedidoFinal = pedidoId || orderId;
            const notasFinal = notas || notes;
            if (!montoFinal || montoFinal <= 0) {
                res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: 'Debe especificar un monto a cobrar mayor a 0.'
                });
                return;
            }
            const recibo = await this.checkingAccountService.registrarCobroCliente({
                clienteId: customerId,
                monto: montoFinal,
                metodoPago: metodoFinal,
                numeroComprobanteRef: refFinal,
                pedidoId: pedidoFinal,
                notas: notasFinal
            });
            res.status(201).json({
                status: 'SUCCESS',
                message: 'Cobro a cuenta de cliente registrado exitosamente en la cuenta corriente.',
                data: recibo
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al registrar el cobro a cuenta del cliente.'
            });
        }
    };
    /**
     * POST /api/v1/sales/customers/:customerId/checking-account/adjustments
     * Registra un movimiento manual (Ajuste de débito o crédito) en la cuenta corriente del cliente.
     */
    addManualAdjustment = async (req, res) => {
        try {
            const { customerId } = req.params;
            const { movementType, amount, description } = req.body;
            if (!movementType || !amount || amount <= 0 || !description) {
                res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: 'Debe especificar movementType ("DEBIT" o "CREDIT"), amount (> 0) y description.'
                });
                return;
            }
            const movement = await this.checkingAccountService.addMovement(customerId, movementType, amount, 'MANUAL_ADJUSTMENT', description);
            res.status(201).json({
                status: 'SUCCESS',
                message: 'Ajuste manual de cuenta corriente registrado exitosamente.',
                data: movement
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al registrar el ajuste manual de cuenta corriente.'
            });
        }
    };
    /**
     * PATCH /api/v1/sales/customers/:customerId/checking-account/credit-limit
     * Actualiza el límite de crédito configurado para un cliente.
     */
    updateCreditLimit = async (req, res) => {
        try {
            const { customerId } = req.params;
            const { creditLimit } = req.body;
            if (creditLimit === undefined || creditLimit < 0) {
                res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: 'Debe especificar un creditLimit mayor o igual a 0.'
                });
                return;
            }
            const summary = await this.checkingAccountService.updateCreditLimit(customerId, creditLimit);
            res.json({
                status: 'SUCCESS',
                message: 'Límite de crédito actualizado correctamente.',
                data: summary
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al actualizar el límite de crédito.'
            });
        }
    };
}
exports.CheckingAccountController = CheckingAccountController;
