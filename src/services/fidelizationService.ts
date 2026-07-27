import { Pool } from 'pg';
import {
  PointTransactionType,
  PointsHistoryEntry,
  AccumulatePointsDTO,
  RedeemPointsDTO,
  AdjustPointsDTO,
  PointsSummary
} from '../types/fidelization';
import { CustomerService } from './customerService';

export class FidelizationService {
  private inMemoryHistory: PointsHistoryEntry[] = [
    {
      id: 'ph1',
      customerId: 'c1000000-0000-0000-0000-000000000001',
      points: 85,
      transactionType: PointTransactionType.ACCUMULATION,
      description: 'Acumulación por compra de Granola y Harinas ($8,450)',
      createdAt: '2026-07-20T14:30:00Z'
    },
    {
      id: 'ph2',
      customerId: 'c1000000-0000-0000-0000-000000000001',
      points: 123,
      transactionType: PointTransactionType.ACCUMULATION,
      description: 'Acumulación por compra Mostrador ($12,300)',
      createdAt: '2026-07-12T11:15:00Z'
    },
    {
      id: 'ph3',
      customerId: 'c1000000-0000-0000-0000-000000000001',
      points: 1042,
      transactionType: PointTransactionType.ADJUSTMENT,
      description: 'Saldo inicial migración programa fidelidad v2.0',
      createdAt: '2026-05-10T10:00:00Z'
    }
  ];

  constructor(
    private db: Pool,
    private customerService: CustomerService
  ) {}

  /**
   * Tasa de conversión: 1 punto por cada $100 gastados (1%).
   * 1 punto = $1 ARS de descuento.
   */
  public calculatePointsForAmount(amountSpent: number): number {
    if (amountSpent <= 0) return 0;
    return Math.floor(amountSpent / 100);
  }

  /**
   * Acumula puntos en la cuenta del cliente tras realizar una compra.
   */
  async accumulatePoints(dto: AccumulatePointsDTO): Promise<{ pointsEarned: number; newBalance: number }> {
    const pointsEarned = this.calculatePointsForAmount(dto.amountSpent);
    if (pointsEarned <= 0) {
      const customer = await this.customerService.getUnifiedProfile(dto.customerId);
      return { pointsEarned: 0, newBalance: customer.pointsBalance };
    }

    const description = dto.description || `Acumulación por compra de $${dto.amountSpent.toLocaleString()}`;

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE customers SET points_balance = points_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING points_balance;`,
        [pointsEarned, dto.customerId]
      );

      const newBalance = updateRes.rows[0].points_balance;

      await client.query(
        `INSERT INTO customer_points_history (customer_id, points, transaction_type, reference_type, reference_id, description)
         VALUES ($1, $2, 'ACCUMULATION', 'ORDER', $3, $4);`,
        [dto.customerId, pointsEarned, dto.referenceId || null, description]
      );

      await client.query('COMMIT');
      return { pointsEarned, newBalance };

    } catch (error) {
      await client.query('ROLLBACK');
      // Fallback en memoria
      return this.accumulateInMemory(dto.customerId, pointsEarned, description, dto.referenceId);
    } finally {
      client.release();
    }
  }

  private async accumulateInMemory(
    customerId: string,
    pointsEarned: number,
    description: string,
    referenceId?: string
  ): Promise<{ pointsEarned: number; newBalance: number }> {
    const customer = await this.customerService.getUnifiedProfile(customerId);
    const newBalance = customer.pointsBalance + pointsEarned;
    customer.pointsBalance = newBalance;
    customer.equivalentDiscountAmount = newBalance;

    this.inMemoryHistory.unshift({
      id: 'ph-' + Date.now(),
      customerId,
      points: pointsEarned,
      transactionType: PointTransactionType.ACCUMULATION,
      referenceType: 'ORDER',
      referenceId,
      description,
      createdAt: new Date().toISOString()
    });

    return { pointsEarned, newBalance };
  }

  /**
   * Canjea puntos del cliente por descuento monetario.
   */
  async redeemPoints(dto: RedeemPointsDTO): Promise<{ pointsRedeemed: number; discountAmount: number; newBalance: number }> {
    if (dto.pointsToRedeem <= 0) {
      throw new Error('La cantidad de puntos a canjear debe ser mayor a cero.');
    }

    const customer = await this.customerService.getUnifiedProfile(dto.customerId);
    if (customer.pointsBalance < dto.pointsToRedeem) {
      throw new Error(`Saldo insuficiente de puntos. El cliente tiene ${customer.pointsBalance} pts disponibles y se intentó canjear ${dto.pointsToRedeem} pts.`);
    }

    const discountAmount = dto.pointsToRedeem; // 1 punto = $1
    const description = dto.description || `Canje de ${dto.pointsToRedeem} puntos por descuento de $${discountAmount.toLocaleString()}`;

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE customers SET points_balance = points_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING points_balance;`,
        [dto.pointsToRedeem, dto.customerId]
      );

