"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleService = exports.PersistenceError = void 0;
const customer_1 = require("../types/customer");
const mysqlAdapter_1 = require("../database/mysqlAdapter");
const uuid_1 = require("uuid");
/**
 * Error de persistencia: la operación NO se guardó en la base de datos.
 * El controlador lo traduce a HTTP 503/500 para que el frontend nunca muestre un falso "guardado".
 */
class PersistenceError extends Error {
    httpStatus;
    constructor(message, httpStatus = 500) {
        super(message);
        this.httpStatus = httpStatus;
        this.name = 'PersistenceError';
    }
}
exports.PersistenceError = PersistenceError;
/** En producción NUNCA se usa memoria como sustituto de MySQL (los datos se perderían al reiniciar). */
const ALLOW_MEMORY_FALLBACK = process.env.ALLOW_MEMORY_FALLBACK === 'true' ||
    (process.env.ALLOW_MEMORY_FALLBACK !== 'false' && process.env.NODE_ENV !== 'production');
const VALID_CHANNELS = ['LOCAL', 'WHATSAPP', 'ONLINE_STORE', 'INSTAGRAM'];
const initialMockOrders = ALLOW_MEMORY_FALLBACK ? [
    {
        id: 'ord-101',
        orderNumber: 'PED-20260720-0001',
        customerId: 'c1000000-0000-0000-0000-000000000001',
        customerName: 'Martina Gómez',
        channel: customer_1.AcquisitionChannel.WHATSAPP,
        status: 'RECEIVED',
        paymentStatus: 'PAID',
        subtotal: 17500,
        discountAmount: 0,
        deliveryFee: 0,
        totalAmount: 17500,
        paidAmount: 17500,
        balanceDue: 0,
        pointsEarned: 175,
        items: [
            { id: 'oi-1', productName: 'Almendras Nonpareil 1kg', productId: 'fp-001', isBulkFractioned: false, quantity: 1, unitPrice: 8500, subtotal: 8500 },
            { id: 'oi-2', productName: 'Mix Frutos Secos 1kg', productId: 'fp-003', isBulkFractioned: false, quantity: 1, unitPrice: 9000, subtotal: 9000 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
] : [];
class SaleService {
    db;
    paymentService;
    customerService;
    checkingAccountService;
    inMemoryOrders = [...initialMockOrders];
    constructor(db, paymentService, customerService, checkingAccountService) {
        this.db = db;
        this.paymentService = paymentService;
        this.customerService = customerService;
        this.checkingAccountService = checkingAccountService;
    }
    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    /** Decide qué hacer ante un error de BD: fallback sólo si es caída de conexión y está permitido. */
    handleDbError(error, action) {
        if ((0, mysqlAdapter_1.isConnectionError)(error)) {
            if (ALLOW_MEMORY_FALLBACK) {
                console.warn(`⚠️ [${action}] MySQL no disponible, usando memoria temporal (modo desarrollo).`);
                return; // el llamador continúa con fallback
            }
            throw new PersistenceError(`Base de datos no disponible. La operación "${action}" NO se guardó. Detalle: ${error.code || error.message}`, 503);
        }
        throw new PersistenceError(`No se pudo ${action} en la base de datos: ${error.sqlMessage || error.message}`, 500);
    }
    mapOrderRow(row, items = []) {
        const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
        return {
            id: row.id,
            orderNumber: row.order_number,
            customerId: row.customer_id,
            customerName: fullName || 'Consumidor Final',
            sellerId: row.seller_id || undefined,
            sellerName: row.seller_name || undefined,
            quoteId: row.quote_id || undefined,
            channel: row.channel,
            status: row.status,
            paymentStatus: row.payment_status,
            subtotal: parseFloat(row.subtotal || 0),
            discountAmount: parseFloat(row.discount_amount || 0),
            deliveryFee: parseFloat(row.delivery_fee || 0),
            totalAmount: parseFloat(row.total_amount || 0),
            paidAmount: parseFloat(row.paid_amount || 0),
            balanceDue: parseFloat(row.balance_due || 0),
            pointsEarned: Number(row.points_earned || 0),
            commissionAmount: parseFloat(row.commission_amount || 0),
            commissionSettled: Boolean(row.commission_settled),
            commissionSettlementId: row.commission_settlement_id || undefined,
            deliveryAddress: row.delivery_address || undefined,
            notes: row.notes || undefined,
            items,
            createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
            updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : (row.updated_at || row.created_at)
        };
    }
    mapItemRow(iRow) {
        return {
            id: iRow.id,
            orderId: iRow.order_id,
            productName: iRow.product_name,
            productId: iRow.product_id || undefined,
            isBulkFractioned: Boolean(iRow.is_bulk_fractioned),
            quantity: parseFloat(iRow.quantity),
            unitPrice: parseFloat(iRow.unit_price),
            subtotal: parseFloat(iRow.subtotal)
        };
    }
    generateOrderNumber() {
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `PED-${todayStr}-${rand}`; // 17 caracteres (columna VARCHAR(20))
    }
    // ------------------------------------------------------------------
    // Crear venta
    // ------------------------------------------------------------------
    async createOrder(dto) {
        const items = (dto.items || [])
            .map((i) => ({
            productName: String(i.productName || i.name || 'Producto').slice(0, 255),
            productId: i.productId || null,
            isBulkFractioned: Boolean(i.isBulkFractioned),
            quantity: Number(i.quantity) || 0,
            unitPrice: Number(i.unitPrice ?? i.price) || 0,
            notes: i.notes || null
        }))
            .filter(i => i.quantity > 0);
        if (items.length === 0) {
            throw new PersistenceError('La venta debe contener al menos un producto con cantidad mayor a 0.', 400);
        }
        const rawChannel = String(dto.channel || 'LOCAL').toUpperCase();
        const channel = (VALID_CHANNELS.includes(rawChannel) ? rawChannel : 'LOCAL');
        const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
        const discountAmount = Number(dto.discountAmount) || 0;
        const deliveryFee = Number(dto.deliveryFee) || 0;
        const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);
        const pointsEarned = Math.floor(totalAmount / 100);
        const isCredit = /cuenta\s*corriente|fiado|credit/i.test(dto.paymentMethod || '');
        const paymentStatus = isCredit ? 'UNPAID' : 'PAID';
        const paidAmount = isCredit ? 0 : totalAmount;
        const balanceDue = totalAmount - paidAmount;
        const customerName = (dto.customerName || 'Consumidor Final').trim();
        const orderNumber = this.generateOrderNumber();
        let client = null;
        try {
            client = await this.db.connect();
            await client.query('BEGIN');
            // 1. Garantizar que el cliente exista (FK orders.customer_id → customers.id)
            const custRes = await client.query('SELECT id FROM customers WHERE id = $1', [dto.customerId]);
            if (custRes.rows.length === 0) {
                const [first, ...rest] = customerName.split(' ');
                await client.query(`INSERT IGNORE INTO customers (id, first_name, last_name, phone_whatsapp, preferred_channel, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`, [
                    dto.customerId,
                    (first || 'Consumidor').slice(0, 100),
                    (rest.join(' ') || 'Final').slice(0, 100),
                    `SIN-${String(dto.customerId).slice(0, 24)}`,
                    channel,
                    'Creado automáticamente al registrar una venta (cliente no existía en la base de datos).'
                ]);
            }
            // 2. Comisión del vendedor
            let commissionPct = 3.0;
            if (dto.sellerId) {
                const commRes = await client.query('SELECT commission_percentage FROM seller_channel_commissions WHERE user_id = $1 AND channel = $2', [dto.sellerId, channel]);
                if (commRes.rows.length > 0) {
                    commissionPct = parseFloat(commRes.rows[0].commission_percentage) || 0;
                }
            }
            const commissionAmount = Math.round(totalAmount * commissionPct) / 100;
            // 3. Cabecera del pedido
            const orderRes = await client.query(`INSERT INTO orders (
          order_number, customer_id, seller_id, seller_name, quote_id, channel, status, payment_status,
          subtotal, discount_amount, delivery_fee, total_amount, paid_amount, balance_due,
          points_earned, commission_amount, commission_settled, delivery_address, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, 'RECEIVED', $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, $16, $17)
        RETURNING id`, [
                orderNumber,
                dto.customerId,
                dto.sellerId || null,
                dto.sellerName || null,
                dto.quoteId || null,
                channel,
                paymentStatus,
                subtotal,
                discountAmount,
                deliveryFee,
                totalAmount,
                paidAmount,
                balanceDue,
                pointsEarned,
                commissionAmount,
                dto.deliveryAddress || null,
                [dto.paymentMethod ? `Pago: ${dto.paymentMethod}` : null, dto.notes || null].filter(Boolean).join(' | ') || null
            ]);
            const orderId = orderRes.rows[0]?.id;
            if (!orderId) {
                throw new Error('MySQL no devolvió el ID del pedido insertado.');
            }
            // 4. Ítems y Descuento de Stock
            for (const item of items) {
                await client.query(`INSERT INTO order_items (order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [orderId, item.productName, item.productId, item.isBulkFractioned, item.quantity, item.unitPrice, item.quantity * item.unitPrice, item.notes]);
                // Descontar inventario del producto si está asociado
                if (item.productId) {
                    try {
                        const stockCheck = await client.query('SELECT current_stock FROM final_products WHERE id = $1', [item.productId]);
                        const prevStock = stockCheck.rows.length > 0 ? parseFloat(stockCheck.rows[0].current_stock || '0') : 0;
                        const resStock = Math.max(0, prevStock - item.quantity);
                        await client.query(`UPDATE final_products 
               SET current_stock = GREATEST(0, current_stock - $1), updated_at = CURRENT_TIMESTAMP 
               WHERE id = $2`, [item.quantity, item.productId]);
                        try {
                            await client.query(`UPDATE products 
                 SET current_stock = GREATEST(0, current_stock - $1), updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $2`, [item.quantity, item.productId]);
                        }
                        catch { }
                        // Registrar movimiento de salida en el Kardex
                        await client.query(`
              INSERT INTO stock_movements (
                id, item_type, item_id, item_name, movement_type, quantity,
                previous_stock, resulting_stock, unit_of_measure, unit_cost,
                reference_type, reference_id, reference_number, reason, user_name, notes, created_at
              ) VALUES ($1, 'FINAL_PRODUCT', $2, $3, 'SALE', $4, $5, $6, 'UN', $7, 'ORDER', $8, $9, 'Venta realizada', $10, $11, CURRENT_TIMESTAMP)
            `, [
                            (0, uuid_1.v4)(),
                            item.productId,
                            item.productName,
                            -item.quantity,
                            prevStock,
                            resStock,
                            item.unitPrice,
                            orderId,
                            orderNumber,
                            dto.sellerName || 'Vendedor',
                            `Pedido N° ${orderNumber}`
                        ]);
                    }
                    catch (stockErr) {
                        console.warn(`⚠️ No se pudo actualizar stock para producto ${item.productId}:`, stockErr.message);
                    }
                }
            }
            // 5. Imputar en Cuenta Corriente si la venta es a crédito / cuenta corriente / fiado
            if (isCredit && this.checkingAccountService) {
                const desc = `Compra a Cta Cte Pedido ${orderNumber}`;
                await this.checkingAccountService.addMovement(dto.customerId, 'DEBIT', totalAmount, 'ORDER', desc, orderId, client);
            }
            await client.query('COMMIT');
            console.log(`💾 Venta ${orderNumber} guardada en MySQL (id=${orderId}, total=${totalAmount}).`);
            return await this.getOrderById(orderId);
        }
        catch (error) {
            if (client) {
                try {
                    await client.query('ROLLBACK');
                }
                catch { }
            }
            if (error instanceof PersistenceError)
                throw error;
            console.error('❌ Error al guardar venta:', error.code, error.sqlMessage || error.message);
            this.handleDbError(error, 'registrar la venta'); // lanza si no corresponde fallback
            // Fallback (sólo desarrollo sin MySQL)
            const memOrder = {
                id: 'ord-' + Date.now(),
                orderNumber,
                customerId: dto.customerId,
                customerName,
                sellerId: dto.sellerId,
                sellerName: dto.sellerName,
                channel,
                status: 'RECEIVED',
                paymentStatus,
                subtotal,
                discountAmount,
                deliveryFee,
                totalAmount,
                paidAmount,
                balanceDue,
                pointsEarned,
                commissionAmount: Math.round(totalAmount * 3) / 100,
                commissionSettled: false,
                items: items.map((i, idx) => ({
                    id: `oi-${Date.now()}-${idx}`,
                    productName: i.productName,
                    productId: i.productId || undefined,
                    isBulkFractioned: i.isBulkFractioned,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    subtotal: i.quantity * i.unitPrice
                })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.inMemoryOrders.unshift(memOrder);
            return memOrder;
        }
        finally {
            if (client) {
                try {
                    client.release();
                }
                catch { }
            }
        }
    }
    // ------------------------------------------------------------------
    // Consultas
    // ------------------------------------------------------------------
    async getOrderById(id) {
        try {
            const res = await this.db.query(`SELECT o.*, c.first_name, c.last_name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         WHERE o.id = $1`, [id]);
            if (res.rows.length > 0) {
                const itemsRes = await this.db.query(`SELECT id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal
           FROM order_items WHERE order_id = $1`, [id]);
                return this.mapOrderRow(res.rows[0], itemsRes.rows.map((r) => this.mapItemRow(r)));
            }
        }
        catch (error) {
            this.handleDbError(error, 'consultar el pedido');
        }
        const found = this.inMemoryOrders.find(o => o.id === id);
        if (found)
            return found;
        throw new PersistenceError(`Pedido con ID ${id} no encontrado.`, 404);
    }
    async getOrders(filter = {}) {
        try {
            const where = [];
            const values = [];
            let idx = 1;
            if (filter.customerId) {
                where.push(`o.customer_id = $${idx++}`);
                values.push(filter.customerId);
            }
            if (filter.status) {
                where.push(`o.status = $${idx++}`);
                values.push(filter.status);
            }
            if (filter.paymentStatus) {
                where.push(`o.payment_status = $${idx++}`);
                values.push(filter.paymentStatus);
            }
            if (filter.startDate) {
                where.push(`o.created_at >= $${idx++}`);
                values.push(filter.startDate);
            }
            if (filter.endDate) {
                where.push(`o.created_at <= $${idx++}`);
                values.push(`${filter.endDate} 23:59:59`);
            }
            if (filter.search) {
                where.push(`(o.order_number LIKE $${idx} OR c.first_name LIKE $${idx} OR c.last_name LIKE $${idx})`);
                values.push(`%${filter.search}%`);
                idx++;
            }
            const limit = Math.min(Math.max(filter.limit || 500, 1), 2000);
            const offset = Math.max(filter.offset || 0, 0);
            const ordersRes = await this.db.query(`SELECT o.*, c.first_name, c.last_name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
         ORDER BY o.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`, values);
            // Cargar ítems de todos los pedidos en una sola consulta
            const ids = ordersRes.rows.map((r) => r.id);
            const itemsByOrder = {};
            if (ids.length > 0) {
                const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
                const itemsRes = await this.db.query(`SELECT id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal
           FROM order_items WHERE order_id IN (${placeholders})`, ids);
                for (const r of itemsRes.rows) {
                    (itemsByOrder[r.order_id] ||= []).push(this.mapItemRow(r));
                }
            }
            const orders = ordersRes.rows.map((row) => this.mapOrderRow(row, itemsByOrder[row.id] || []));
            return { orders, total: orders.length };
        }
        catch (error) {
            this.handleDbError(error, 'consultar las ventas');
        }
        return { orders: this.inMemoryOrders, total: this.inMemoryOrders.length };
    }
    // ------------------------------------------------------------------
    // Cambio de estado (Kanban)
    // ------------------------------------------------------------------
    async updateOrderStatus(id, dto) {
        if (!dto.status && !dto.paymentStatus) {
            throw new PersistenceError('Debe indicar status o paymentStatus.', 400);
        }
        try {
            const order = await this.getOrderById(id);
            const isCancelling = dto.status === 'CANCELLED' && order.status !== 'CANCELLED';
            if (isCancelling && order.items && order.items.length > 0) {
                for (const item of order.items) {
                    if (item.productId) {
                        try {
                            await this.db.query(`UPDATE final_products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [item.quantity, item.productId]);
                            try {
                                await this.db.query(`UPDATE products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [item.quantity, item.productId]);
                            }
                            catch { }
                            await this.db.query(`
                INSERT INTO stock_movements (
                  id, item_type, item_id, item_name, movement_type, quantity,
                  previous_stock, resulting_stock, unit_of_measure, unit_cost,
                  reference_type, reference_id, reference_number, reason, user_name, notes, created_at
                ) VALUES ($1, 'FINAL_PRODUCT', $2, $3, 'SALE_CANCEL', $4, 0, 0, 'UN', $5, 'ORDER', $6, $7, 'Cancelación de venta y reincorporación de stock', 'Sistema', $8, CURRENT_TIMESTAMP)
              `, [
                                (0, uuid_1.v4)(),
                                item.productId,
                                item.productName,
                                item.quantity,
                                item.unitPrice,
                                order.id,
                                order.orderNumber,
                                `Cancelación de pedido N° ${order.orderNumber}`
                            ]);
                        }
                        catch (err) {
                            console.warn(`⚠️ Error al revertir stock por cancelación de pedido ${order.orderNumber}:`, err.message);
                        }
                    }
                }
            }
            const sets = [];
            const values = [];
            let idx = 1;
            if (dto.status) {
                sets.push(`status = $${idx++}`);
                values.push(dto.status);
            }
            if (dto.paymentStatus) {
                sets.push(`payment_status = $${idx++}`);
                values.push(dto.paymentStatus);
            }
            sets.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            const updateRes = await this.db.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${idx}`, values);
            if (updateRes.rowCount > 0) {
                return await this.getOrderById(id);
            }
        }
        catch (error) {
            this.handleDbError(error, 'actualizar el estado del pedido');
        }
        const order = this.inMemoryOrders.find(o => o.id === id);
        if (order) {
            if (dto.status)
                order.status = dto.status;
            if (dto.paymentStatus)
                order.paymentStatus = dto.paymentStatus;
            order.updatedAt = new Date().toISOString();
            return order;
        }
        throw new PersistenceError(`Pedido con ID ${id} no encontrado.`, 404);
    }
}
exports.SaleService = SaleService;
