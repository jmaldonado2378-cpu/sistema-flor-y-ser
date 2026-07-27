import { Pool } from 'pg';
import {
  Order,
  OrderItem,
  CreateOrderDTO,
  OrderFilterDTO,
  UpdateOrderStatusDTO
} from '../types/sales';
import { PaymentService } from './paymentService';

export class SaleService {
  constructor(
    private db: Pool,
    private paymentService: PaymentService
  ) {}

  /**
   * Genera un número único de pedido (Ej: PED-20260722-0001).
   */
  private async generateOrderNumber(): Promise<string> {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PED-${todayStr}-`;
    const res = await this.db.query(
      `SELECT order_number FROM orders WHERE order_number LIKE $1 ORDER BY order_number DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (res.rows.length === 0) {
      return `${prefix}0001`;
    }

    const lastSeq = parseInt(res.rows[0].order_number.split('-').pop() || '0', 10);
    const nextSeq = (lastSeq + 1).toString().padStart(4, '0');
    return `${prefix}${nextSeq}`;
  }

  /**
   * Registra una nueva Venta / Pedido en el sistema.
   * Calcula subtotales, totales, asignación de puntos de fidelidad y registra el cobro inicial si aplica.
   */
  public async createOrder(dto: CreateOrderDTO): Promise<Order> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // 1. Verificar existencia del cliente
      const custRes = await client.query('SELECT id, first_name, last_name FROM customers WHERE id = $1', [
        dto.customerId
      ]);

      if (custRes.rows.length === 0) {
        throw new Error(`Cliente con ID ${dto.customerId} no encontrado.`);
      }

      const customerName = `${custRes.rows[0].first_name} ${custRes.rows[0].last_name}`;
      const orderNumber = await this.generateOrderNumber();

      // 2. Calcular subtotal de items
      let subtotal = 0;
      const processedItems = dto.items.map((item) => {
        const itemSubtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
        subtotal += itemSubtotal;
        return {
          productName: item.productName,
          productId: item.productId || null,
          isBulkFractioned: item.isBulkFractioned || false,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
          notes: item.notes || null
        };
      });

      const discountAmount = dto.discountAmount || 0;
      const deliveryFee = dto.deliveryFee || 0;
      const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

      // Puntos acumulados: 1 punto por cada $100 consumidos
      const pointsEarned = Math.floor(totalAmount / 100);

      // 3. Crear el pedido
      const insertOrderQuery = `
        INSERT INTO orders (
          order_number, customer_id, quote_id, channel, status, payment_status,
          subtotal, discount_amount, delivery_fee, total_amount, paid_amount, balance_due,
          points_earned, delivery_address, notes
        ) VALUES ($1, $2, $3, $4, 'PENDING', 'UNPAID', $5, $6, $7, $8, 0, $8, $9, $10, $11)
        RETURNING id, order_number, customer_id, quote_id, channel, status, payment_status,
                  subtotal, discount_amount, delivery_fee, total_amount, paid_amount, balance_due,
                  points_earned, delivery_address, notes, created_at, updated_at
      `;

      const orderRes = await client.query(insertOrderQuery, [
        orderNumber,
        dto.customerId,
        dto.quoteId || null,
        dto.channel,
        subtotal,
        discountAmount,
        deliveryFee,
        totalAmount,
        pointsEarned,
        dto.deliveryAddress || null,
        dto.notes || null
      ]);

      const createdOrderRow = orderRes.rows[0];
      const orderId = createdOrderRow.id;

      // 4. Insertar los items del pedido
      const insertedItems: OrderItem[] = [];
      for (const item of processedItems) {
        const itemRes = await client.query(
          `INSERT INTO order_items (
            order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes`,
          [
            orderId,
            item.productName,
            item.productId,
            item.isBulkFractioned,
            item.quantity,
            item.unitPrice,
            item.subtotal,
            item.notes
          ]
        );

        const iRow = itemRes.rows[0];
        insertedItems.push({
          id: iRow.id,
          orderId: iRow.order_id,
          productName: iRow.product_name,
          productId: iRow.product_id,
          isBulkFractioned: iRow.is_bulk_fractioned,
          quantity: parseFloat(iRow.quantity),
          unitPrice: parseFloat(iRow.unit_price),
          subtotal: parseFloat(iRow.subtotal),
          notes: iRow.notes
        });
      }

      // 5. Asignar puntos de fidelización al cliente
      if (pointsEarned > 0) {
        await client.query(
          'UPDATE customers SET points_balance = points_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [pointsEarned, dto.customerId]
        );

        await client.query(
          `INSERT INTO customer_points_history (
            customer_id, points, transaction_type, reference_type, reference_id, description
          ) VALUES ($1, $2, 'ACCUMULATION', 'ORDER', $3, $4)`,
          [dto.customerId, pointsEarned, orderId, `Puntos acumulados por Pedido ${orderNumber}`]
        );
      }

      await client.query('COMMIT');

      // 6. Si se proporcionó cobro inicial, registrarlo a través del PaymentService
      if (dto.initialPayment && dto.initialPayment.amount > 0) {
        await this.paymentService.registerPayment({
          customerId: dto.customerId,
          orderId,
          paymentMethod: dto.initialPayment.paymentMethod,
          amount: dto.initialPayment.amount,
          referenceNumber: dto.initialPayment.referenceNumber,
          notes: dto.initialPayment.notes || `Cobro inicial al crear Pedido ${orderNumber}`
        });
      }

