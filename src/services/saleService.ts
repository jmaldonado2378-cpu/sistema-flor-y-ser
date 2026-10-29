import {
  Order,
  OrderItem,
  CreateOrderDTO,
  OrderFilterDTO,
  UpdateOrderStatusDTO,
  OrderStatus,
  PaymentStatus
} from '../types/sales';
import { AcquisitionChannel } from '../types/customer';
import { PaymentService } from './paymentService';
import { CustomerService } from './customerService';
import { CheckingAccountService } from './checkingAccountService';
import { isConnectionError } from '../database/mysqlAdapter';
import { v4 as uuidv4 } from 'uuid';

/**
 * Error de persistencia: la operación NO se guardó en la base de datos.
 * El controlador lo traduce a HTTP 503/500 para que el frontend nunca muestre un falso "guardado".
 */
export class PersistenceError extends Error {
  constructor(message: string, public httpStatus: number = 500) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/** En producción NUNCA se usa memoria como sustituto de MySQL (los datos se perderían al reiniciar). */
const ALLOW_MEMORY_FALLBACK =
  process.env.ALLOW_MEMORY_FALLBACK === 'true' ||
  (process.env.ALLOW_MEMORY_FALLBACK !== 'false' && process.env.NODE_ENV !== 'production');

const VALID_CHANNELS = ['LOCAL', 'WHATSAPP', 'ONLINE_STORE', 'INSTAGRAM'];

const initialMockOrders: Order[] = ALLOW_MEMORY_FALLBACK ? [
  {
    id: 'ord-101',
    orderNumber: 'PED-20260720-0001',
    customerId: 'c1000000-0000-0000-0000-000000000001',
    customerName: 'Martina Gómez',
    channel: AcquisitionChannel.WHATSAPP,
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

export class SaleService {
  private inMemoryOrders: Order[] = [...initialMockOrders];
  private schemaEnsured = false;

  constructor(
    private db: any,
    private paymentService: PaymentService,
    private customerService?: CustomerService,
    private checkingAccountService?: CheckingAccountService
  ) {}

  private async ensureOrdersSchema(): Promise<void> {
    if (this.schemaEnsured) return;
    try {
      await this.db.query(`ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NULL DEFAULT 'EFECTIVO'`);
    } catch {
      // Columna ya existe
    }
    this.schemaEnsured = true;
  }

  private extractPaymentMethodFromRow(row: any): string {
    if (row.payment_method && String(row.payment_method).trim()) {
      return String(row.payment_method).trim().toUpperCase();
    }
    const notesStr = String(row.notes || '');
    const match = notesStr.match(/Pago:\s*([^|]+)/i);
    if (match && match[1]) {
      return match[1].trim().toUpperCase();
    }
    if (row.payment_status === 'UNPAID') {
      return 'CUENTA_CORRIENTE';
    }
    return 'EFECTIVO';
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /** Decide qué hacer ante un error de BD: fallback sólo si es caída de conexión y está permitido. */
  private handleDbError(error: any, action: string): void {
    if (isConnectionError(error)) {
      if (ALLOW_MEMORY_FALLBACK) {
        console.warn(`⚠️ [${action}] MySQL no disponible, usando memoria temporal (modo desarrollo).`);
        return; // el llamador continúa con fallback
      }
      throw new PersistenceError(
        `Base de datos no disponible. La operación "${action}" NO se guardó. Detalle: ${error.code || error.message}`,
        503
      );
    }
    throw new PersistenceError(`No se pudo ${action} en la base de datos: ${error.sqlMessage || error.message}`, 500);
  }

  private mapOrderRow(row: any, items: OrderItem[] = []): Order {
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
      paymentMethod: this.extractPaymentMethodFromRow(row),
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

  private mapItemRow(iRow: any): OrderItem {
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

  private generateOrderNumber(): string {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PED-${todayStr}-${rand}`; // 17 caracteres (columna VARCHAR(20))
  }

  // ------------------------------------------------------------------
  // Crear venta
  // ------------------------------------------------------------------

  public async createOrder(dto: CreateOrderDTO & { customerName?: string; paymentMethod?: string }): Promise<Order> {
    const items = (dto.items || [])
      .map((i: any) => ({
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
    const channel = (VALID_CHANNELS.includes(rawChannel) ? rawChannel : 'LOCAL') as AcquisitionChannel;
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const discountAmount = Number(dto.discountAmount) || 0;
    const deliveryFee = Number(dto.deliveryFee) || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);
    const pointsEarned = Math.floor(totalAmount / 100);

    const isCredit = /cuenta\s*corriente|fiado|credit/i.test(dto.paymentMethod || '');
    const paymentStatus: PaymentStatus = isCredit ? 'UNPAID' : 'PAID';
    const paidAmount = isCredit ? 0 : totalAmount;
    const balanceDue = totalAmount - paidAmount;
    const normalizedPaymentMethod = (dto.paymentMethod || 'EFECTIVO').trim().toUpperCase();

    const customerName = (dto.customerName || 'Consumidor Final').trim();
    const orderNumber = this.generateOrderNumber();

    await this.ensureOrdersSchema();

    let client: any = null;
    try {
      client = await this.db.connect();
      await client.query('BEGIN');

      // 1. Garantizar que el cliente exista (FK orders.customer_id → customers.id)
      const custRes = await client.query('SELECT id FROM customers WHERE id = $1', [dto.customerId]);
      if (custRes.rows.length === 0) {
        const [first, ...rest] = customerName.split(' ');
        await client.query(
          `INSERT IGNORE INTO customers (id, first_name, last_name, phone_whatsapp, preferred_channel, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            dto.customerId,
            (first || 'Consumidor').slice(0, 100),
            (rest.join(' ') || 'Final').slice(0, 100),
            `SIN-${String(dto.customerId).slice(0, 24)}`,
            channel,
            'Creado automáticamente al registrar una venta (cliente no existía en la base de datos).'
          ]
        );
      }

      // 2. Comisión del vendedor
      let commissionPct = 3.0;
      if (dto.sellerId) {
        const commRes = await client.query(
          'SELECT commission_percentage FROM seller_channel_commissions WHERE user_id = $1 AND channel = $2',
          [dto.sellerId, channel]
        );
        if (commRes.rows.length > 0) {
          commissionPct = parseFloat(commRes.rows[0].commission_percentage) || 0;
        }
      }
      const commissionAmount = Math.round(totalAmount * commissionPct) / 100;

      // 3. Cabecera del pedido (incluyendo payment_method)
      const orderRes = await client.query(
        `INSERT INTO orders (
          order_number, customer_id, seller_id, seller_name, quote_id, channel, status, payment_status, payment_method,
          subtotal, discount_amount, delivery_fee, total_amount, paid_amount, balance_due,
          points_earned, commission_amount, commission_settled, delivery_address, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, 'RECEIVED', $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 0, $17, $18)
        RETURNING id`,
        [
          orderNumber,
          dto.customerId,
          dto.sellerId || null,
          dto.sellerName || null,
          dto.quoteId || null,
          channel,
          paymentStatus,
          normalizedPaymentMethod,
          subtotal,
          discountAmount,
          deliveryFee,
          totalAmount,
          paidAmount,
          balanceDue,
          pointsEarned,
          commissionAmount,
          dto.deliveryAddress || null,
          [dto.paymentMethod ? `Pago: ${normalizedPaymentMethod}` : null, dto.notes || null].filter(Boolean).join(' | ') || null
        ]
      );

      const orderId = orderRes.rows[0]?.id;
      if (!orderId) {
        throw new Error('MySQL no devolvió el ID del pedido insertado.');
      }

      // 4. Ítems y Descuento de Stock
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [orderId, item.productName, item.productId, item.isBulkFractioned, item.quantity, item.unitPrice, item.quantity * item.unitPrice, item.notes]
        );

        // Descontar inventario del producto si está asociado
        if (item.productId) {
          try {
            const stockCheck = await client.query('SELECT current_stock FROM final_products WHERE id = $1', [item.productId]);
            const prevStock = stockCheck.rows.length > 0 ? parseFloat(stockCheck.rows[0].current_stock || '0') : 0;
            const resStock = Math.max(0, prevStock - item.quantity);

            await client.query(
              `UPDATE final_products 
               SET current_stock = GREATEST(0, current_stock - $1), updated_at = CURRENT_TIMESTAMP 
               WHERE id = $2`,
              [item.quantity, item.productId]
            );
            try {
              await client.query(
                `UPDATE products 
                 SET current_stock = GREATEST(0, current_stock - $1), updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $2`,
                [item.quantity, item.productId]
              );
            } catch {}

            // Registrar movimiento de salida en el Kardex
            await client.query(`
              INSERT INTO stock_movements (
                id, item_type, item_id, item_name, movement_type, quantity,
                previous_stock, resulting_stock, unit_of_measure, unit_cost,
                reference_type, reference_id, reference_number, reason, user_name, notes, created_at
              ) VALUES ($1, 'FINAL_PRODUCT', $2, $3, 'SALE', $4, $5, $6, 'UN', $7, 'ORDER', $8, $9, 'Venta realizada', $10, $11, CURRENT_TIMESTAMP)
            `, [
              uuidv4(),
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
          } catch (stockErr: any) {
            console.warn(`⚠️ No se pudo actualizar stock para producto ${item.productId}:`, stockErr.message);
          }
        }
      }

      // 5. Imputar en Cuenta Corriente si la venta es a crédito / cuenta corriente / fiado
      if (isCredit && this.checkingAccountService) {
        const desc = `Compra a Cta Cte Pedido ${orderNumber}`;
        await this.checkingAccountService.addMovement(
          dto.customerId,
          'DEBIT',
          totalAmount,
          'ORDER',
          desc,
          orderId,
          client
        );
      }

      await client.query('COMMIT');
      console.log(`💾 Venta ${orderNumber} guardada en MySQL (id=${orderId}, total=${totalAmount}).`);
      return await this.getOrderById(orderId);

    } catch (error: any) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch {}
      }
      if (error instanceof PersistenceError) throw error;
      console.error('❌ Error al guardar venta:', error.code, error.sqlMessage || error.message);
      this.handleDbError(error, 'registrar la venta'); // lanza si no corresponde fallback

      // Fallback (sólo desarrollo sin MySQL)
      const memOrder: Order = {
        id: 'ord-' + Date.now(),
        orderNumber,
        customerId: dto.customerId,
        customerName,
        sellerId: dto.sellerId,
        sellerName: dto.sellerName,
        channel,
        status: 'RECEIVED',
        paymentStatus,
        paymentMethod: normalizedPaymentMethod,
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
    } finally {
      if (client) {
        try { client.release(); } catch {}
      }
    }
  }

  // ------------------------------------------------------------------
  // Consultas
  // ------------------------------------------------------------------

  public async getOrderById(id: string): Promise<Order> {
    try {
      const res = await this.db.query(
        `SELECT o.*, c.first_name, c.last_name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         WHERE o.id = $1`,
        [id]
      );
      if (res.rows.length > 0) {
        const itemsRes = await this.db.query(
          `SELECT id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal
           FROM order_items WHERE order_id = $1`,
          [id]
        );
        return this.mapOrderRow(res.rows[0], itemsRes.rows.map((r: any) => this.mapItemRow(r)));
      }
    } catch (error: any) {
      this.handleDbError(error, 'consultar el pedido');
    }

    const found = this.inMemoryOrders.find(o => o.id === id);
    if (found) return found;
    throw new PersistenceError(`Pedido con ID ${id} no encontrado.`, 404);
  }

  public async getOrders(filter: OrderFilterDTO = {}): Promise<{ orders: Order[]; total: number }> {
    try {
      const where: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (filter.customerId) { where.push(`o.customer_id = $${idx++}`); values.push(filter.customerId); }
      if (filter.status) { where.push(`o.status = $${idx++}`); values.push(filter.status); }
      if (filter.paymentStatus) { where.push(`o.payment_status = $${idx++}`); values.push(filter.paymentStatus); }
      if (filter.startDate) { where.push(`o.created_at >= $${idx++}`); values.push(filter.startDate); }
      if (filter.endDate) { where.push(`o.created_at <= $${idx++}`); values.push(`${filter.endDate} 23:59:59`); }
      if (filter.search) {
        where.push(`(o.order_number LIKE $${idx} OR c.first_name LIKE $${idx} OR c.last_name LIKE $${idx})`);
        values.push(`%${filter.search}%`);
        idx++;
      }

      const limit = Math.min(Math.max(filter.limit || 500, 1), 2000);
      const offset = Math.max(filter.offset || 0, 0);

      const ordersRes = await this.db.query(
        `SELECT o.*, c.first_name, c.last_name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
         ORDER BY o.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        values
      );

      // Cargar ítems de todos los pedidos en una sola consulta
      const ids: string[] = ordersRes.rows.map((r: any) => r.id);
      const itemsByOrder: Record<string, OrderItem[]> = {};
      if (ids.length > 0) {
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        const itemsRes = await this.db.query(
          `SELECT id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal
           FROM order_items WHERE order_id IN (${placeholders})`,
          ids
        );
        for (const r of itemsRes.rows) {
          (itemsByOrder[r.order_id] ||= []).push(this.mapItemRow(r));
        }
      }

      const orders = ordersRes.rows.map((row: any) => this.mapOrderRow(row, itemsByOrder[row.id] || []));
      return { orders, total: orders.length };
    } catch (error: any) {
      this.handleDbError(error, 'consultar las ventas');
    }

    return { orders: this.inMemoryOrders, total: this.inMemoryOrders.length };
  }

  // ------------------------------------------------------------------
  // Cambio de estado, medio de pago, canal y vendedora (Kanban / Edición de Venta)
  // ------------------------------------------------------------------

  public async updateOrderStatus(id: string, dto: UpdateOrderStatusDTO): Promise<Order> {
    if (!dto.status && !dto.paymentStatus && !dto.paymentMethod && dto.sellerId === undefined && dto.sellerName === undefined && !dto.channel && dto.notes === undefined) {
      throw new PersistenceError('Debe indicar al menos un campo a actualizar.', 400);
    }

    await this.ensureOrdersSchema();

    try {
      const order = await this.getOrderById(id);
      const isCancelling = dto.status === 'CANCELLED' && order.status !== 'CANCELLED';

      if (isCancelling && order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.productId) {
            try {
              await this.db.query(
                `UPDATE final_products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [item.quantity, item.productId]
              );
              try {
                await this.db.query(
                  `UPDATE products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                  [item.quantity, item.productId]
                );
              } catch {}

              await this.db.query(`
                INSERT INTO stock_movements (
                  id, item_type, item_id, item_name, movement_type, quantity,
                  previous_stock, resulting_stock, unit_of_measure, unit_cost,
                  reference_type, reference_id, reference_number, reason, user_name, notes, created_at
                ) VALUES ($1, 'FINAL_PRODUCT', $2, $3, 'SALE_CANCEL', $4, 0, 0, 'UN', $5, 'ORDER', $6, $7, 'Cancelación de venta y reincorporación de stock', 'Sistema', $8, CURRENT_TIMESTAMP)
              `, [
                uuidv4(),
                item.productId,
                item.productName,
                item.quantity,
                item.unitPrice,
                order.id,
                order.orderNumber,
                `Cancelación de pedido N° ${order.orderNumber}`
              ]);
            } catch (err: any) {
              console.warn(`⚠️ Error al revertir stock por cancelación de pedido ${order.orderNumber}:`, err.message);
            }
          }
        }
      }

      const sets: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (dto.status) { sets.push(`status = $${idx++}`); values.push(dto.status); }
      if (dto.paymentStatus) { sets.push(`payment_status = $${idx++}`); values.push(dto.paymentStatus); }
      if (dto.paymentMethod) {
        const normPay = dto.paymentMethod.trim().toUpperCase();
        sets.push(`payment_method = $${idx++}`);
        values.push(normPay);
        if (!dto.paymentStatus) {
          const isCredit = /cuenta\s*corriente|fiado|credit/i.test(normPay);
          sets.push(`payment_status = $${idx++}`);
          values.push(isCredit ? 'UNPAID' : 'PAID');
          sets.push(`paid_amount = $${idx++}`);
          values.push(isCredit ? 0 : order.totalAmount);
          sets.push(`balance_due = $${idx++}`);
          values.push(isCredit ? order.totalAmount : 0);
        }
      }
      if (dto.channel) {
        sets.push(`channel = $${idx++}`);
        values.push(dto.channel);
      }
      if (dto.sellerId !== undefined) {
        sets.push(`seller_id = $${idx++}`);
        values.push(dto.sellerId || null);
      }
      if (dto.sellerName !== undefined) {
        sets.push(`seller_name = $${idx++}`);
        values.push(dto.sellerName || null);
      }
      if (dto.notes !== undefined) {
        sets.push(`notes = $${idx++}`);
        values.push(dto.notes || null);
      }

      // Recalcular comisión si cambió la vendedora o el canal
      if (dto.sellerId !== undefined || dto.channel !== undefined) {
        const targetSellerId = dto.sellerId !== undefined ? dto.sellerId : order.sellerId;
        const targetChannel = dto.channel || order.channel || 'LOCAL';
        let commissionPct = 3.0;
        if (targetSellerId) {
          try {
            const commRes = await this.db.query(
              'SELECT commission_percentage FROM seller_channel_commissions WHERE user_id = $1 AND channel = $2',
              [targetSellerId, targetChannel]
            );
            if (commRes.rows.length > 0) {
              commissionPct = parseFloat(commRes.rows[0].commission_percentage) || 0;
            }
          } catch {}
        } else {
          commissionPct = 0;
        }
        const newCommissionAmount = Math.round((Number(order.totalAmount) || 0) * commissionPct) / 100;
        sets.push(`commission_amount = $${idx++}`);
        values.push(newCommissionAmount);
      }

      sets.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const updateRes = await this.db.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${idx}`, values);
      if (updateRes.rowCount > 0) {
        return await this.getOrderById(id);
      }
    } catch (error: any) {
      this.handleDbError(error, 'actualizar el pedido');
    }

    const order = this.inMemoryOrders.find(o => o.id === id);
    if (order) {
      if (dto.status) order.status = dto.status as OrderStatus;
      if (dto.paymentStatus) order.paymentStatus = dto.paymentStatus;
      if (dto.paymentMethod) order.paymentMethod = dto.paymentMethod.trim().toUpperCase();
      if (dto.channel) order.channel = dto.channel;
      if (dto.sellerId !== undefined) order.sellerId = dto.sellerId;
      if (dto.sellerName !== undefined) order.sellerName = dto.sellerName;
      if (dto.notes !== undefined) order.notes = dto.notes;
      order.updatedAt = new Date().toISOString();
      return order;
    }

    throw new PersistenceError(`Pedido con ID ${id} no encontrado.`, 404);
  }
}
