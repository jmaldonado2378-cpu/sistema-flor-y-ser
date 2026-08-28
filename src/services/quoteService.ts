import {
  Quote,
  QuoteItem,
  CreateQuoteDTO,
  UpdateQuoteDTO,
  QuoteFilterDTO,
  ConvertQuoteToOrderDTO,
  Order
} from '../types/sales';
import { SaleService } from './saleService';

export class QuoteService {
  constructor(
    private db: any,
    private saleService: SaleService
  ) {}

  /**
   * Genera un número secuencial único de presupuesto (Ej: PRES-20260722-0001).
   */
  private async generateQuoteNumber(): Promise<string> {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PRES-${todayStr}-`;
    const res = await this.db.query(
      `SELECT quote_number FROM quotes WHERE quote_number LIKE $1 ORDER BY quote_number DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (res.rows.length === 0) {
      return `${prefix}0001`;
    }

    const lastSeq = parseInt(res.rows[0].quote_number.split('-').pop() || '0', 10);
    const nextSeq = (lastSeq + 1).toString().padStart(4, '0');
    return `${prefix}${nextSeq}`;
  }

  /**
   * Registra un nuevo Presupuesto formal.
   */
  public async createQuote(dto: CreateQuoteDTO): Promise<Quote> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // 1. Verificar cliente
      const custRes = await client.query('SELECT id, first_name, last_name FROM customers WHERE id = $1', [
        dto.customerId
      ]);

      if (custRes.rows.length === 0) {
        throw new Error(`Cliente con ID ${dto.customerId} no encontrado.`);
      }

      const quoteNumber = await this.generateQuoteNumber();

      // 2. Procesar ítems y montos
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

      // 3. Insertar presupuesto
      const quoteQuery = `
        INSERT INTO quotes (
          quote_number, customer_id, channel, status, expiration_date,
          subtotal, discount_amount, delivery_fee, total_amount, delivery_address, notes
        ) VALUES ($1, $2, $3, 'DRAFT', $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, quote_number, customer_id, channel, status, expiration_date,
                  subtotal, discount_amount, delivery_fee, total_amount, delivery_address, notes, created_at, updated_at
      `;

      const quoteRes = await client.query(quoteQuery, [
        quoteNumber,
        dto.customerId,
        dto.channel || 'LOCAL',
        dto.expirationDate,
        subtotal,
        discountAmount,
        deliveryFee,
        totalAmount,
        dto.deliveryAddress || null,
        dto.notes || null
      ]);

      const quoteId = quoteRes.rows[0].id;

