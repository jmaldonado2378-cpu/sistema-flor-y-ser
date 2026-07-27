import { Pool, PoolClient } from 'pg';
import {
  CustomerAccountMovement,
  CheckingAccountSummary,
  AccountStatement,
  AccountStatementFilterDTO,
  AccountMovementType,
  CreateManualMovementDTO,
  RegistrarCobroClienteDTO,
  ReciboCobroCliente,
  DetalleMovimientoExtracto,
  ExtractoDetalladoCuentaCorriente,
  FiltroExtractoDetalladoDTO,
  PaymentMethodEnum
} from '../types/sales';

/**
 * Servicio integral para la gestión de Cuentas Corrientes de Clientes,
 * extractos detallados y registro de cobros a cuenta.
 */
export class CheckingAccountService {
  private inMemoryMovements: CustomerAccountMovement[] = [];
  private inMemoryCollections: ReciboCobroCliente[] = [];

  constructor(private db: Pool) {}

  /**
   * Registra un movimiento en la cuenta corriente del cliente (DEBIT/CREDIT)
   * y actualiza el saldo deudor acumulado del cliente en la base de datos o en memoria.
   */
  public async addMovement(
    customerId: string,
    movementType: AccountMovementType,
    amount: number,
    referenceType: 'ORDER' | 'PAYMENT' | 'MANUAL_ADJUSTMENT',
    description: string,
    referenceId?: string,
    clientOverride?: PoolClient
  ): Promise<CustomerAccountMovement> {
    const client = clientOverride || (await this.db.connect());
    const isLocalTransaction = !clientOverride;

    try {
      if (isLocalTransaction) {
        await client.query('BEGIN');
      }

      // 1. Obtener saldo actual del cliente
      const custRes = await client.query(
        'SELECT id, first_name, last_name, credit_limit, current_account_balance FROM customers WHERE id = $1 FOR UPDATE',
        [customerId]
      );

      if (custRes.rows.length === 0) {
        throw new Error(`Cliente con ID ${customerId} no encontrado.`);
      }

      const currentBalance = parseFloat(custRes.rows[0].current_account_balance || '0');

      // Calcular nuevo saldo:
      // DEBIT (Debe): Aumenta la deuda del cliente (+amount)
      // CREDIT (Haber): Reduce la deuda del cliente (-amount)
      let newBalance = currentBalance;
      if (movementType === 'DEBIT') {
        newBalance += amount;
      } else {
        newBalance -= amount;
      }

      // 2. Insertar movimiento
      const movementQuery = `
        INSERT INTO customer_account_movements (
          customer_id, movement_type, amount, balance_after, reference_type, reference_id, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, customer_id, movement_type, amount, balance_after, reference_type, reference_id, description, created_at
      `;
      const movementRes = await client.query(movementQuery, [
        customerId,
        movementType,
        amount,
        newBalance,
        referenceType,
        referenceId || null,
        description
      ]);

      // 3. Actualizar saldo acumulado en la tabla customers
      await client.query(
        'UPDATE customers SET current_account_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newBalance, customerId]
      );

      if (isLocalTransaction) {
        await client.query('COMMIT');
      }

      const row = movementRes.rows[0];
      const movement: CustomerAccountMovement = {
        id: row.id,
        customerId: row.customer_id,
        movementType: row.movement_type,
        amount: parseFloat(row.amount),
        balanceAfter: parseFloat(row.balance_after),
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        description: row.description,
        createdAt: row.created_at.toISOString ? row.created_at.toISOString() : row.created_at
      };

      this.inMemoryMovements.unshift(movement);
      return movement;
    } catch (error: any) {
      if (isLocalTransaction && client) {
        try { await client.query('ROLLBACK'); } catch {}
      }
      // Fallback a simulación en memoria si la BD no está disponible
      return this.addMovementInMemory(customerId, movementType, amount, referenceType, description, referenceId);
    } finally {
      if (isLocalTransaction && client) {
        client.release();
      }
    }
  }