      // 7. Retornar pedido completo actualizado
      return this.getOrderById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene un pedido detallado por su ID.
   */
  public async getOrderById(id: string): Promise<Order> {
    const orderQuery = `
      SELECT 
        o.id, o.order_number, o.customer_id, o.quote_id, o.channel, o.status, o.payment_status,
        o.subtotal, o.discount_amount, o.delivery_fee, o.total_amount, o.paid_amount, o.balance_due,
        o.points_earned, o.delivery_address, o.notes, o.created_at, o.updated_at,
        c.first_name, c.last_name
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.id = $1
    `;

    const res = await this.db.query(orderQuery, [id]);
    if (res.rows.length === 0) {
      throw new Error(`Pedido con ID ${id} no encontrado.`);
    }

    const row = res.rows[0];

    // Obtener items
    const itemsRes = await this.db.query(
      `SELECT id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes
       FROM order_items WHERE order_id = $1`,
      [id]
    );

    const items: OrderItem[] = itemsRes.rows.map((iRow) => ({
      id: iRow.id,
      orderId: iRow.order_id,
      productName: iRow.product_name,
      productId: iRow.product_id,
      isBulkFractioned: iRow.is_bulk_fractioned,
      quantity: parseFloat(iRow.quantity),
      unitPrice: parseFloat(iRow.unit_price),
      subtotal: parseFloat(iRow.subtotal),
      notes: iRow.notes
    }));

    // Obtener pagos registrados
    const payments = await this.paymentService.getPaymentsByOrder(id);

    return {
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      customerName: `${row.first_name} ${row.last_name}`,
      quoteId: row.quote_id,
      channel: row.channel,
      status: row.status,
      paymentStatus: row.payment_status,
      subtotal: parseFloat(row.subtotal),
      discountAmount: parseFloat(row.discount_amount),
      deliveryFee: parseFloat(row.delivery_fee),
      totalAmount: parseFloat(row.total_amount),
      paidAmount: parseFloat(row.paid_amount),
      balanceDue: parseFloat(row.balance_due),
      pointsEarned: row.points_earned,
      deliveryAddress: row.delivery_address,
      notes: row.notes,
      items,
      payments,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Consulta paginada de pedidos con filtros por cliente, estado, estado de pago, rango de fechas o búsqueda.
   */
  public async getOrders(filter: OrderFilterDTO = {}): Promise<{ orders: Order[]; total: number }> {
    const { customerId, status, paymentStatus, startDate, endDate, search, limit = 20, offset = 0 } = filter;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (customerId) {
      conditions.push(`o.customer_id = $${paramIdx++}`);
      params.push(customerId);
    }

    if (status) {
      conditions.push(`o.status = $${paramIdx++}`);
      params.push(status);
    }

    if (paymentStatus) {
      conditions.push(`o.payment_status = $${paramIdx++}`);
      params.push(paymentStatus);
    }

    if (startDate) {
      conditions.push(`o.created_at >= $${paramIdx++}::timestamp`);
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push(`o.created_at <= $${paramIdx++}::timestamp`);
      params.push(`${endDate} 23:59:59`);
    }

    if (search) {
      conditions.push(
        `(o.order_number ILIKE $${paramIdx} OR c.first_name ILIKE $${paramIdx} OR c.last_name ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      ${whereClause}
    `;

    const countRes = await this.db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const ordersQuery = `
      SELECT 
        o.id, o.order_number, o.customer_id, o.quote_id, o.channel, o.status, o.payment_status,
        o.subtotal, o.discount_amount, o.delivery_fee, o.total_amount, o.paid_amount, o.balance_due,
        o.points_earned, o.delivery_address, o.notes, o.created_at, o.updated_at,
        c.first_name, c.last_name
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const ordersRes = await this.db.query(ordersQuery, [...params, limit, offset]);

    const orders: Order[] = await Promise.all(
      ordersRes.rows.map(async (row) => {
        const itemsRes = await this.db.query(
          `SELECT id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes
           FROM order_items WHERE order_id = $1`,
          [row.id]
        );

        const items: OrderItem[] = itemsRes.rows.map((iRow) => ({
          id: iRow.id,
          orderId: iRow.order_id,
          productName: iRow.product_name,
          productId: iRow.product_id,
          isBulkFractioned: iRow.is_bulk_fractioned,
          quantity: parseFloat(iRow.quantity),
          unitPrice: parseFloat(iRow.unit_price),
          subtotal: parseFloat(iRow.subtotal),
          notes: iRow.notes
        }));

        return {
          id: row.id,
          orderNumber: row.order_number,
          customerId: row.customer_id,
          customerName: `${row.first_name} ${row.last_name}`,
          quoteId: row.quote_id,
          channel: row.channel,
          status: row.status,
          paymentStatus: row.payment_status,
          subtotal: parseFloat(row.subtotal),
          discountAmount: parseFloat(row.discount_amount),
          deliveryFee: parseFloat(row.delivery_fee),
          totalAmount: parseFloat(row.total_amount),
          paidAmount: parseFloat(row.paid_amount),
          balanceDue: parseFloat(row.balance_due),
          pointsEarned: row.points_earned,
          deliveryAddress: row.delivery_address,
          notes: row.notes,
          items,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      })
    );

    return { orders, total };
  }

  /**
   * Actualiza el estado operativo o de pago de un pedido.
   */
  public async updateOrderStatus(id: string, dto: UpdateOrderStatusDTO): Promise<Order> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (dto.status) {
      updates.push(`status = $${paramIdx++}`);
      params.push(dto.status);
    }

    if (dto.paymentStatus) {
      updates.push(`payment_status = $${paramIdx++}`);
      params.push(dto.paymentStatus);
    }

    if (dto.notes) {
      updates.push(`notes = $${paramIdx++}`);
      params.push(dto.notes);
    }

    if (updates.length === 0) {
      return this.getOrderById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIdx}`;
    await this.db.query(query, params);

    return this.getOrderById(id);
  }
}
