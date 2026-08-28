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

const initialMockOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'PED-20260720-0001',
    customerId: 'c1000000-0000-0000-0000-000000000001',
    customerName: 'Martina Gómez',
    channel: AcquisitionChannel.WHATSAPP,
    status: 'PENDING',
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
  },
  {
    id: 'ord-102',
    orderNumber: 'PED-20260718-0002',
    customerId: 'c2000000-0000-0000-0000-000000000002',
    customerName: 'Lucas Benítez',
    channel: AcquisitionChannel.LOCAL,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    subtotal: 12400,
    discountAmount: 0,
    deliveryFee: 0,
    totalAmount: 12400,
    paidAmount: 12400,
    balanceDue: 0,
    pointsEarned: 124,
    items: [
      { id: 'oi-3', productName: 'Nuez Mariposa 500g', productId: 'fp-002', isBulkFractioned: false, quantity: 2, unitPrice: 6200, subtotal: 12400 }
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

export class SaleService {
  private inMemoryOrders: Order[] = [...initialMockOrders];

  constructor(
    private db: any,
    private paymentService: PaymentService,
    private customerService?: CustomerService
  ) {}

  private generateOrderNumberInMemory(): string {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = (this.inMemoryOrders.length + 1).toString().padStart(4, '0');
    return `PED-${todayStr}-${seq}`;
  }

  public async createOrder(dto: CreateOrderDTO & { customerName?: string }): Promise<Order> {
    const channel = dto.channel || AcquisitionChannel.LOCAL;
    const subtotal = dto.items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unitPrice || 0)), 0);
    const discountAmount = dto.discountAmount || 0;
    const deliveryFee = dto.deliveryFee || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);
    const pointsEarned = Math.floor(totalAmount / 100);

    let resolvedCustomerName = dto.customerName || 'Cliente Registrado';
    if (!dto.customerName && this.customerService && dto.customerId) {
      try {
        const cust = await this.customerService.getById(dto.customerId);
        if (cust) {
          resolvedCustomerName = `${cust.firstName} ${cust.lastName}`;
        }
      } catch {}
    }

    let client: any = null;
    try {
      client = await this.db.connect();
      await client.query('BEGIN');

      const custRes = await client.query('SELECT id, first_name, last_name FROM customers WHERE id = $1', [
        dto.customerId
      ]);
      const customerName = custRes.rows.length > 0 
        ? `${custRes.rows[0].first_name} ${custRes.rows[0].last_name}` 
        : resolvedCustomerName;

      const orderNumber = `PED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Obtener porcentaje de comisión para este vendedor y canal
      let commissionPct = 3.0; // por defecto 3%
      if (dto.sellerId) {
        try {
          const commRes = await client.query(
            'SELECT commission_percentage FROM seller_channel_commissions WHERE user_id = $1 AND channel = $2',
            [dto.sellerId, channel]
          );
          if (commRes.rows.length > 0) {
            commissionPct = parseFloat(commRes.rows[0].commission_percentage) || 0;
          }
        } catch {}
      }
      const commissionAmount = Math.round((totalAmount * (commissionPct / 100)) * 100) / 100;

      const insertOrderQuery = `
        INSERT INTO orders (
          order_number, customer_id, seller_id, seller_name, quote_id, channel, status, payment_status,
          subtotal, discount_amount, delivery_fee, total_amount, paid_amount, balance_due,
          points_earned, commission_amount, commission_settled, delivery_address, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'PAID', $7, $8, $9, $10, $10, 0, $11, $12, 0, $13, $14)
        RETURNING id, created_at;
      `;

      const orderRes = await client.query(insertOrderQuery, [
        orderNumber,
        dto.customerId,
        dto.sellerId || null,
        dto.sellerName || null,
        dto.quoteId || null,
        channel,
        subtotal,
        discountAmount,
        deliveryFee,
        totalAmount,
        pointsEarned,
        commissionAmount,
        dto.deliveryAddress || null,
        dto.notes || null
      ]);

      const orderId = orderRes.rows[0].id;

      for (const item of dto.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [orderId, item.productName, item.productId || null, item.isBulkFractioned || false, item.quantity, item.unitPrice, (item.quantity * item.unitPrice)]
        );
      }

      await client.query('COMMIT');
      return await this.getOrderById(orderId);

    } catch (error) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch {}
      }
      return this.createOrderInMemory(dto, resolvedCustomerName, totalAmount, subtotal, pointsEarned, channel);
    } finally {
      if (client) {
        try { client.release(); } catch {}
      }
    }
  }

  private createOrderInMemory(
    dto: CreateOrderDTO, 
    customerName: string,
    totalAmount: number, 
    subtotal: number, 
    pointsEarned: number, 
    channel: AcquisitionChannel
  ): Order {
    const commissionAmount = Math.round((totalAmount * 0.03) * 100) / 100;
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: this.generateOrderNumberInMemory(),
      customerId: dto.customerId,
      customerName: customerName || 'Cliente Registrado',
      sellerId: dto.sellerId,
      sellerName: dto.sellerName || 'Vendedor General',
      channel,
      status: 'PENDING',
      paymentStatus: 'PAID',
      subtotal,
      discountAmount: dto.discountAmount || 0,
      deliveryFee: dto.deliveryFee || 0,
      totalAmount,
      paidAmount: totalAmount,
      balanceDue: 0,
      pointsEarned,
      commissionAmount,
      commissionSettled: false,
      items: dto.items.map(i => ({
        id: 'oi-' + Math.random(),
        productName: i.productName,
        productId: i.productId,
        isBulkFractioned: i.isBulkFractioned || false,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.quantity * i.unitPrice,
        notes: i.notes
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.inMemoryOrders.unshift(newOrder);
    return newOrder;
  }

  public async getOrderById(id: string): Promise<Order> {
    try {
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
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const itemsRes = await this.db.query(
          `SELECT id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal
           FROM order_items WHERE order_id = $1`,
          [id]
        );

        const items: OrderItem[] = itemsRes.rows.map((iRow: any) => ({
          id: iRow.id,
          orderId: iRow.order_id,
          productName: iRow.product_name,
          productId: iRow.product_id,
          isBulkFractioned: iRow.is_bulk_fractioned || false,
          quantity: parseFloat(iRow.quantity),
          unitPrice: parseFloat(iRow.unit_price),
          subtotal: parseFloat(iRow.subtotal)
        }));

        return {
          id: row.id,
          orderNumber: row.order_number,
          customerId: row.customer_id,
          customerName: `${row.first_name} ${row.last_name}`,
          sellerId: row.seller_id,
          sellerName: row.seller_name,
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
          commissionAmount: parseFloat(row.commission_amount || 0),
          commissionSettled: Boolean(row.commission_settled),
          commissionSettlementId: row.commission_settlement_id,
          items,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch {
      // Fallback
    }

    const found = this.inMemoryOrders.find(o => o.id === id);
    if (found) return found;
    throw new Error(`Pedido con ID ${id} no encontrado.`);
  }

  public async getOrders(filter: OrderFilterDTO = {}): Promise<{ orders: Order[]; total: number }> {
    try {
      const ordersQuery = `
        SELECT 
          o.id, o.order_number, o.customer_id, o.seller_id, o.seller_name, o.channel, o.status, o.payment_status,
          o.subtotal, o.discount_amount, o.delivery_fee, o.total_amount, o.paid_amount, o.balance_due,
          o.points_earned, o.commission_amount, o.commission_settled, o.commission_settlement_id, o.created_at, o.updated_at, c.first_name, c.last_name
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        ORDER BY o.created_at DESC;
      `;

      const ordersRes = await this.db.query(ordersQuery);
      if (ordersRes.rows.length > 0) {
        const orders: Order[] = ordersRes.rows.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          customerId: row.customer_id,
          customerName: `${row.first_name} ${row.last_name}`,
          sellerId: row.seller_id,
          sellerName: row.seller_name,
          channel: row.channel,
          status: row.status,
          paymentStatus: row.payment_status,
          subtotal: parseFloat(row.subtotal),
          discountAmount: parseFloat(row.discount_amount),
          deliveryFee: parseFloat(row.delivery_fee),
          totalAmount: parseFloat(row.total_amount),
          paidAmount: parseFloat(row.paid_amount),
          balanceDue: parseFloat(row.balance_due),
          pointsEarned: row.points_earned || 0,
          commissionAmount: parseFloat(row.commission_amount || 0),
          commissionSettled: Boolean(row.commission_settled),
          commissionSettlementId: row.commission_settlement_id,
          items: [],
          createdAt: row.created_at,
          updatedAt: row.updated_at || row.created_at
        }));

        return { orders, total: orders.length };
      }
    } catch {
      // Fallback en memoria
    }

    return { orders: this.inMemoryOrders, total: this.inMemoryOrders.length };
  }

  public async updateOrderStatus(id: string, dto: UpdateOrderStatusDTO): Promise<Order> {
    try {
      if (dto.status) {
        await this.db.query(`UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [dto.status, id]);
        return this.getOrderById(id);
      }
    } catch {
      // Fallback
    }

    const order = this.inMemoryOrders.find(o => o.id === id);
    if (order) {
      if (dto.status) order.status = dto.status;
      if (dto.paymentStatus) order.paymentStatus = dto.paymentStatus;
      order.updatedAt = new Date().toISOString();
      return order;
    }

    throw new Error(`Pedido con ID ${id} no encontrado.`);
  }
}