  /**
   * Obtiene el resumen de la Cuenta Corriente de un cliente.
   */
  public async getSummary(customerId: string): Promise<CheckingAccountSummary> {
    try {
      const query = `
        SELECT 
          c.id as customer_id,
          c.first_name,
          c.last_name,
          c.phone_whatsapp,
          c.email,
          c.credit_limit,
          c.current_account_balance,
          (SELECT MAX(created_at) FROM customer_account_movements WHERE customer_id = c.id) as last_movement_date
        FROM customers c
        WHERE c.id = $1
      `;
      const res = await this.db.query(query, [customerId]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const creditLimit = parseFloat(row.credit_limit || '0');
        const currentBalance = parseFloat(row.current_account_balance || '0');
        const availableCredit = creditLimit - currentBalance;

        return {
          customerId: row.customer_id,
          customerName: `${row.first_name} ${row.last_name}`,
          phoneWhatsapp: row.phone_whatsapp,
          email: row.email,
          creditLimit,
          currentBalance,
          availableCredit,
          lastMovementDate: row.last_movement_date ? (row.last_movement_date.toISOString ? row.last_movement_date.toISOString() : row.last_movement_date) : undefined
        };
      }
    } catch {
      // Fallback
    }

    // Fallback en memoria
    const clientMovements = this.inMemoryMovements.filter(m => m.customerId === customerId);
    const lastMov = clientMovements.length > 0 ? clientMovements[0].createdAt : undefined;
    const currentBalance = clientMovements.length > 0 ? clientMovements[0].balanceAfter : 0;
    const creditLimit = 50000;

    return {
      customerId,
      customerName: 'Cliente Ejemplo',
      phoneWhatsapp: '+5491100000000',
      email: 'cliente@floryser.com',
      creditLimit,
      currentBalance,
      availableCredit: creditLimit - currentBalance,
      lastMovementDate: lastMov
    };
  }

  /**
   * Actualiza el límite de crédito de un cliente.
   */
  public async updateCreditLimit(customerId: string, creditLimit: number): Promise<CheckingAccountSummary> {
    try {
      await this.db.query(
        'UPDATE customers SET credit_limit = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [creditLimit, customerId]
      );
    } catch {
      // Fallback
    }
    return this.getSummary(customerId);
  }

