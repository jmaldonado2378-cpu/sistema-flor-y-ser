"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierController = void 0;
class SupplierController {
    supplierService;
    constructor(supplierService) {
        this.supplierService = supplierService;
    }
    // =========================================================================
    // 1. PROVEEDORES
    // =========================================================================
    /**
     * POST /api/v1/suppliers
     * Registra un nuevo proveedor.
     */
    createSupplier = async (req, res) => {
        try {
            const dto = req.body;
            const supplier = await this.supplierService.createSupplier(dto);
            res.status(201).json({
                success: true,
                message: 'Proveedor registrado exitosamente.',
                data: supplier
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Error al registrar el proveedor.'
            });
        }
    };
    /**
     * PUT /api/v1/suppliers/:id
     * Actualiza los datos de un proveedor.
     */
    updateSupplier = async (req, res) => {
        try {
            const supplierId = req.params.id;
            const dto = req.body;
            const supplier = await this.supplierService.updateSupplier(supplierId, dto);
            res.json({
                success: true,
                message: 'Proveedor actualizado exitosamente.',
                data: supplier
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Error al actualizar el proveedor.'
            });
        }
    };
    /**
     * GET /api/v1/suppliers/:id
     * Obtiene un proveedor por ID.
     */
    getSupplierById = async (req, res) => {
        try {
            const supplierId = req.params.id;
            const supplier = await this.supplierService.getSupplierById(supplierId);
            res.json({
                success: true,
                data: supplier
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                error: error.message || 'Proveedor no encontrado.'
            });
        }
    };
    /**
     * GET /api/v1/suppliers
     * Lista y busca proveedores con filtros.
     */
    searchSuppliers = async (req, res) => {
        try {
            const filters = {
                search: req.query.search,
                category: req.query.category,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
            };
            const result = await this.supplierService.searchSuppliers(filters);
            res.json({
                success: true,
                total: result.total,
                data: result.suppliers
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Error al buscar proveedores.'
            });
        }
    };
    /**
     * DELETE /api/v1/suppliers/:id
     * Desactiva un proveedor.
     */
    deleteSupplier = async (req, res) => {
        try {
            const supplierId = req.params.id;
            await this.supplierService.deleteSupplier(supplierId);
            res.json({
                success: true,
                message: 'Proveedor desactivado correctamente.'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Error al desactivar el proveedor.'
            });
        }
    };
    // =========================================================================
    // 2. RECEPCIÓN E INGRESO DE MERCADERÍA (GRANEL Y ELABORADOS)
    // =========================================================================
    /**
     * POST /api/v1/merchandise-receipts
     * Registra el ingreso de mercadería (granel o elaborados) y actualiza stock.
     */
    createMerchandiseReceipt = async (req, res) => {
        try {
            const dto = req.body;
            const receipt = await this.supplierService.createMerchandiseReceipt(dto);
            res.status(201).json({
                success: true,
                message: 'Recepción e ingreso de mercadería registrados exitosamente.',
                data: receipt
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Error al registrar la recepción de mercadería.'
            });
        }
    };
    /**
     * POST /api/v1/merchandise-receipts/raw
     * Registra una factura o comprobante de recepción de insumos a granel,
     * incrementando el stock de materia prima (raw_materials) y registrando el costo por kg / unidad de medida.
     */
    createRawMaterialReceipt = async (req, res) => {
        try {
            const body = req.body;
            const dto = {
                numeroComprobante: body.numeroComprobante || body.receiptNumber,
                proveedorId: body.proveedorId || body.supplierId,
                tipoComprobante: body.tipoComprobante || body.receiptType,
                fechaEmision: body.fechaEmision || body.issueDate,
                fechaRecepcion: body.fechaRecepcion || body.receptionDate,
                fechaVencimientoPago: body.fechaVencimientoPago || body.dueDate,
                diasCreditoPago: body.diasCreditoPago || body.paymentTermsDays,
                insumos: (body.insumos || body.items || []).map((item) => ({
                    materiaPrimaId: item.materiaPrimaId || item.productId,
                    codigoMateriaPrima: item.codigoMateriaPrima || item.sku,
                    nombreInsumo: item.nombreInsumo || item.itemName,
                    unidadMedida: item.unidadMedida || item.unitOfMeasure || 'KG',
                    cantidadIngresada: item.cantidadIngresada !== undefined ? item.cantidadIngresada : item.quantity,
                    costoPorKg: item.costoPorKg !== undefined ? item.costoPorKg : item.unitCost,
                    numeroLote: item.numeroLote || item.lotNumber,
                    fechaVencimiento: item.fechaVencimiento || item.expirationDate,
                    ubicacionDeposito: item.ubicacionDeposito
                })),
                notas: body.notas || body.notes
            };
            const comprobante = await this.supplierService.createRawMaterialReceipt(dto);
            res.status(201).json({
                success: true,
                message: 'Recepción e ingreso de insumos a granel registrado exitosamente incrementando el stock de materias primas.',
                data: comprobante
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Error al registrar el ingreso de insumos a granel.'
            });
        }
    };
    /**
     * GET /api/v1/merchandise-receipts/:id
     * Obtiene el detalle de una recepción por ID.
     */
    getMerchandiseReceiptById = async (req, res) => {
        try {
            const receiptId = req.params.id;
            const receipt = await this.supplierService.getMerchandiseReceiptById(receiptId);
            res.json({
                success: true,
                data: receipt
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                error: error.message || 'Recepción no encontrada.'
            });
        }
    };
    /**
     * GET /api/v1/merchandise-receipts
     * Consulta el historial de recepciones e ingresos de mercadería.
     */
    searchMerchandiseReceipts = async (req, res) => {
        try {
            const filters = {
                supplierId: req.query.supplierId,
                paymentStatus: req.query.paymentStatus,
                receiptType: req.query.receiptType,
                search: req.query.search
            };
            const result = await this.supplierService.searchMerchandiseReceipts(filters);
            res.json({
                success: true,
                total: result.total,
                data: result.receipts
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Error al consultar recepciones de mercadería.'
            });
        }
    };
    // =========================================================================
    // 3. CUENTAS POR PAGAR Y REGISTRO DE PAGOS A PROVEEDORES
    // =========================================================================
    /**
     * POST /api/v1/accounts-payable/payments
     * Registra un pago o abono a una factura de proveedor.
     */
    registerPayment = async (req, res) => {
        try {
            const dto = req.body;
            const payment = await this.supplierService.registerPayment(dto);
            res.status(201).json({
                success: true,
                message: 'Pago a proveedor registrado exitosamente.',
                data: payment
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Error al registrar el pago al proveedor.'
            });
        }
    };
    /**
     * GET /api/v1/accounts-payable/receipts/:id/payments
     * Obtiene el historial de pagos de una factura.
     */
    getPaymentsByReceipt = async (req, res) => {
        try {
            const receiptId = req.params.id;
            const payments = await this.supplierService.getPaymentsByReceipt(receiptId);
            res.json({
                success: true,
                data: payments
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Error al obtener los pagos de la factura.'
            });
        }
    };
    /**
     * GET /api/v1/accounts-payable/calendar
     * Obtiene el Calendario de Vencimientos de Cuentas por Pagar y Resumen Financiero.
     */
    getAccountsPayableCalendar = async (req, res) => {
        try {
            const filters = {
                supplierId: req.query.supplierId,
                urgency: req.query.urgency,
                paymentStatus: req.query.paymentStatus
            };
            const result = await this.supplierService.getAccountsPayableCalendar(filters);
            res.json({
                success: true,
                summary: result.summary,
                data: result.calendar
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Error al consultar el calendario de vencimientos de cuentas por pagar.'
            });
        }
    };
}
exports.SupplierController = SupplierController;
