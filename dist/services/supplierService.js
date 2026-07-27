"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierService = void 0;
const supplier_1 = require("../types/supplier");
class SupplierService {
    db;
    inMemorySuppliers = [];
    inMemoryReceipts = [];
    inMemoryPayments = [];
    inMemoryRawReceipts = [];
    constructor(db) {
        this.db = db;
        this.initMockData();
    }
    // =========================================================================
    // 1. GESTIÓN DE PROVEEDORES (CRUD Y BÚSQUEDA)
    // =========================================================================
    /**
     * Registra un nuevo proveedor en el sistema.
     */
    async createSupplier(dto) {
        if (!dto.taxId || !dto.businessName || !dto.phone) {
            throw new Error('CUIT/RUT, Razón Social y Teléfono son datos obligatorios para registrar un proveedor.');
        }
        const cleanTaxId = dto.taxId.trim().replace(/-/g, '');
        const cleanPhone = dto.phone.trim();
        try {
            const query = `
        INSERT INTO suppliers (
          tax_id, business_name, contact_name, phone, email, address,
          categories, commercial_terms, delivery_days, bank_details, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;
            const values = [
                cleanTaxId,
                dto.businessName.trim(),
                dto.contactName ? dto.contactName.trim() : null,
                cleanPhone,
                dto.email ? dto.email.trim().toLowerCase() : null,
                dto.address ? dto.address.trim() : null,
                dto.categories || [],
                dto.commercialTerms ? dto.commercialTerms.trim() : null,
                dto.deliveryDays ? dto.deliveryDays.trim() : null,
                dto.bankDetails ? dto.bankDetails.trim() : null,
                dto.notes ? dto.notes.trim() : null
            ];
            const res = await this.db.query(query, values);
            return this.mapSupplierRow(res.rows[0]);
        }
        catch (error) {
            if (error.code === '23505') {
                throw new Error(`Ya existe un proveedor registrado con el CUIT/RUT ${cleanTaxId}.`);
            }
            // Fallback a almacenamiento en memoria
            return this.createSupplierInMemory(dto);
        }
    }
    /**
     * Actualiza la información de un proveedor existente.
     */
    async updateSupplier(supplierId, dto) {
        const existing = await this.getSupplierById(supplierId);
        const taxId = dto.taxId !== undefined ? dto.taxId.trim().replace(/-/g, '') : existing.taxId;
        const businessName = dto.businessName !== undefined ? dto.businessName.trim() : existing.businessName;
        const contactName = dto.contactName !== undefined ? (dto.contactName ? dto.contactName.trim() : null) : existing.contactName;
        const phone = dto.phone !== undefined ? dto.phone.trim() : existing.phone;
        const email = dto.email !== undefined ? (dto.email ? dto.email.trim().toLowerCase() : null) : existing.email;
        const address = dto.address !== undefined ? (dto.address ? dto.address.trim() : null) : existing.address;
        const categories = dto.categories !== undefined ? dto.categories : existing.categories;
        const commercialTerms = dto.commercialTerms !== undefined ? (dto.commercialTerms ? dto.commercialTerms.trim() : null) : existing.commercialTerms;
        const deliveryDays = dto.deliveryDays !== undefined ? (dto.deliveryDays ? dto.deliveryDays.trim() : null) : existing.deliveryDays;
        const bankDetails = dto.bankDetails !== undefined ? (dto.bankDetails ? dto.bankDetails.trim() : null) : existing.bankDetails;
        const notes = dto.notes !== undefined ? (dto.notes ? dto.notes.trim() : null) : existing.notes;
        const isActive = dto.isActive !== undefined ? dto.isActive : existing.isActive;
        try {
            const query = `
        UPDATE suppliers
        SET tax_id = $1, business_name = $2, contact_name = $3, phone = $4, email = $5,
            address = $6, categories = $7, commercial_terms = $8, delivery_days = $9,
            bank_details = $10, notes = $11, is_active = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *;
      `;
            const res = await this.db.query(query, [
                taxId, businessName, contactName, phone, email, address,
                categories, commercialTerms, deliveryDays, bankDetails, notes, isActive, supplierId
            ]);
            if (res.rows.length > 0) {
                return this.mapSupplierRow(res.rows[0]);
            }
        }
        catch {
            // Fallback
        }
        const index = this.inMemorySuppliers.findIndex(s => s.id === supplierId);
        if (index !== -1) {
            this.inMemorySuppliers[index] = {
                ...this.inMemorySuppliers[index],
                taxId,
                businessName,
                contactName: contactName || undefined,
                phone,
                email: email || undefined,
                address: address || undefined,
                categories,
                commercialTerms: commercialTerms || undefined,
                deliveryDays: deliveryDays || undefined,
                bankDetails: bankDetails || undefined,
                notes: notes || undefined,
                isActive,
                updatedAt: new Date().toISOString()
            };
            return this.inMemorySuppliers[index];
        }
        throw new Error(`Proveedor con ID ${supplierId} no encontrado.`);
    }
    /**
     * Obtiene la ficha de un proveedor por ID.
     */
    async getSupplierById(supplierId) {
        try {
            const res = await this.db.query(`SELECT * FROM suppliers WHERE id = $1;`, [supplierId]);
            if (res.rows.length > 0) {
                return this.mapSupplierRow(res.rows[0]);
            }
        }
        catch {
            // Fallback
        }
        const found = this.inMemorySuppliers.find(s => s.id === supplierId);
        if (found) {
            return found;
        }
        throw new Error(`Proveedor con ID ${supplierId} no encontrado.`);
    }
    /**
     * Busca proveedores según criterios de filtrado (búsqueda por texto, categoría o estado).
     */
    async searchSuppliers(filters = {}) {
        try {
            let sql = `SELECT * FROM suppliers WHERE 1=1`;
            const params = [];
            if (filters.search) {
                params.push(`%${filters.search.trim()}%`);
                sql += ` AND (business_name ILIKE $${params.length} OR tax_id ILIKE $${params.length} OR contact_name ILIKE $${params.length})`;
            }
            if (filters.category) {
                params.push(filters.category.trim());
                sql += ` AND $${params.length} = ANY(categories)`;
            }
            if (filters.isActive !== undefined) {
                params.push(filters.isActive);
                sql += ` AND is_active = $${params.length}`;
            }
            sql += ` ORDER BY business_name ASC`;
            const res = await this.db.query(sql, params);
            const suppliers = res.rows.map(r => this.mapSupplierRow(r));
            return { suppliers, total: suppliers.length };
        }
        catch {
            // Fallback en memoria
        }
        let result = [...this.inMemorySuppliers];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(s => s.businessName.toLowerCase().includes(q) ||
                s.taxId.includes(q) ||
                (s.contactName && s.contactName.toLowerCase().includes(q)));
        }
        if (filters.category) {
            const cat = filters.category.toLowerCase();
            result = result.filter(s => s.categories.some(c => c.toLowerCase().includes(cat)));
        }
        if (filters.isActive !== undefined) {
            result = result.filter(s => s.isActive === filters.isActive);
        }
        return { suppliers: result, total: result.length };
    }
    /**
     * Desactiva / Elimina a un proveedor.
     */
    async deleteSupplier(supplierId) {
        try {
            await this.db.query(`UPDATE suppliers SET is_active = FALSE WHERE id = $1;`, [supplierId]);
        }
        catch {
            // Fallback
        }
        const index = this.inMemorySuppliers.findIndex(s => s.id === supplierId);
        if (index !== -1) {
            this.inMemorySuppliers[index].isActive = false;
        }
    }
    // =========================================================================
    // 2. RECEPCIÓN E INGRESO DE MERCADERÍA (GRANEL Y ELABORADOS)
    // =========================================================================
    /**
     * Registra la recepción e ingreso de mercadería a partir de una factura o remito de compra.
     * Actualiza el inventario de materias primas a granel o productos elaborados automáticamente.
     */
    async createMerchandiseReceipt(dto) {
        if (!dto.receiptNumber || !dto.supplierId || !dto.items || dto.items.length === 0) {
            throw new Error('Número de comprobante, proveedor e ítems recibidos son obligatorios.');
        }
        const supplier = await this.getSupplierById(dto.supplierId);
        const issueDate = dto.issueDate || new Date().toISOString().split('T')[0];
        const receptionDate = dto.receptionDate || new Date().toISOString().split('T')[0];
        const termsDays = dto.paymentTermsDays !== undefined ? dto.paymentTermsDays : 30;
        // Calcular fecha de vencimiento si no se proveyó
        let dueDate = dto.dueDate;
        if (!dueDate) {
            const issue = new Date(issueDate);
            issue.setDate(issue.getDate() + termsDays);
            dueDate = issue.toISOString().split('T')[0];
        }
        // Calcular monto total sumando subtotales de ítems
        let totalAmount = 0;
        const itemsProcessed = dto.items.map(item => {
            const subtotal = item.quantity * item.unitCost;
            totalAmount += subtotal;
            return {
                ...item,
                subtotal
            };
        });
        let client;
        try {
            client = await this.db.connect();
            try {
                await client.query('BEGIN');
                // 1. Insertar Cabecera de Recepción
                const receiptQuery = `
          INSERT INTO merchandise_receipts (
            receipt_number, supplier_id, receipt_type, issue_date, reception_date,
            due_date, payment_terms_days, total_amount, paid_amount, payment_status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'PENDING', $9)
          RETURNING id, created_at, updated_at;
        `;
                const receiptRes = await client.query(receiptQuery, [
                    dto.receiptNumber.trim(),
                    dto.supplierId,
                    dto.receiptType || supplier_1.ReceiptType.FACTURA,
                    issueDate,
                    receptionDate,
                    dueDate,
                    termsDays,
                    totalAmount,
                    dto.notes ? dto.notes.trim() : null
                ]);
                const receiptId = receiptRes.rows[0].id;
                const createdAt = receiptRes.rows[0].created_at.toISOString();
                // 2. Insertar Ítems y Sincronizar Stock / Inventario
                const savedItems = [];
                for (const item of itemsProcessed) {
                    let productId = item.productId || null;
                    if (productId) {
                        await client.query(`UPDATE products 
               SET current_stock = current_stock + $1, cost_price = $2, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $3;`, [item.quantity, item.unitCost, productId]);
                    }
                    else {
                        const sku = 'PROD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
                        const newProdRes = await client.query(`INSERT INTO products (sku, name, product_type, unit_of_measure, current_stock, cost_price, supplier_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING id;`, [sku, item.itemName, item.itemType, item.unitOfMeasure, item.quantity, item.unitCost, dto.supplierId]);
                        productId = newProdRes.rows[0].id;
                    }
                    const itemQuery = `
            INSERT INTO merchandise_receipt_items (
              receipt_id, product_id, item_name, item_type, quantity, unit_of_measure,
              unit_cost, subtotal, lot_number, expiration_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at;
          `;
                    const itemRes = await client.query(itemQuery, [
                        receiptId,
                        productId,
                        item.itemName,
                        item.itemType,
                        item.quantity,
                        item.unitOfMeasure,
                        item.unitCost,
                        item.subtotal,
                        item.lotNumber || null,
                        item.expirationDate || null
                    ]);
                    savedItems.push({
                        id: itemRes.rows[0].id,
                        receiptId,
                        productId: productId || undefined,
                        itemName: item.itemName,
                        itemType: item.itemType,
                        quantity: item.quantity,
                        unitOfMeasure: item.unitOfMeasure,
                        unitCost: item.unitCost,
                        subtotal: item.subtotal,
                        lotNumber: item.lotNumber,
                        expirationDate: item.expirationDate,
                        createdAt: itemRes.rows[0].created_at.toISOString()
                    });
                }
                await client.query('COMMIT');
                return {
                    id: receiptId,
                    receiptNumber: dto.receiptNumber,
                    supplierId: supplier.id,
                    supplierName: supplier.businessName,
                    supplierTaxId: supplier.taxId,
                    receiptType: dto.receiptType || supplier_1.ReceiptType.FACTURA,
                    issueDate,
                    receptionDate,
                    dueDate,
                    paymentTermsDays: termsDays,
                    totalAmount,
                    paidAmount: 0,
                    pendingBalance: totalAmount,
                    paymentStatus: supplier_1.SupplierPaymentStatus.PENDING,
                    items: savedItems,
                    notes: dto.notes,
                    createdAt,
                    updatedAt: createdAt
                };
            }
            catch (innerError) {
                await client.query('ROLLBACK');
                throw innerError;
            }
            finally {
                client.release();
            }
        }
        catch {
            // Fallback a almacenamiento en memoria
            return this.createMerchandiseReceiptInMemory(dto, supplier, totalAmount, itemsProcessed, issueDate, receptionDate, dueDate, termsDays);
        }
    }
    /**
     * Registra el ingreso de facturas/comprobantes de recepción de insumos a granel (POST /api/v1/merchandise-receipts/raw)
     * incrementando el stock de materia prima (raw_materials) y registrando el costo por kg / unidad de medida.
     */
    async createRawMaterialReceipt(dto) {
        if (!dto.numeroComprobante || !dto.proveedorId || !dto.insumos || dto.insumos.length === 0) {
            throw new Error('Número de comprobante, proveedor e insumos a granel recibidos son obligatorios.');
        }
        const supplier = await this.getSupplierById(dto.proveedorId);
        const fechaEmision = dto.fechaEmision || new Date().toISOString().split('T')[0];
        const fechaRecepcion = dto.fechaRecepcion || new Date().toISOString().split('T')[0];
        const diasCreditoPago = dto.diasCreditoPago !== undefined ? dto.diasCreditoPago : 30;
        let fechaVencimientoPago = dto.fechaVencimientoPago;
        if (!fechaVencimientoPago) {
            const emisionDate = new Date(fechaEmision);
            emisionDate.setDate(emisionDate.getDate() + diasCreditoPago);
            fechaVencimientoPago = emisionDate.toISOString().split('T')[0];
        }
        let montoTotalComprobante = 0;
        const insumosProcesados = dto.insumos.map(item => {
            const subtotal = item.cantidadIngresada * item.costoPorKg;
            montoTotalComprobante += subtotal;
            return {
                ...item,
                subtotal
            };
        });
        let client;
        try {
            client = await this.db.connect();
            try {
                await client.query('BEGIN');
                // 1. Insertar Cabecera en merchandise_receipts
                const receiptQuery = `
          INSERT INTO merchandise_receipts (
            receipt_number, supplier_id, receipt_type, issue_date, reception_date,
            due_date, payment_terms_days, total_amount, paid_amount, payment_status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'PENDING', $9)
          RETURNING id, created_at, updated_at;
        `;
                const receiptRes = await client.query(receiptQuery, [
                    dto.numeroComprobante.trim(),
                    dto.proveedorId,
                    dto.tipoComprobante || supplier_1.ReceiptType.FACTURA,
                    fechaEmision,
                    fechaRecepcion,
                    fechaVencimientoPago,
                    diasCreditoPago,
                    montoTotalComprobante,
                    dto.notas ? dto.notas.trim() : null
                ]);
                const comprobanteId = receiptRes.rows[0].id;
                const creadoEn = receiptRes.rows[0].created_at.toISOString();
                // 2. Insertar Ítems e incrementar stock en raw_materials
                const savedItems = [];
                for (const item of insumosProcesados) {
                    let materiaPrimaId = item.materiaPrimaId || null;
                    let codigoMateriaPrima = item.codigoMateriaPrima || null;
                    let stockAnterior = 0;
                    let nuevoStockMateriaPrima = item.cantidadIngresada;
                    if (materiaPrimaId) {
                        const rmRes = await client.query('SELECT code, current_stock FROM raw_materials WHERE id = $1 FOR UPDATE', [materiaPrimaId]);
                        if (rmRes.rows.length > 0) {
                            codigoMateriaPrima = rmRes.rows[0].code;
                            stockAnterior = parseFloat(rmRes.rows[0].current_stock || '0');
                            nuevoStockMateriaPrima = stockAnterior + item.cantidadIngresada;
                            await client.query(`UPDATE raw_materials 
                 SET current_stock = $1, cost_per_unit = $2, supplier_id = $3, supplier_name = $4, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $5;`, [nuevoStockMateriaPrima, item.costoPorKg, dto.proveedorId, supplier.businessName, materiaPrimaId]);
                        }
                    }
                    else if (codigoMateriaPrima) {
                        const rmRes = await client.query('SELECT id, current_stock FROM raw_materials WHERE code = $1 FOR UPDATE', [codigoMateriaPrima]);
                        if (rmRes.rows.length > 0) {
                            materiaPrimaId = rmRes.rows[0].id;
                            stockAnterior = parseFloat(rmRes.rows[0].current_stock || '0');
                            nuevoStockMateriaPrima = stockAnterior + item.cantidadIngresada;
                            await client.query(`UPDATE raw_materials 
                 SET current_stock = $1, cost_per_unit = $2, supplier_id = $3, supplier_name = $4, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $5;`, [nuevoStockMateriaPrima, item.costoPorKg, dto.proveedorId, supplier.businessName, materiaPrimaId]);
                        }
                    }
                    if (!materiaPrimaId) {
                        codigoMateriaPrima = codigoMateriaPrima || ('MP-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100));
                        const newRmRes = await client.query(`INSERT INTO raw_materials (
                code, name, unit, current_stock, min_stock, cost_per_unit, supplier_id, supplier_name, storage_location
               ) VALUES ($1, $2, $3, $4, 5.0, $5, $6, $7, $8)
               RETURNING id;`, [
                            codigoMateriaPrima,
                            item.nombreInsumo,
                            item.unidadMedida || 'KG',
                            item.cantidadIngresada,
                            item.costoPorKg,
                            dto.proveedorId,
                            supplier.businessName,
                            item.ubicacionDeposito || null
                        ]);
                        materiaPrimaId = newRmRes.rows[0].id;
                        stockAnterior = 0;
                        nuevoStockMateriaPrima = item.cantidadIngresada;
                    }
                    // Insertar en merchandise_receipt_items
                    const itemQuery = `
            INSERT INTO merchandise_receipt_items (
              receipt_id, product_id, item_name, item_type, quantity, unit_of_measure,
              unit_cost, subtotal, lot_number, expiration_date
            ) VALUES ($1, $2, $3, 'GRANEL', $4, $5, $6, $7, $8, $9)
            RETURNING id, created_at;
          `;
                    const itemRes = await client.query(itemQuery, [
                        comprobanteId,
                        materiaPrimaId,
                        item.nombreInsumo,
                        item.cantidadIngresada,
                        item.unidadMedida || 'KG',
                        item.costoPorKg,
                        item.subtotal,
                        item.numeroLote || null,
                        item.fechaVencimiento || null
                    ]);
                    savedItems.push({
                        id: itemRes.rows[0].id,
                        comprobanteId,
                        materiaPrimaId: materiaPrimaId,
                        codigoMateriaPrima: codigoMateriaPrima,
                        nombreInsumo: item.nombreInsumo,
                        unidadMedida: item.unidadMedida || 'KG',
                        cantidadIngresada: item.cantidadIngresada,
                        costoPorKg: item.costoPorKg,
                        subtotal: item.subtotal,
                        stockAnterior,
                        nuevoStockMateriaPrima,
                        numeroLote: item.numeroLote,
                        fechaVencimiento: item.fechaVencimiento,
                        creadoEn: itemRes.rows[0].created_at.toISOString()
                    });
                }
                await client.query('COMMIT');
                const comprobante = {
                    id: comprobanteId,
                    numeroComprobante: dto.numeroComprobante,
                    proveedorId: supplier.id,
                    nombreProveedor: supplier.businessName,
                    cuitProveedor: supplier.taxId,
                    tipoComprobante: dto.tipoComprobante || supplier_1.ReceiptType.FACTURA,
                    fechaEmision,
                    fechaRecepcion,
                    fechaVencimientoPago,
                    diasCreditoPago,
                    montoTotalComprobante,
                    montoAbonado: 0,
                    saldoPendientePago: montoTotalComprobante,
                    estadoPago: supplier_1.SupplierPaymentStatus.PENDING,
                    items: savedItems,
                    notas: dto.notas,
                    creadoEn,
                    actualizadoEn: creadoEn
                };
                this.inMemoryRawReceipts.unshift(comprobante);
                return comprobante;
            }
            catch (innerErr) {
                await client.query('ROLLBACK');
                throw innerErr;
            }
            finally {
                client.release();
            }
        }
        catch {
            // Fallback en memoria
            return this.createRawMaterialReceiptInMemory(dto, supplier, montoTotalComprobante, insumosProcesados, fechaEmision, fechaRecepcion, fechaVencimientoPago, diasCreditoPago);
        }
    }
    /**
     * Alias en español para el ingreso de facturas/comprobantes de materias primas a granel.
     */
    async crearComprobanteInsumoGranel(dto) {
        return this.createRawMaterialReceipt(dto);
    }
    /**
     * Obtiene los detalles de una recepción de mercadería por ID.
     */
    async getMerchandiseReceiptById(receiptId) {
        try {
            const query = `
        SELECT r.*, s.business_name AS supplier_name, s.tax_id AS supplier_tax_id
        FROM merchandise_receipts r
        JOIN suppliers s ON r.supplier_id = s.id
        WHERE r.id = $1;
      `;
            const res = await this.db.query(query, [receiptId]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                const itemsRes = await this.db.query(`SELECT * FROM merchandise_receipt_items WHERE receipt_id = $1;`, [receiptId]);
                const items = itemsRes.rows.map(i => ({
                    id: i.id,
                    receiptId: i.receipt_id,
                    productId: i.product_id,
                    itemName: i.item_name,
                    itemType: i.item_type,
                    quantity: parseFloat(i.quantity),
                    unitOfMeasure: i.unit_of_measure,
                    unitCost: parseFloat(i.unit_cost),
                    subtotal: parseFloat(i.subtotal),
                    lotNumber: i.lot_number,
                    expirationDate: i.expiration_date ? i.expiration_date.toISOString().split('T')[0] : undefined,
                    createdAt: i.created_at.toISOString()
                }));
                const totalAmount = parseFloat(row.total_amount);
                const paidAmount = parseFloat(row.paid_amount);
                return {
                    id: row.id,
                    receiptNumber: row.receipt_number,
                    supplierId: row.supplier_id,
                    supplierName: row.supplier_name,
                    supplierTaxId: row.supplier_tax_id,
                    receiptType: row.receipt_type,
                    issueDate: row.issue_date.toISOString().split('T')[0],
                    receptionDate: row.reception_date.toISOString().split('T')[0],
                    dueDate: row.due_date.toISOString().split('T')[0],
                    paymentTermsDays: row.payment_terms_days,
                    totalAmount,
                    paidAmount,
                    pendingBalance: totalAmount - paidAmount,
                    paymentStatus: row.payment_status,
                    items,
                    notes: row.notes,
                    createdAt: row.created_at.toISOString(),
                    updatedAt: row.updated_at.toISOString()
                };
            }
        }
        catch {
            // Fallback
        }
        const found = this.inMemoryReceipts.find(r => r.id === receiptId);
        if (found)
            return found;
        throw new Error(`Recepción con ID ${receiptId} no encontrada.`);
    }
    /**
     * Busca recepciones de mercadería según filtros.
     */
    async searchMerchandiseReceipts(filters = {}) {
        try {
            let sql = `
        SELECT r.id
        FROM merchandise_receipts r
        JOIN suppliers s ON r.supplier_id = s.id
        WHERE 1=1
      `;
            const params = [];
            if (filters.supplierId) {
                params.push(filters.supplierId);
                sql += ` AND r.supplier_id = $${params.length}`;
            }
            if (filters.paymentStatus) {
                params.push(filters.paymentStatus);
                sql += ` AND r.payment_status = $${params.length}`;
            }
            if (filters.search) {
                params.push(`%${filters.search.trim()}%`);
                sql += ` AND (r.receipt_number ILIKE $${params.length} OR s.business_name ILIKE $${params.length})`;
            }
            sql += ` ORDER BY r.reception_date DESC`;
            const res = await this.db.query(sql, params);
            const receipts = await Promise.all(res.rows.map(row => this.getMerchandiseReceiptById(row.id)));
            return { receipts, total: receipts.length };
        }
        catch {
            // Fallback
        }
        let result = [...this.inMemoryReceipts];
        if (filters.supplierId) {
            result = result.filter(r => r.supplierId === filters.supplierId);
        }
        if (filters.paymentStatus) {
            result = result.filter(r => r.paymentStatus === filters.paymentStatus);
        }
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(r => r.receiptNumber.toLowerCase().includes(q) ||
                r.supplierName.toLowerCase().includes(q));
        }
        return { receipts: result, total: result.length };
    }
    // =========================================================================
    // 3. CUENTAS POR PAGAR Y REGISTRO DE PAGOS A PROVEEDORES
    // =========================================================================
    /**
     * Registra un pago/abono a una factura de proveedor pendiente o parcial.
     */
    async registerPayment(dto) {
        if (!dto.receiptId || !dto.amount || dto.amount <= 0) {
            throw new Error('ID de factura y monto positivo a abonar son obligatorios.');
        }
        const receipt = await this.getMerchandiseReceiptById(dto.receiptId);
        if (receipt.paymentStatus === supplier_1.SupplierPaymentStatus.PAID) {
            throw new Error(`La factura N° ${receipt.receiptNumber} ya se encuentra totalmente abonada.`);
        }
        if (dto.amount > receipt.pendingBalance + 0.01) {
            throw new Error(`El monto a abonar ($${dto.amount}) supera el saldo pendiente ($${receipt.pendingBalance}).`);
        }
        const paymentDate = dto.paymentDate || new Date().toISOString().split('T')[0];
        const newPaidAmount = receipt.paidAmount + dto.amount;
        const newPendingBalance = receipt.totalAmount - newPaidAmount;
        let newStatus = supplier_1.SupplierPaymentStatus.PARTIAL;
        if (newPendingBalance <= 0.01) {
            newStatus = supplier_1.SupplierPaymentStatus.PAID;
        }
        else if (new Date(receipt.dueDate) < new Date() && newPendingBalance > 0) {
            newStatus = supplier_1.SupplierPaymentStatus.OVERDUE;
        }
        let client;
        try {
            client = await this.db.connect();
            try {
                await client.query('BEGIN');
                // 1. Registrar el pago
                const paymentQuery = `
          INSERT INTO accounts_payable_payments (
            receipt_id, supplier_id, amount, payment_date, payment_method, reference_number, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, created_at;
        `;
                const paymentRes = await client.query(paymentQuery, [
                    dto.receiptId,
                    receipt.supplierId,
                    dto.amount,
                    paymentDate,
                    dto.paymentMethod || supplier_1.SupplierPaymentMethod.TRANSFERENCIA,
                    dto.referenceNumber ? dto.referenceNumber.trim() : null,
                    dto.notes ? dto.notes.trim() : null
                ]);
                const paymentId = paymentRes.rows[0].id;
                const createdAt = paymentRes.rows[0].created_at.toISOString();
                // 2. Actualizar estado y saldo en la factura
                await client.query(`UPDATE merchandise_receipts 
           SET paid_amount = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3;`, [newPaidAmount, newStatus, dto.receiptId]);
                await client.query('COMMIT');
                return {
                    id: paymentId,
                    receiptId: dto.receiptId,
                    supplierId: receipt.supplierId,
                    supplierName: receipt.supplierName,
                    amount: dto.amount,
                    paymentDate,
                    paymentMethod: dto.paymentMethod || supplier_1.SupplierPaymentMethod.TRANSFERENCIA,
                    referenceNumber: dto.referenceNumber,
                    notes: dto.notes,
                    createdAt
                };
            }
            catch (innerError) {
                await client.query('ROLLBACK');
                throw innerError;
            }
            finally {
                client.release();
            }
        }
        catch {
            // Fallback
            return this.registerPaymentInMemory(dto, receipt, newPaidAmount, newStatus, paymentDate);
        }
    }
    /**
     * Obtiene el historial de pagos emitidos para una factura específica.
     */
    async getPaymentsByReceipt(receiptId) {
        try {
            const query = `
        SELECT p.*, s.business_name AS supplier_name
        FROM accounts_payable_payments p
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.receipt_id = $1
        ORDER BY p.payment_date DESC;
      `;
            const res = await this.db.query(query, [receiptId]);
            if (res.rows.length > 0) {
                return res.rows.map(r => ({
                    id: r.id,
                    receiptId: r.receipt_id,
                    supplierId: r.supplier_id,
                    supplierName: r.supplier_name,
                    amount: parseFloat(r.amount),
                    paymentDate: r.payment_date.toISOString().split('T')[0],
                    paymentMethod: r.payment_method,
                    referenceNumber: r.reference_number,
                    notes: r.notes,
                    createdAt: r.created_at.toISOString()
                }));
            }
        }
        catch {
            // Fallback
        }
        return this.inMemoryPayments.filter(p => p.receiptId === receiptId);
    }
    // =========================================================================
    // 4. CALENDARIO DE VENCIMIENTOS DE CUENTAS POR PAGAR
    // =========================================================================
    /**
     * Obtiene el Calendario de Vencimientos de Cuentas por Pagar con cálculo de urgencia y resumen financiero.
     */
    async getAccountsPayableCalendar(filters = {}) {
        const { receipts } = await this.searchMerchandiseReceipts({
            supplierId: filters.supplierId,
            paymentStatus: filters.paymentStatus
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const calendar = [];
        let totalOverdueAmount = 0;
        let totalDueNext7DaysAmount = 0;
        let totalDueNext30DaysAmount = 0;
        let totalGlobalAccountsPayable = 0;
        let totalPendingReceiptsCount = 0;
        let totalOverdueReceiptsCount = 0;
        const supplierMap = {};
        for (const receipt of receipts) {
            if (receipt.pendingBalance <= 0.01)
                continue; // Ignorar totalmente abonadas
            const due = new Date(receipt.dueDate);
            due.setHours(0, 0, 0, 0);
            const diffTime = due.getTime() - today.getTime();
            const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Positivo = Días para vencer, Negativo = Vencido
            let urgency = 'REGULAR';
            let status = receipt.paymentStatus;
            if (daysDiff < 0) {
                urgency = 'VENCIDO';
                status = supplier_1.SupplierPaymentStatus.OVERDUE;
                totalOverdueAmount += receipt.pendingBalance;
                totalOverdueReceiptsCount++;
            }
            else if (daysDiff <= 3) {
                urgency = 'CRITICO';
            }
            else if (daysDiff <= 7) {
                urgency = 'PROXIMO';
            }
            if (daysDiff >= 0 && daysDiff <= 7) {
                totalDueNext7DaysAmount += receipt.pendingBalance;
            }
            if (daysDiff >= 0 && daysDiff <= 30) {
                totalDueNext30DaysAmount += receipt.pendingBalance;
            }
            totalGlobalAccountsPayable += receipt.pendingBalance;
            totalPendingReceiptsCount++;
            // Acumular por proveedor
            if (!supplierMap[receipt.supplierId]) {
                supplierMap[receipt.supplierId] = {
                    name: receipt.supplierName,
                    debt: 0,
                    count: 0
                };
            }
            supplierMap[receipt.supplierId].debt += receipt.pendingBalance;
            supplierMap[receipt.supplierId].count++;
            const item = {
                receiptId: receipt.id,
                receiptNumber: receipt.receiptNumber,
                supplierId: receipt.supplierId,
                supplierName: receipt.supplierName,
                supplierPhone: '+54 9 11 4000-0000',
                issueDate: receipt.issueDate,
                dueDate: receipt.dueDate,
                daysRemainingOrOverdue: daysDiff,
                totalAmount: receipt.totalAmount,
                paidAmount: receipt.paidAmount,
                pendingBalance: receipt.pendingBalance,
                paymentStatus: status,
                urgency
            };
            if (!filters.urgency || filters.urgency === urgency) {
                calendar.push(item);
            }
        }
        // Ordenar por fecha de vencimiento más antigua primero (lo más urgente arriba)
        calendar.sort((a, b) => a.daysRemainingOrOverdue - b.daysRemainingOrOverdue);
        const bySupplierSummary = Object.keys(supplierMap).map(supId => ({
            supplierId: supId,
            supplierName: supplierMap[supId].name,
            totalDebt: supplierMap[supId].debt,
            pendingReceiptsCount: supplierMap[supId].count
        }));
        return {
            calendar,
            summary: {
                totalOverdueAmount,
                totalDueNext7DaysAmount,
                totalDueNext30DaysAmount,
                totalGlobalAccountsPayable,
                totalPendingReceiptsCount,
                totalOverdueReceiptsCount,
                bySupplierSummary
            }
        };
    }
    // =========================================================================
    // MOCK DATA Y FALLBACKS EN MEMORIA PARA AMBIENTE SIN BASE DE DATOS ACTIVA
    // =========================================================================
    mapSupplierRow(row) {
        return {
            id: row.id,
            taxId: row.tax_id,
            businessName: row.business_name,
            contactName: row.contact_name,
            phone: row.phone,
            email: row.email,
            address: row.address,
            categories: row.categories || [],
            commercialTerms: row.commercial_terms,
            deliveryDays: row.delivery_days,
            bankDetails: row.bank_details,
            notes: row.notes,
            isActive: row.is_active,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString()
        };
    }
    createSupplierInMemory(dto) {
        const cleanTaxId = dto.taxId.trim().replace(/-/g, '');
        const newId = 'sup-' + Date.now();
        const newSupplier = {
            id: newId,
            taxId: cleanTaxId,
            businessName: dto.businessName.trim(),
            contactName: dto.contactName ? dto.contactName.trim() : undefined,
            phone: dto.phone.trim(),
            email: dto.email ? dto.email.trim().toLowerCase() : undefined,
            address: dto.address ? dto.address.trim() : undefined,
            categories: dto.categories || ['Granel', 'Elaborados'],
            commercialTerms: dto.commercialTerms || '30 días neto',
            deliveryDays: dto.deliveryDays || 'Lunes y Jueves',
            bankDetails: dto.bankDetails || undefined,
            notes: dto.notes || undefined,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.inMemorySuppliers.unshift(newSupplier);
        return newSupplier;
    }
    createMerchandiseReceiptInMemory(dto, supplier, totalAmount, itemsProcessed, issueDate, receptionDate, dueDate, termsDays) {
        const receiptId = 'rec-' + Date.now();
        const items = itemsProcessed.map((item, idx) => ({
            id: `item-${receiptId}-${idx + 1}`,
            receiptId,
            productId: item.productId || `prod-auto-${idx}`,
            itemName: item.itemName,
            itemType: item.itemType,
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            unitCost: item.unitCost,
            subtotal: item.subtotal,
            lotNumber: item.lotNumber || `LOTE-${new Date().getFullYear()}-00${idx + 1}`,
            expirationDate: item.expirationDate || '2027-06-30',
            createdAt: new Date().toISOString()
        }));
        const receipt = {
            id: receiptId,
            receiptNumber: dto.receiptNumber,
            supplierId: supplier.id,
            supplierName: supplier.businessName,
            supplierTaxId: supplier.taxId,
            receiptType: dto.receiptType || supplier_1.ReceiptType.FACTURA,
            issueDate,
            receptionDate,
            dueDate,
            paymentTermsDays: termsDays,
            totalAmount,
            paidAmount: 0,
            pendingBalance: totalAmount,
            paymentStatus: supplier_1.SupplierPaymentStatus.PENDING,
            items,
            notes: dto.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.inMemoryReceipts.unshift(receipt);
        return receipt;
    }
    createRawMaterialReceiptInMemory(dto, supplier, montoTotalComprobante, insumosProcesados, fechaEmision, fechaRecepcion, fechaVencimientoPago, diasCreditoPago) {
        const comprobanteId = 'rec-raw-' + Date.now();
        const items = insumosProcesados.map((item, idx) => {
            const materiaPrimaId = item.materiaPrimaId || `rm-auto-${idx + 1}`;
            const codigoMateriaPrima = item.codigoMateriaPrima || `MP-${100 + idx}`;
            const stockAnterior = 10.0;
            const nuevoStockMateriaPrima = stockAnterior + item.cantidadIngresada;
            return {
                id: `item-raw-${comprobanteId}-${idx + 1}`,
                comprobanteId,
                materiaPrimaId,
                codigoMateriaPrima,
                nombreInsumo: item.nombreInsumo,
                unidadMedida: item.unidadMedida || 'KG',
                cantidadIngresada: item.cantidadIngresada,
                costoPorKg: item.costoPorKg,
                subtotal: item.subtotal,
                stockAnterior,
                nuevoStockMateriaPrima,
                numeroLote: item.numeroLote || `LOTE-${new Date().getFullYear()}-00${idx + 1}`,
                fechaVencimiento: item.fechaVencimiento || '2027-12-31',
                creadoEn: new Date().toISOString()
            };
        });
        const comprobante = {
            id: comprobanteId,
            numeroComprobante: dto.numeroComprobante,
            proveedorId: supplier.id,
            nombreProveedor: supplier.businessName,
            cuitProveedor: supplier.taxId,
            tipoComprobante: dto.tipoComprobante || supplier_1.ReceiptType.FACTURA,
            fechaEmision,
            fechaRecepcion,
            fechaVencimientoPago,
            diasCreditoPago,
            montoTotalComprobante,
            montoAbonado: 0,
            saldoPendientePago: montoTotalComprobante,
            estadoPago: supplier_1.SupplierPaymentStatus.PENDING,
            items,
            notas: dto.notas,
            creadoEn: new Date().toISOString(),
            actualizadoEn: new Date().toISOString()
        };
        this.inMemoryRawReceipts.unshift(comprobante);
        return comprobante;
    }
    registerPaymentInMemory(dto, receipt, newPaidAmount, newStatus, paymentDate) {
        const paymentId = 'pay-' + Date.now();
        const payment = {
            id: paymentId,
            receiptId: dto.receiptId,
            supplierId: receipt.supplierId,
            supplierName: receipt.supplierName,
            amount: dto.amount,
            paymentDate,
            paymentMethod: dto.paymentMethod || supplier_1.SupplierPaymentMethod.TRANSFERENCIA,
            referenceNumber: dto.referenceNumber || `TRX-${Date.now()}`,
            notes: dto.notes,
            createdAt: new Date().toISOString()
        };
        receipt.paidAmount = newPaidAmount;
        receipt.pendingBalance = receipt.totalAmount - newPaidAmount;
        receipt.paymentStatus = newStatus;
        receipt.updatedAt = new Date().toISOString();
        this.inMemoryPayments.unshift(payment);
        return payment;
    }
    initMockData() {
        this.inMemorySuppliers = [
            {
                id: 'sup-1',
                taxId: '30-71122334-9',
                businessName: 'Granos & Semillas del Campo S.A.',
                contactName: 'Carlos M. Rodríguez',
                phone: '+54 9 11 4433-2211',
                email: 'ventas@granosdelcampo.com.ar',
                address: 'Av. Industrial 4550, San Martín, Bs.As.',
                categories: ['Frutos Secos', 'Semillas', 'Legumbres a Granel'],
                commercialTerms: '30 días fecha factura',
                deliveryDays: 'Lunes y Miércoles',
                bankDetails: 'Banco Galicia CBU: 0070012300000044556677 Alias: GRANOS.CAMPO.GALICIA',
                notes: 'Proveedor principal de almendras, avena y chía.',
                isActive: true,
                createdAt: '2026-01-10T10:00:00.000Z',
                updatedAt: '2026-01-10T10:00:00.000Z'
            },
            {
                id: 'sup-2',
                taxId: '30-68991122-3',
                businessName: 'Molinos Agroecológicos del Sur',
                contactName: 'Mariana López',
                phone: '+54 9 11 5566-7788',
                email: 'contacto@molinosdelsur.com',
                address: 'Ruta 3 Km 45, Cañuelas, Bs.As.',
                categories: ['Harinas Orgánicas', 'Premezclas Sin TACC'],
                commercialTerms: '15 días neto',
                deliveryDays: 'Viernes',
                bankDetails: 'Banco Nación CBU: 0110098700000011223344 Alias: MOLINOS.SUR.NACION',
                notes: 'Entrega certificaciones orgánicas en cada remito.',
                isActive: true,
                createdAt: '2026-02-01T11:00:00.000Z',
                updatedAt: '2026-02-01T11:00:00.000Z'
            },
            {
                id: 'sup-3',
                taxId: '30-75443322-1',
                businessName: 'NutriVida Alimentos Elaborados S.R.L.',
                contactName: 'Esteban Paz',
                phone: '+54 9 11 8899-0011',
                email: 'pedidos@nutrivida.com.ar',
                address: 'Calle 12 N° 840, Avellaneda, Bs.As.',
                categories: ['Productos Elaborados', 'Snacks Sin TACC', 'Bebidas Vegetales'],
                commercialTerms: 'Contado contra entrega / 7 días',
                deliveryDays: 'Martes y Jueves',
                bankDetails: 'Banco BBVA CBU: 0170055400000088991122 Alias: NUTRIVIDA.BBVA',
                notes: 'Excelente rotación de leches de almendra y alfajores celíacos.',
                isActive: true,
                createdAt: '2026-03-15T09:30:00.000Z',
                updatedAt: '2026-03-15T09:30:00.000Z'
            }
        ];
        this.inMemoryReceipts = [
            {
                id: 'rec-101',
                receiptNumber: 'FC-A-0001-00045892',
                supplierId: 'sup-1',
                supplierName: 'Granos & Semillas del Campo S.A.',
                supplierTaxId: '30-71122334-9',
                receiptType: supplier_1.ReceiptType.FACTURA,
                issueDate: '2026-06-25',
                receptionDate: '2026-06-26',
                dueDate: '2026-07-25',
                paymentTermsDays: 30,
                totalAmount: 485000,
                paidAmount: 200000,
                pendingBalance: 285000,
                paymentStatus: supplier_1.SupplierPaymentStatus.PARTIAL,
                items: [
                    {
                        id: 'item-101-1',
                        receiptId: 'rec-101',
                        productId: 'prod-granel-1',
                        itemName: 'Almendras Non Pareil A Granel',
                        itemType: supplier_1.MerchandiseType.GRANEL,
                        quantity: 50,
                        unitOfMeasure: 'kg',
                        unitCost: 7500,
                        subtotal: 375000,
                        lotNumber: 'LOT-ALM-2026-06',
                        expirationDate: '2027-06-30',
                        createdAt: '2026-06-26T10:00:00.000Z'
                    },
                    {
                        id: 'item-101-2',
                        receiptId: 'rec-101',
                        productId: 'prod-granel-2',
                        itemName: 'Semillas de Chía Orgánicas A Granel',
                        itemType: supplier_1.MerchandiseType.GRANEL,
                        quantity: 25,
                        unitOfMeasure: 'kg',
                        unitCost: 4400,
                        subtotal: 110000,
                        lotNumber: 'LOT-CHI-2026-06',
                        expirationDate: '2027-12-31',
                        createdAt: '2026-06-26T10:00:00.000Z'
                    }
                ],
                notes: 'Ingreso directo a depósito de materias primas a granel.',
                createdAt: '2026-06-26T10:00:00.000Z',
                updatedAt: '2026-07-05T14:20:00.000Z'
            },
            {
                id: 'rec-102',
                receiptNumber: 'FC-A-0002-00012480',
                supplierId: 'sup-2',
                supplierName: 'Molinos Agroecológicos del Sur',
                supplierTaxId: '30-68991122-3',
                receiptType: supplier_1.ReceiptType.FACTURA,
                issueDate: '2026-06-10',
                receptionDate: '2026-06-11',
                dueDate: '2026-07-11',
                paymentTermsDays: 30,
                totalAmount: 320000,
                paidAmount: 0,
                pendingBalance: 320000,
                paymentStatus: supplier_1.SupplierPaymentStatus.OVERDUE,
                items: [
                    {
                        id: 'item-102-1',
                        receiptId: 'rec-102',
                        productId: 'prod-granel-3',
                        itemName: 'Harina de Almendras Pura A Granel',
                        itemType: supplier_1.MerchandiseType.GRANEL,
                        quantity: 40,
                        unitOfMeasure: 'kg',
                        unitCost: 8000,
                        subtotal: 320000,
                        lotNumber: 'LOT-HAR-2026-05',
                        expirationDate: '2027-01-15',
                        createdAt: '2026-06-11T11:00:00.000Z'
                    }
                ],
                notes: 'Recepción demorada de lote por análisis de humedad.',
                createdAt: '2026-06-11T11:00:00.000Z',
                updatedAt: '2026-06-11T11:00:00.000Z'
            },
            {
                id: 'rec-103',
                receiptNumber: 'FC-B-0005-00008912',
                supplierId: 'sup-3',
                supplierName: 'NutriVida Alimentos Elaborados S.R.L.',
                supplierTaxId: '30-75443322-1',
                receiptType: supplier_1.ReceiptType.FACTURA,
                issueDate: '2026-07-18',
                receptionDate: '2026-07-19',
                dueDate: '2026-08-18',
                paymentTermsDays: 30,
                totalAmount: 215000,
                paidAmount: 0,
                pendingBalance: 215000,
                paymentStatus: supplier_1.SupplierPaymentStatus.PENDING,
                items: [
                    {
                        id: 'item-103-1',
                        receiptId: 'rec-103',
                        productId: 'prod-elab-1',
                        itemName: 'Leche de Almendras Natural (1L) Pack x12',
                        itemType: supplier_1.MerchandiseType.ELABORADO,
                        quantity: 60,
                        unitOfMeasure: 'unidades',
                        unitCost: 2200,
                        subtotal: 132000,
                        lotNumber: 'LOT-LEC-2026-07',
                        expirationDate: '2026-11-20',
                        createdAt: '2026-07-19T09:00:00.000Z'
                    },
                    {
                        id: 'item-103-2',
                        receiptId: 'rec-103',
                        productId: 'prod-elab-2',
                        itemName: 'Alfajor Sin TACC Dulce de Leche x60g',
                        itemType: supplier_1.MerchandiseType.ELABORADO,
                        quantity: 100,
                        unitOfMeasure: 'unidades',
                        unitCost: 830,
                        subtotal: 83000,
                        lotNumber: 'LOT-ALF-2026-07',
                        expirationDate: '2026-10-30',
                        createdAt: '2026-07-19T09:00:00.000Z'
                    }
                ],
                notes: 'Productos elaborados listos para exhibición directa en gondola.',
                createdAt: '2026-07-19T09:00:00.000Z',
                updatedAt: '2026-07-19T09:00:00.000Z'
            }
        ];
        this.inMemoryPayments = [
            {
                id: 'pay-1',
                receiptId: 'rec-101',
                supplierId: 'sup-1',
                supplierName: 'Granos & Semillas del Campo S.A.',
                amount: 200000,
                paymentDate: '2026-07-05',
                paymentMethod: supplier_1.SupplierPaymentMethod.TRANSFERENCIA,
                referenceNumber: 'TRX-GALICIA-889922',
                notes: 'Pago a cuenta de la factura FC-A-0001-00045892.',
                createdAt: '2026-07-05T14:20:00.000Z'
            }
        ];
    }
}
exports.SupplierService = SupplierService;
