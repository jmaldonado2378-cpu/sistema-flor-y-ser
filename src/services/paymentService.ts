import { Payment, CreatePaymentDTO } from '../types/sales';
import { CheckingAccountService } from './checkingAccountService';

export class PaymentService {
  constructor(
    private db: any,
    private checkingAccountService: CheckingAccountService
  ) {}

  /**
   * Genera un número secuencial único de recibo de cobro (Ej: REC-20260722-0001).
   */
  private async generateReceiptNumber(): Promise<string> {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `REC-${todayStr}-`;
    const res = await this.db.query(
      `SELECT receipt_number FROM payments WHERE receipt_number LIKE $1 ORDER BY receipt_number DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (res.rows.length === 0) {
      return `${prefix}0001`;
    }

    const lastSeq = parseInt(res.rows[0].receipt_number.split('-').pop() || '0', 10);
    const nextSeq = (lastSeq + 1).toString().padStart(4, '0');
    return `${prefix}${nextSeq}`;
  }

  /**
   * Registra un cobro (Efectivo, Mercado Pago, Transferencia o Imputación a Cuenta Corriente).
   */
  public async registerPayment(dto: CreatePaymentDTO): Promise<Payment> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const receiptNumber = await this.generateReceiptNumber();

      // 1. Insertar cobro en la tabla payments
      const paymentQuery = `
        INSERT INTO payments (
          receipt_number, customer_id, order_id, payment_method, amount, reference_number, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, receipt_number, customer_id, order_id, payment_method, amount, reference_number, notes, created_at
      `;

      const paymentRes = await client.query(paymentQuery, [
        receiptNumber,
        dto.customerId,
        dto.orderId || null,
        dto.paymentMethod,
        dto.amount,
        dto.referenceNumber || null,
        dto.notes || null
      ]);

      const row = paymentRes.rows[0];

      // 2. Si el pago está vinculado a un Pedido, actualizar los montos cobrados en la orden
      if (dto.orderId) {
        const orderRes = await client.query(
          'SELECT total_amount, paid_amount FROM orders WHERE id = $1 FOR UPDATE',
          [dto.orderId]
        );

        if (orderRes.rows.length > 0) {
          const totalAmount = parseFloat(orderRes.rows[0].total_amount);
          const currentPaid = parseFloat(orderRes.rows[0].paid_amount);

          const newPaidAmount = currentPaid + dto.amount;
          const newBalanceDue = Math.max(0, totalAmount - newPaidAmount);

          let newPaymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID';
          if (newBalanceDue === 0) {
            newPaymentStatus = 'PAID';
          } else if (newPaidAmount === 0) {
            newPaymentStatus = 'UNPAID';
          }

          await client.query(
            `UPDATE orders 
             SET paid_amount = $1, balance_due = $2, payment_status = $3, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4`,
            [newPaidAmount, newBalanceDue, newPaymentStatus, dto.orderId]
          );
        }
      }

      // 3. Imputación en la Cuenta Corriente del cliente
      // Si el pago es con Efectivo, Mercado Pago o Transferencia, registra un CRÉDITO (disminuye la deuda)
      // Si el medio de pago es CUENTA_CORRIENTE, la compra se cargó a la cuenta (DÉBITO manejado en venta)
      if (dto.paymentMethod !== 'CURRENT_ACCOUNT_CREDIT') {
        const methodDesc =
          dto.paymentMethod === 'CASH'
            ? 'Efectivo'
            : dto.paymentMethod === 'MERCADO_PAGO'
            ? 'Mercado Pago'
            : 'Transferencia Bancaria';

        const desc = `Pago Recibo ${receiptNumber} (${methodDesc})${dto.referenceNumber ? ' Ref: ' + dto.referenceNumber : ''}`;

        await this.checkingAccountService.addMovement(
          dto.customerId,
          'CREDIT',
          dto.amount,
          'PAYMENT',
          desc,
          row.id,
          client
        );
      } else if (dto.orderId) {
        // Venta a Cuenta Corriente: registra DÉBITO (aumenta la deuda del cliente)
        const desc = `Compra a Cta Cte Recibo ${receiptNumber}`;
        await this.checkingAccountService.addMovement(
          dto.customerId,
          'DEBIT',
          dto.amount,
          'ORDER',
          desc,
          dto.orderId,
          client
        );
      }

      await client.query('COMMIT');

      // 4. Obtener nombre del cliente y número de orden
      const customerRes = await this.db.query(
        'SELECT first_name, last_name FROM customers WHERE id = $1',
        [dto.customerId]
      );
      const customerName = customerRes.rows.length
        ? `${customerRes.rows[0].first_name} ${customerRes.rows[0].last_name}`
        : undefined;

      let orderNumber: string | undefined;
      if (dto.orderId) {
        const oRes = await this.db.query('SELECT order_number FROM orders WHERE id = $1', [dto.orderId]);
        if (oRes.rows.length) orderNumber = oRes.rows[0].order_number;
      }

      return {
        id: row.id,
        receiptNumber: row.receipt_number,
        customerId: row.customer_id,
        customerName,
        orderId: row.order_id,
        orderNumber,
        paymentMethod: row.payment_method,
        amount: parseFloat(row.amount),
        referenceNumber: row.reference_number,
        notes: row.notes,
        createdAt: row.created_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene la lista de cobros realizados a un cliente.
   */
  public async getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    const query = `
      SELECT 
        p.id, p.receipt_number, p.customer_id, p.order_id, p.payment_method, p.amount, p.reference_number, p.notes, p.created_at,
        c.first_name, c.last_name, o.order_number
      FROM payments p
      JOIN customers c ON c.id = p.customer_id
      LEFT JOIN orders o ON o.id = p.order_id
      WHERE p.customer_id = $1
      ORDER BY p.created_at DESC
    `;

    const res = await this.db.query(query, [customerId]);
    return res.rows.map((row: any) => ({
      id: row.id,
      receiptNumber: row.receipt_number,
      customerId: row.customer_id,
      customerName: `${row.first_name} ${row.last_name}`,
      orderId: row.order_id,
      orderNumber: row.order_number,
      paymentMethod: row.payment_method,
      amount: parseFloat(row.amount),
      referenceNumber: row.reference_number,
      notes: row.notes,
      createdAt: row.created_at
    }));
  }

  /**
   * Obtiene la lista de cobros asociados a un pedido.
   */
  public async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const query = `
      SELECT 
        p.id, p.receipt_number, p.customer_id, p.order_id, p.payment_method, p.amount, p.reference_number, p.notes, p.created_at,
        c.first_name, c.last_name, o.order_number
      FROM payments p
      JOIN customers c ON c.id = p.customer_id
      LEFT JOIN orders o ON o.id = p.order_id
      WHERE p.order_id = $1
      ORDER BY p.created_at DESC
    `;

    const res = await this.db.query(query, [orderId]);
    return res.rows.map((row: any) => ({
      id: row.id,
      receiptNumber: row.receipt_number,
      customerId: row.customer_id,
      customerName: `${row.first_name} ${row.last_name}`,
      orderId: row.order_id,
      orderNumber: row.order_number,
      paymentMethod: row.payment_method,
      amount: parseFloat(row.amount),
      referenceNumber: row.reference_number,
      notes: row.notes,
      createdAt: row.created_at
    }));
  }

  /**
   * Obtiene un cobro por su ID.
   */
  public async getPaymentById(id: string): Promise<Payment> {
    const query = `
      SELECT 
        p.id, p.receipt_number, p.customer_id, p.order_id, p.payment_method, p.amount, p.reference_number, p.notes, p.created_at,
        c.first_name, c.last_name, o.order_number
      FROM payments p
      JOIN customers c ON c.id = p.customer_id
      LEFT JOIN orders o ON o.id = p.order_id
      WHERE p.id = $1
    `;

    const res = await this.db.query(query, [id]);
    if (res.rows.length === 0) {
      throw new Error(`Cobro con ID ${id} no encontrado.`);
    }

    const row = res.rows[0];
    return {
      id: row.id,
      receiptNumber: row.receipt_number,
      customerId: row.customer_id,
      customerName: `${row.first_name} ${row.last_name}`,
      orderId: row.order_id,
      orderNumber: row.order_number,
      paymentMethod: row.payment_method,
      amount: parseFloat(row.amount),
      referenceNumber: row.reference_number,
      notes: row.notes,
      createdAt: row.created_at
    };
  }
}