      const newBalance = updateRes.rows[0].points_balance;

      await client.query(
        `INSERT INTO customer_points_history (customer_id, points, transaction_type, reference_type, reference_id, description)
         VALUES ($1, $2, 'REDEMPTION', 'DISCOUNT', $3, $4);`,
        [dto.customerId, -dto.pointsToRedeem, dto.referenceId || null, description]
      );

      await client.query('COMMIT');
      return { pointsRedeemed: dto.pointsToRedeem, discountAmount, newBalance };

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message && error.message.includes('Saldo insuficiente')) {
        throw error;
      }
      // Fallback
      return this.redeemInMemory(dto.customerId, dto.pointsToRedeem, discountAmount, description, dto.referenceId);
    } finally {
      client.release();
    }
  }

  private async redeemInMemory(
    customerId: string,
    pointsToRedeem: number,
    discountAmount: number,
    description: string,
    referenceId?: string
  ): Promise<{ pointsRedeemed: number; discountAmount: number; newBalance: number }> {
    const customer = await this.customerService.getUnifiedProfile(customerId);
    const newBalance = customer.pointsBalance - pointsToRedeem;
    customer.pointsBalance = newBalance;
    customer.equivalentDiscountAmount = newBalance;

    this.inMemoryHistory.unshift({
      id: 'ph-' + Date.now(),
      customerId,
      points: -pointsToRedeem,
      transactionType: PointTransactionType.REDEMPTION,
      referenceType: 'DISCOUNT',
      referenceId,
      description,
      createdAt: new Date().toISOString()
    });

    return { pointsRedeemed: pointsToRedeem, discountAmount, newBalance };
  }

  /**
   * Ajuste manual de puntos (crédito o débito) por parte del operador.
   */
  async adjustPoints(dto: AdjustPointsDTO): Promise<{ newBalance: number }> {
    if (dto.pointsDelta === 0) {
      throw new Error('El valor de ajuste de puntos no puede ser cero.');
    }

    const description = `Ajuste manual de puntos: ${dto.reason.trim()}`;

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE customers SET points_balance = GREATEST(0, points_balance + $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING points_balance;`,
        [dto.pointsDelta, dto.customerId]
      );

      const newBalance = updateRes.rows[0].points_balance;

      await client.query(
        `INSERT INTO customer_points_history (customer_id, points, transaction_type, description)
         VALUES ($1, $2, 'ADJUSTMENT', $3);`,
        [dto.customerId, dto.pointsDelta, description]
      );

      await client.query('COMMIT');
      return { newBalance };

    } catch {
      // Fallback
      const customer = await this.customerService.getUnifiedProfile(dto.customerId);
      const newBalance = Math.max(0, customer.pointsBalance + dto.pointsDelta);
      customer.pointsBalance = newBalance;
      customer.equivalentDiscountAmount = newBalance;

      this.inMemoryHistory.unshift({
        id: 'ph-' + Date.now(),
        customerId: dto.customerId,
        points: dto.pointsDelta,
        transactionType: PointTransactionType.ADJUSTMENT,
        description,
        createdAt: new Date().toISOString()
      });

      return { newBalance };
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene el historial de movimientos de puntos de un cliente.
   */
  async getPointsHistory(customerId: string): Promise<PointsHistoryEntry[]> {
    const query = `
      SELECT id, customer_id, points, transaction_type, reference_type, reference_id, description, created_at
      FROM customer_points_history
      WHERE customer_id = $1
      ORDER BY created_at DESC;
    `;

    try {
      const res = await this.db.query(query, [customerId]);
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          points: row.points,
          transactionType: row.transaction_type,
          referenceType: row.reference_type,
          referenceId: row.reference_id,
          description: row.description,
          createdAt: row.created_at.toISOString()
        }));
      }
    } catch {
      // Fallback
    }

    return this.inMemoryHistory.filter(h => h.customerId === customerId);
  }

  /**
   * Obtiene resumen de fidelidad y valor monetario equivalente.
   */
  async getPointsSummary(customerId: string): Promise<PointsSummary> {
    const customer = await this.customerService.getUnifiedProfile(customerId);
    const history = await this.getPointsHistory(customerId);

    let totalAccumulated = 0;
    let totalRedeemed = 0;

    history.forEach(h => {
      if (h.points > 0) totalAccumulated += h.points;
      if (h.points < 0) totalRedeemed += Math.abs(h.points);
    });

    return {
      customerId,
      pointsBalance: customer.pointsBalance,
      equivalentDiscount: customer.pointsBalance, // 1 punto = $1
      totalAccumulated,
      totalRedeemed
    };
  }
}