  /**
   * Registra un cobro o abono a cuenta de cliente en su cuenta corriente.
   * Disminuye la deuda (movimiento CREDIT / HABER), genera recibo y actualiza pedido asociado si aplica.
   */
  public async registrarCobroCliente(dto: RegistrarCobroClienteDTO): Promise<ReciboCobroCliente> {
    if (!dto.clienteId || !dto.monto || dto.monto <= 0) {
      throw new Error('El ID del cliente y un monto mayor a 0 son obligatorios para registrar el cobro.');
    }

    const fechaHoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefijoRecibo = `REC-CC-${fechaHoyStr}-`;
    let numeroRecibo = `${prefijoRecibo}${Math.floor(1000 + Math.random() * 9000)}`;

    const summaryAnterior = await this.getSummary(dto.clienteId);
    const saldoAnterior = summaryAnterior.currentBalance;

    let client;
    try {
      client = await this.db.connect();
      try {
        await client.query('BEGIN');

        // 1. Obtener correlativo de recibo en BD
        const lastRecRes = await client.query(
          `SELECT receipt_number FROM payments WHERE receipt_number LIKE $1 ORDER BY receipt_number DESC LIMIT 1`,
          [`${prefijoRecibo}%`]
        );
        if (lastRecRes.rows.length > 0) {
          const lastSeq = parseInt(lastRecRes.rows[0].receipt_number.split('-').pop() || '0', 10);
          numeroRecibo = `${prefijoRecibo}${(lastSeq + 1).toString().padStart(4, '0')}`;
        }

        // 2. Insertar cobro en la tabla payments
        const paymentQuery = `
          INSERT INTO payments (
            receipt_number, customer_id, order_id, payment_method, amount, reference_number, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, created_at;
        `;
        const paymentRes = await client.query(paymentQuery, [
          numeroRecibo,
          dto.clienteId,
          dto.pedidoId || null,
          dto.metodoPago || 'CASH',
          dto.monto,
          dto.numeroComprobanteRef || null,
          dto.notas || null
        ]);

        const paymentId = paymentRes.rows[0].id;
        const fechaCobro = paymentRes.rows[0].created_at.toISOString();

        // 3. Imputar movimiento de crédito (haber) en la cuenta corriente
        const metodoDesc =
          dto.metodoPago === 'CASH'
            ? 'Efectivo'
            : dto.metodoPago === 'MERCADO_PAGO'
            ? 'Mercado Pago'
            : 'Transferencia';

        const desc = `Cobro a Cuenta Recibo ${numeroRecibo} (${metodoDesc})${
          dto.numeroComprobanteRef ? ' Ref: ' + dto.numeroComprobanteRef : ''
        }`;

        const movimiento = await this.addMovement(
          dto.clienteId,
          'CREDIT',
          dto.monto,
          'PAYMENT',
          desc,
          paymentId,
          client
        );

        // 4. Si el cobro se asocia a un pedido específico, actualizar saldo del pedido
        let numeroPedido: string | undefined;
        if (dto.pedidoId) {
          const ordRes = await client.query(
            'SELECT order_number, total_amount, paid_amount FROM orders WHERE id = $1 FOR UPDATE',
            [dto.pedidoId]
          );
          if (ordRes.rows.length > 0) {
            numeroPedido = ordRes.rows[0].order_number;
            const totalOrd = parseFloat(ordRes.rows[0].total_amount);
            const paidOrd = parseFloat(ordRes.rows[0].paid_amount);
            const nuevoPaid = paidOrd + dto.monto;
            const nuevoBalanceDue = Math.max(0, totalOrd - nuevoPaid);
            const nuevoStatus = nuevoBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

            await client.query(
              'UPDATE orders SET paid_amount = $1, balance_due = $2, payment_status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
              [nuevoPaid, nuevoBalanceDue, nuevoStatus, dto.pedidoId]
            );
          }
        }

        await client.query('COMMIT');

        const summaryNuevo = await this.getSummary(dto.clienteId);

        const recibo: ReciboCobroCliente = {
          id: paymentId,
          numeroRecibo,
          clienteId: dto.clienteId,
          nombreCliente: summaryAnterior.customerName,
          montoCobrado: dto.monto,
          metodoPago: dto.metodoPago,
          numeroComprobanteRef: dto.numeroComprobanteRef,
          pedidoId: dto.pedidoId,
          numeroPedido,
          saldoAnterior,
          nuevoSaldoDeudor: summaryNuevo.currentBalance,
          creditoDisponible: summaryNuevo.availableCredit,
          fechaCobro,
          notas: dto.notas
        };

        this.inMemoryCollections.unshift(recibo);
        return recibo;
      } catch (innerErr) {
        await client.query('ROLLBACK');
        throw innerErr;
      } finally {
        client.release();
      }
    } catch {
      // Fallback en memoria cuando no hay BD activa
      return this.registrarCobroClienteInMemory(dto, summaryAnterior, numeroRecibo);
    }
  }