      // 4. Insertar ítems
      for (const item of processedItems) {
        await client.query(
          `INSERT INTO quote_items (
            quote_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            quoteId,
            item.productName,
            item.productId,
            item.isBulkFractioned,
            item.quantity,
            item.unitPrice,
            item.subtotal,
            item.notes
          ]
        );
      }

      await client.query('COMMIT');

      return this.getQuoteById(quoteId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene un presupuesto por su ID.
   */
  public async getQuoteById(id: string): Promise<Quote> {
    const query = `
      SELECT 
        q.id, q.quote_number, q.customer_id, q.channel, q.status, q.expiration_date,
        q.subtotal, q.discount_amount, q.delivery_fee, q.total_amount, q.delivery_address,
        q.notes, q.converted_order_id, q.created_at, q.updated_at,
        c.first_name, c.last_name
      FROM quotes q
      JOIN customers c ON c.id = q.customer_id
      WHERE q.id = $1
    `;

    const res = await this.db.query(query, [id]);
    if (res.rows.length === 0) {
      throw new Error(`Presupuesto con ID ${id} no encontrado.`);
    }

    const row = res.rows[0];

    const itemsRes = await this.db.query(
      `SELECT id, quote_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes
       FROM quote_items WHERE quote_id = $1`,
      [id]
    );

    const items: QuoteItem[] = itemsRes.rows.map((iRow: any) => ({
      id: iRow.id,
      quoteId: iRow.quote_id,
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
      quoteNumber: row.quote_number,
      customerId: row.customer_id,
      customerName: `${row.first_name} ${row.last_name}`,
      channel: row.channel,
      status: row.status,
      expirationDate: row.expiration_date,
      subtotal: parseFloat(row.subtotal),
      discountAmount: parseFloat(row.discount_amount),
      deliveryFee: parseFloat(row.delivery_fee),
      totalAmount: parseFloat(row.total_amount),
      deliveryAddress: row.delivery_address,
      notes: row.notes,
      convertedOrderId: row.converted_order_id,
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Obtiene presupuestos con filtros.
   */
  public async getQuotes(filter: QuoteFilterDTO = {}): Promise<{ quotes: Quote[]; total: number }> {
    const { customerId, status, startDate, endDate, search, limit = 20, offset = 0 } = filter;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (customerId) {
      conditions.push(`q.customer_id = $${paramIdx++}`);
      params.push(customerId);
    }

    if (status) {
      conditions.push(`q.status = $${paramIdx++}`);
      params.push(status);
    }

    if (startDate) {
      conditions.push(`q.created_at >= $${paramIdx++}`);
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push(`q.created_at <= $${paramIdx++}`);
      params.push(`${endDate} 23:59:59`);
    }

    if (search) {
      conditions.push(
        `(q.quote_number ILIKE $${paramIdx} OR c.first_name ILIKE $${paramIdx} OR c.last_name ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await this.db.query(
      `SELECT COUNT(*) as total FROM quotes q JOIN customers c ON c.id = q.customer_id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const query = `
      SELECT 
        q.id, q.quote_number, q.customer_id, q.channel, q.status, q.expiration_date,
        q.subtotal, q.discount_amount, q.delivery_fee, q.total_amount, q.delivery_address,
        q.notes, q.converted_order_id, q.created_at, q.updated_at,
        c.first_name, c.last_name
      FROM quotes q
      JOIN customers c ON c.id = q.customer_id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const res = await this.db.query(query, [...params, limit, offset]);

    const quotes: Quote[] = await Promise.all(
      res.rows.map(async (row: any) => {
        const itemsRes = await this.db.query(
          `SELECT id, quote_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal, notes
           FROM quote_items WHERE quote_id = $1`,
          [row.id]
        );

        const items: QuoteItem[] = itemsRes.rows.map((iRow: any) => ({
          id: iRow.id,
          quoteId: iRow.quote_id,
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
          quoteNumber: row.quote_number,
          customerId: row.customer_id,
          customerName: `${row.first_name} ${row.last_name}`,
          channel: row.channel,
          status: row.status,
          expirationDate: row.expiration_date,
          subtotal: parseFloat(row.subtotal),
          discountAmount: parseFloat(row.discount_amount),
          deliveryFee: parseFloat(row.delivery_fee),
          totalAmount: parseFloat(row.total_amount),
          deliveryAddress: row.delivery_address,
          notes: row.notes,
          convertedOrderId: row.converted_order_id,
          items,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      })
    );

    return { quotes, total };
  }

  /**
   * Actualiza el estado o contenido de un presupuesto.
   */
  public async updateQuote(id: string, dto: UpdateQuoteDTO): Promise<Quote> {
    if (dto.status) {
      await this.db.query('UPDATE quotes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        dto.status,
        id
      ]);
    }
    return this.getQuoteById(id);
  }

  /**
   * CONVERSIÓN EN 1 CLIC: Convierte un Presupuesto existente en un Pedido / Venta firme.
   * Genera la orden de compra, sus ítems, aplica fidelización y opcionalmente procesa el cobro inicial.
   */
  public async convertQuoteToOrder(
    quoteId: string,
    dto: ConvertQuoteToOrderDTO = {}
  ): Promise<{ order: Order; quote: Quote }> {
    const quote = await this.getQuoteById(quoteId);

    if (quote.status === 'CONVERTED') {
      throw new Error(`El presupuesto ${quote.quoteNumber} ya fue convertido a pedido previamente.`);
    }

    if (quote.status === 'EXPIRED' || quote.status === 'REJECTED') {
      throw new Error(`No se puede convertir el presupuesto ${quote.quoteNumber} porque está ${quote.status}.`);
    }

    // 1. Transformar ítems de presupuesto a DTO de pedido
    const orderItems = quote.items.map((item) => ({
      productName: item.productName,
      productId: item.productId,
      isBulkFractioned: item.isBulkFractioned,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes
    }));

    // Configurar cobro inicial si se especifica en la conversión en 1 clic
    const initialPayment =
      dto.initialPaymentMethod && dto.initialPaymentAmount
        ? {
            paymentMethod: dto.initialPaymentMethod,
            amount: dto.initialPaymentAmount,
            referenceNumber: dto.referenceNumber,
            notes: dto.notes || `Cobro al convertir Presupuesto ${quote.quoteNumber}`
          }
        : undefined;

    // 2. Crear pedido
    const createdOrder = await this.saleService.createOrder({
      customerId: quote.customerId,
      channel: quote.channel,
      quoteId: quote.id,
      items: orderItems,
      discountAmount: quote.discountAmount,
      deliveryFee: quote.deliveryFee,
      deliveryAddress: quote.deliveryAddress,
      notes: `Convertido en 1 clic desde Presupuesto ${quote.quoteNumber}. ${dto.notes || ''}`.trim(),
      initialPayment
    });

    // 3. Actualizar estado del presupuesto a CONVERTED
    await this.db.query(
      `UPDATE quotes 
       SET status = 'CONVERTED', converted_order_id = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [createdOrder.id, quote.id]
    );

    const updatedQuote = await this.getQuoteById(quote.id);

    return {
      order: createdOrder,
      quote: updatedQuote
    };
  }
}