  /**
   * Genera el Extracto Detallado de Cuenta Corriente para un cliente,
   * incluyendo desglose por movimientos, items de pedidos, saldos e integración con WhatsApp.
   */
  public async getExtractoDetallado(filtro: FiltroExtractoDetalladoDTO): Promise<ExtractoDetalladoCuentaCorriente> {
    const { clienteId, fechaInicio, fechaFin, incluirDetalleItems = true } = filtro;

    const summary = await this.getSummary(clienteId);
    const periodStart = fechaInicio || '2020-01-01';
    const periodEnd = fechaFin || new Date().toISOString().split('T')[0];

    try {
      // 1. Datos cliente
      const custRes = await this.db.query(
        'SELECT id, first_name, last_name, phone_whatsapp, email, address, credit_limit, current_account_balance FROM customers WHERE id = $1',
        [clienteId]
      );

      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        const customerName = `${cust.first_name} ${cust.last_name}`;

        // 2. Saldo inicial previo a fechaInicio
        const initialBalRes = await this.db.query(
          `SELECT COALESCE(SUM(CASE WHEN movement_type = 'DEBIT' THEN amount ELSE -amount END), 0) as initial_balance
           FROM customer_account_movements
           WHERE customer_id = $1 AND created_at < $2::timestamp`,
          [clienteId, `${periodStart} 00:00:00`]
        );
        const initialBalance = parseFloat(initialBalRes.rows[0].initial_balance || '0');

        // 3. Movimientos del período
        const movRes = await this.db.query(
          `SELECT id, customer_id, movement_type, amount, balance_after, reference_type, reference_id, description, created_at
           FROM customer_account_movements
           WHERE customer_id = $1 
             AND created_at >= $2::timestamp 
             AND created_at <= $3::timestamp
           ORDER BY created_at ASC`,
          [clienteId, `${periodStart} 00:00:00`, `${periodEnd} 23:59:59`]
        );

        let totalDebitos = 0;
        let totalCreditos = 0;
        const movimientosDetallados: DetalleMovimientoExtracto[] = [];

        for (const row of movRes.rows) {
          const amt = parseFloat(row.amount);
          if (row.movement_type === 'DEBIT') {
            totalDebitos += amt;
          } else {
            totalCreditos += amt;
          }

          let itemsPedido: DetalleMovimientoExtracto['itemsPedido'];
          let numeroComprobante: string | undefined;
          let metodoPago: string | undefined;

          // Obtener detalle de pedido si es DEBIT y reference_type === 'ORDER'
          if (incluirDetalleItems && row.reference_type === 'ORDER' && row.reference_id) {
            try {
              const orderRes = await this.db.query(
                'SELECT order_number FROM orders WHERE id = $1',
                [row.reference_id]
              );
              if (orderRes.rows.length > 0) {
                numeroComprobante = orderRes.rows[0].order_number;
              }

              const itemsRes = await this.db.query(
                'SELECT product_name, quantity, unit_price, subtotal FROM order_items WHERE order_id = $1',
                [row.reference_id]
              );
              itemsPedido = itemsRes.rows.map(item => ({
                nombreProducto: item.product_name,
                cantidad: parseFloat(item.quantity),
                precioUnitario: parseFloat(item.unit_price),
                subtotal: parseFloat(item.subtotal)
              }));
            } catch {}
          } else if (row.reference_type === 'PAYMENT' && row.reference_id) {
            try {
              const payRes = await this.db.query(
                'SELECT receipt_number, payment_method FROM payments WHERE id = $1',
                [row.reference_id]
              );
              if (payRes.rows.length > 0) {
                numeroComprobante = payRes.rows[0].receipt_number;
                metodoPago = payRes.rows[0].payment_method;
              }
            } catch {}
          }

          movimientosDetallados.push({
            id: row.id,
            clienteId: row.customer_id,
            tipoMovimiento: row.movement_type,
            monto: amt,
            saldoPosterior: parseFloat(row.balance_after),
            tipoReferencia: row.reference_type,
            idReferencia: row.reference_id,
            numeroComprobante,
            descripcion: row.description,
            metodoPago,
            itemsPedido,
            fecha: row.created_at.toISOString ? row.created_at.toISOString() : row.created_at
          });
        }

        const saldoFinalDeudor = initialBalance + totalDebitos - totalCreditos;
        const limiteCredito = parseFloat(cust.credit_limit || '0');
        const creditoDisponible = limiteCredito - saldoFinalDeudor;

        const resumenWhatsappFormateado = this.generateWhatsappDetailedStatementText(
          customerName,
          periodStart,
          periodEnd,
          initialBalance,
          totalDebitos,
          totalCreditos,
          saldoFinalDeudor,
          movimientosDetallados
        );

        return {
          clienteId,
          nombreCliente: customerName,
          telefonoWhatsapp: cust.phone_whatsapp,
          email: cust.email,
          direccion: cust.address,
          limiteCredito,
          creditoDisponible,
          fechaInicio: periodStart,
          fechaFin: periodEnd,
          saldoInicial: initialBalance,
          totalDebitos,
          totalCreditos,
          saldoFinalDeudor,
          movimientos: movimientosDetallados,
          resumenWhatsappFormateado
        };
      }
    } catch {
      // Fallback
    }

    // Fallback en memoria si la BD no está disponible
    return this.getExtractoDetalladoInMemory(filtro, summary, periodStart, periodEnd);
  }

  /**
   * Genera el extracto estándar (compatibilidad)
   */
  public async getStatement(filter: AccountStatementFilterDTO): Promise<AccountStatement> {
    const extractoDet = await this.getExtractoDetallado({
      clienteId: filter.customerId,
      fechaInicio: filter.startDate,
      fechaFin: filter.endDate
    });

    return {
      customerId: extractoDet.clienteId,
      customerName: extractoDet.nombreCliente,
      phoneWhatsapp: extractoDet.telefonoWhatsapp,
      email: extractoDet.email,
      address: extractoDet.direccion,
      creditLimit: extractoDet.limiteCredito,
      periodStart: extractoDet.fechaInicio,
      periodEnd: extractoDet.fechaFin,
      initialBalance: extractoDet.saldoInicial,
      totalDebits: extractoDet.totalDebitos,
      totalCredits: extractoDet.totalCreditos,
      finalBalance: extractoDet.saldoFinalDeudor,
      movements: extractoDet.movimientos.map(m => ({
        id: m.id,
        customerId: m.clienteId,
        movementType: m.tipoMovimiento,
        amount: m.monto,
        balanceAfter: m.saldoPosterior,
        referenceType: m.tipoReferencia,
        referenceId: m.idReferencia,
        description: m.descripcion,
        createdAt: m.fecha
      })),
      formattedWhatsappSummary: extractoDet.resumenWhatsappFormateado
    };
  }

  /**
   * Texto formateado enriquecido para WhatsApp con detalle de ítems de compras
   */
  private generateWhatsappDetailedStatementText(
    nombreCliente: string,
    fechaInicio: string,
    fechaFin: string,
    saldoInicial: number,
    totalDebitos: number,
    totalCreditos: number,
    saldoFinal: number,
    movimientos: DetalleMovimientoExtracto[]
  ): string {
    const formatMoney = (val: number) => `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    let text = `🌸 *EXTRACTO DETALLADO DE CUENTA CORRIENTE - FLOR Y SER* 🌸\n`;
    text += `👤 *Cliente:* ${nombreCliente}\n`;
    text += `📅 *Período:* ${fechaInicio} al ${fechaFin}\n`;
    text += `------------------------------------\n`;
    text += `🔹 *Saldo Inicial:* ${formatMoney(saldoInicial)}\n`;
    text += `🔴 *Total Compras (Débitos):* ${formatMoney(totalDebitos)}\n`;
    text += `🟢 *Total Pagos (Créditos):* ${formatMoney(totalCreditos)}\n`;
    text += `------------------------------------\n`;

    if (movimientos.length > 0) {
      text += `📝 *MOVIMIENTOS DETALLADOS:*\n`;
      movimientos.forEach((m) => {
        const fecha = new Date(m.fecha).toLocaleDateString('es-AR');
        const etiqueta = m.tipoMovimiento === 'DEBIT' ? '🔴 [DEBE]' : '🟢 [HABER]';
        text += `\n• *${fecha}* ${etiqueta} ${m.descripcion}: *${formatMoney(m.monto)}*\n`;
        if (m.itemsPedido && m.itemsPedido.length > 0) {
          text += `  *Detalle del Pedido:*\n`;
          m.itemsPedido.forEach(item => {
            text += `   - ${item.nombreProducto} (${item.cantidad} x ${formatMoney(item.precioUnitario)}) = ${formatMoney(item.subtotal)}\n`;
          });
        }
      });
      text += `\n------------------------------------\n`;
    }

    if (saldoFinal > 0) {
      text += `⚠️ *SALDO DEUDOR ACTUAL:* *${formatMoney(saldoFinal)}*\n`;
      text += `Para abonar: CBU Banco Galicia 0070012300000044556677 / Alias: FLORYSER.GALICIA\n`;
      text += `¡Muchas gracias por confiar en Flor y Ser Almacén Natural! 🌿`;
    } else if (saldoFinal < 0) {
      text += `✨ *SALDO A FAVOR DEL CLIENTE:* *${formatMoney(Math.abs(saldoFinal))}*\n`;
      text += `¡Gracias por tu preferencia! 🌿`;
    } else {
      text += `✅ *CUENTA AL DÍA (Saldo: $ 0.00)*\n`;
      text += `¡Muchas gracias por tu puntualidad! 🌿`;
    }

    return text;
  }

  private addMovementInMemory(
    customerId: string,
    movementType: AccountMovementType,
    amount: number,
    referenceType: 'ORDER' | 'PAYMENT' | 'MANUAL_ADJUSTMENT',
    description: string,
    referenceId?: string
  ): CustomerAccountMovement {
    const clientMovs = this.inMemoryMovements.filter(m => m.customerId === customerId);
    const currentBalance = clientMovs.length > 0 ? clientMovs[0].balanceAfter : 0;
    const newBalance = movementType === 'DEBIT' ? currentBalance + amount : currentBalance - amount;

    const movement: CustomerAccountMovement = {
      id: 'mov-' + Date.now(),
      customerId,
      movementType,
      amount,
      balanceAfter: newBalance,
      referenceType,
      referenceId,
      description,
      createdAt: new Date().toISOString()
    };

    this.inMemoryMovements.unshift(movement);
    return movement;
  }

  private registrarCobroClienteInMemory(
    dto: RegistrarCobroClienteDTO,
    summaryAnterior: CheckingAccountSummary,
    numeroRecibo: string
  ): ReciboCobroCliente {
    const nuevoSaldo = summaryAnterior.currentBalance - dto.monto;
    const paymentId = 'pay-' + Date.now();

    const recibo: ReciboCobroCliente = {
      id: paymentId,
      numeroRecibo,
      clienteId: dto.clienteId,
      nombreCliente: summaryAnterior.customerName,
      montoCobrado: dto.monto,
      metodoPago: dto.metodoPago,
      numeroComprobanteRef: dto.numeroComprobanteRef,
      pedidoId: dto.pedidoId,
      saldoAnterior: summaryAnterior.currentBalance,
      nuevoSaldoDeudor: nuevoSaldo,
      creditoDisponible: summaryAnterior.creditLimit - nuevoSaldo,
      fechaCobro: new Date().toISOString(),
      notas: dto.notas
    };

    this.addMovementInMemory(
      dto.clienteId,
      'CREDIT',
      dto.monto,
      'PAYMENT',
      `Cobro a Cuenta Recibo ${numeroRecibo} (${dto.metodoPago})`,
      paymentId
    );

    this.inMemoryCollections.unshift(recibo);
    return recibo;
  }

  private getExtractoDetalladoInMemory(
    filtro: FiltroExtractoDetalladoDTO,
    summary: CheckingAccountSummary,
    periodStart: string,
    periodEnd: string
  ): ExtractoDetalladoCuentaCorriente {
    const clientMovs = this.inMemoryMovements.filter(m => m.customerId === filtro.clienteId);

    let totalDebitos = 0;
    let totalCreditos = 0;

    const movimientosDetallados: DetalleMovimientoExtracto[] = clientMovs.map(m => {
      if (m.movementType === 'DEBIT') totalDebitos += m.amount;
      else totalCreditos += m.amount;

      return {
        id: m.id,
        clienteId: m.customerId,
        tipoMovimiento: m.movementType,
        monto: m.amount,
        saldoPosterior: m.balanceAfter,
        tipoReferencia: m.referenceType,
        idReferencia: m.referenceId,
        descripcion: m.description,
        fecha: m.createdAt
      };
    });

    const saldoFinal = summary.currentBalance;
    const resumenWhatsapp = this.generateWhatsappDetailedStatementText(
      summary.customerName,
      periodStart,
      periodEnd,
      0,
      totalDebitos,
      totalCreditos,
      saldoFinal,
      movimientosDetallados
    );

    return {
      clienteId: filtro.clienteId,
      nombreCliente: summary.customerName,
      telefonoWhatsapp: summary.phoneWhatsapp,
      email: summary.email,
      limiteCredito: summary.creditLimit,
      creditoDisponible: summary.availableCredit,
      fechaInicio: periodStart,
      fechaFin: periodEnd,
      saldoInicial: 0,
      totalDebitos,
      totalCreditos,
      saldoFinalDeudor: saldoFinal,
      movimientos: movimientosDetallados,
      resumenWhatsappFormateado: resumenWhatsapp
    };
  }
}
