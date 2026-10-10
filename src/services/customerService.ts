import { v4 as uuidv4 } from 'uuid';
import {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerFilterDTO,
  UnifiedCustomerProfile,
  CustomerSegment,
  AcquisitionChannel,
  DietaryProfileSummary,
  CustomerPurchaseStats
} from '../types/customer';

const DIETARY_CODE_TO_ID: Record<string, string> = {
  '10000000-0000-0000-0000-000000000001': 'dp-1',
  '10000000-0000-0000-0000-000000000002': 'dp-2',
  '10000000-0000-0000-0000-000000000003': 'dp-3',
  '10000000-0000-0000-0000-000000000004': 'dp-4',
  '10000000-0000-0000-0000-000000000005': 'dp-5',
  '10000000-0000-0000-0000-000000000006': 'dp-6',
  '10000000-0000-0000-0000-000000000007': 'dp-7',
};

function toSafeISOString(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toISOString();
}

function toSafeDateString(val: any): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const str = String(val);
  if (str.includes('T')) return str.split('T')[0];
  return str.substring(0, 10);
}

export class CustomerService {
  private seeded = false;

  constructor(private db: any) {}

  /**
   * Persistencia estricta: ya NO se insertan clientes de ejemplo en la base real.
   * Se mantiene el método por compatibilidad con otros servicios que lo invocan.
   */
  public async ensureSeedCustomers(): Promise<void> {
    this.seeded = true;
  }

  /** Error explícito de persistencia: nunca se simula éxito si MySQL no guardó. */
  private persistenceError(action: string, error: any): Error {
    const detail = error?.sqlMessage || error?.message || 'error desconocido';
    console.error(`❌ [Clientes] Error al ${action} en MySQL:`, detail);
    const err: any = new Error(`No se pudo ${action} en la base de datos: ${detail}`);
    err.statusCode = 503;
    return err;
  }

  /**
   * Determina la segmentación del cliente según su volumen de compra y frecuencia.
   */
  public calculateSegment(totalSpent: number, totalOrders: number): CustomerSegment {
    if (totalSpent >= 150000 || totalOrders >= 12) {
      return CustomerSegment.VIP;
    }
    if (totalSpent >= 80000) {
      return CustomerSegment.MAYORISTA;
    }
    if (totalOrders >= 4) {
      return CustomerSegment.FRECUENTE;
    }
    return CustomerSegment.OCASIONAL;
  }

  /**
   * Crea un nuevo cliente con sus perfiles dietéticos asociados.
   */
  async createCustomer(dto: CreateCustomerDTO): Promise<UnifiedCustomerProfile> {
    if (!dto.firstName || !dto.lastName || !dto.phoneWhatsapp) {
      throw new Error('Nombre, apellido y número de WhatsApp son obligatorios para registrar un cliente.');
    }

    const customerId = uuidv4();
    const cleanPhone = dto.phoneWhatsapp.trim().replace(/\s+/g, '');
    let client: any = null;

    try {
      client = await this.db.connect();
      await client.query('BEGIN');

      const customerInsertQuery = `
        INSERT INTO customers (
          id, first_name, last_name, phone_whatsapp, email, instagram, address, birth_date, preferred_channel, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `;

      const customerValues = [
        customerId,
        dto.firstName.trim(),
        dto.lastName.trim(),
        cleanPhone,
        dto.email ? dto.email.trim().toLowerCase() : null,
        dto.instagram ? dto.instagram.trim() : null,
        dto.address ? dto.address.trim() : null,
        dto.birthDate || null,
        dto.preferredChannel || AcquisitionChannel.LOCAL,
        dto.notes ? dto.notes.trim() : null
      ];

      const customerResult = await client.query(customerInsertQuery, customerValues);
      if (!customerResult || customerResult.rowCount === 0) {
        throw new Error('MySQL no confirmó la inserción del cliente.');
      }
      const insertedId = customerId;

      // Asociar perfiles dietéticos si existen
      if (dto.dietaryProfileIds && dto.dietaryProfileIds.length > 0) {
        for (const rawProfileId of dto.dietaryProfileIds) {
          const specificNotes = dto.dietaryNotes && dto.dietaryNotes[rawProfileId] ? dto.dietaryNotes[rawProfileId] : null;
          const candidateIds = [
            rawProfileId,
            DIETARY_CODE_TO_ID[rawProfileId],
            `dp-${rawProfileId.slice(-1)}`
          ].filter(Boolean);

          for (const pId of candidateIds) {
            try {
              await client.query(
                `INSERT INTO customer_dietary_profiles (customer_id, dietary_profile_id, specific_notes) VALUES ($1, $2, $3)
                 ON DUPLICATE KEY UPDATE specific_notes = VALUES(specific_notes);`,
                [insertedId, pId, specificNotes]
              );
              break;
            } catch {
              // Si falla una opción de clave foránea, continúa con la siguiente
            }
          }
        }
      }

      await client.query('COMMIT');
      return await this.getUnifiedProfile(insertedId);

    } catch (error: any) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch {}
      }
      if (
        error.code === '23505' || 
        error.code === 'ER_DUP_ENTRY' || 
        error.errno === 1062 ||
        (error.message && (error.message.includes('Duplicate entry') || error.message.includes('Ya existe un cliente')))
      ) {
        throw new Error(`Ya existe un cliente registrado con el número de teléfono o correo especificado.`);
      }
      throw this.persistenceError('registrar el cliente', error);
    } finally {
      if (client) {
        try { client.release(); } catch {}
      }
    }
  }

  /**
   * Obtiene la Ficha Unificada de Cliente por ID.
   */
  async getUnifiedProfile(customerId: string): Promise<UnifiedCustomerProfile> {
    const customerQuery = `
      SELECT 
        id, first_name, last_name, phone_whatsapp, email, instagram, address, 
        birth_date, preferred_channel, points_balance, is_active, notes,
        created_at, updated_at
      FROM customers
      WHERE id = $1;
    `;

    try {
      const customerRes = await this.db.query(customerQuery, [customerId]);
      if (customerRes.rows.length > 0) {
        const customer = customerRes.rows[0];

        // Perfiles dietéticos asociados
        let dietaryProfiles: DietaryProfileSummary[] = [];
        try {
          const dietaryQuery = `
            SELECT dp.id, dp.code, dp.name, dp.description, dp.badge_color_hex, cdp.specific_notes
            FROM dietary_profiles dp
            INNER JOIN customer_dietary_profiles cdp ON dp.id = cdp.dietary_profile_id
            WHERE cdp.customer_id = $1;
          `;
          const dietaryRes = await this.db.query(dietaryQuery, [customerId]);

          dietaryProfiles = dietaryRes.rows.map((row: any) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description,
            badgeColorHex: row.badge_color_hex || '#5E7055',
            specificNotes: row.specific_notes
          }));
        } catch (e) {
          console.warn('Error al cargar perfiles dietéticos de cliente:', e);
        }

        // Cálculo de métricas de compra
        let purchaseStats: CustomerPurchaseStats = {
          totalOrders: 0,
          totalSpent: 0,
          averageTicket: 0
        };

        try {
          const statsQuery = `
            SELECT 
              COUNT(id) AS total_orders,
              COALESCE(SUM(total_amount), 0) AS total_spent,
              COALESCE(AVG(total_amount), 0) AS average_ticket,
              MAX(created_at) AS last_purchase_date
            FROM orders
            WHERE customer_id = $1 AND status = 'COMPLETED';
          `;
          const statsRes = await this.db.query(statsQuery, [customerId]);
          if (statsRes.rows.length > 0) {
            const row = statsRes.rows[0];
            const lastDate = row.last_purchase_date ? new Date(row.last_purchase_date) : undefined;
            const daysSince = (lastDate && !isNaN(lastDate.getTime())) 
              ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) 
              : undefined;

            purchaseStats = {
              totalOrders: parseInt(row.total_orders || '0', 10),
              totalSpent: parseFloat(row.total_spent || '0'),
              averageTicket: parseFloat(row.average_ticket || '0'),
              lastPurchaseDate: (lastDate && !isNaN(lastDate.getTime())) ? lastDate.toISOString() : undefined,
              daysSinceLastPurchase: daysSince
            };
          }
        } catch {
          // Ignorar si tabla de órdenes aún no está lista
        }

        const segment = this.calculateSegment(purchaseStats.totalSpent, purchaseStats.totalOrders);
        const points = parseInt(customer.points_balance || '0', 10);

        return {
          id: customer.id,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phoneWhatsapp: customer.phone_whatsapp,
          email: customer.email || undefined,
          instagram: customer.instagram || undefined,
          address: customer.address || undefined,
          birthDate: toSafeDateString(customer.birth_date),
          preferredChannel: customer.preferred_channel || AcquisitionChannel.LOCAL,
          segment,
          pointsBalance: points,
          equivalentDiscountAmount: points,
          isActive: customer.is_active === 1 || customer.is_active === true || customer.is_active === '1',
          notes: customer.notes || undefined,
          dietaryProfiles,
          purchaseStats,
          createdAt: toSafeISOString(customer.created_at),
          updatedAt: toSafeISOString(customer.updated_at)
        };
      }
    } catch (err) {
      throw this.persistenceError('consultar el cliente', err);
    }

    throw new Error(`Cliente con ID ${customerId} no encontrado.`);
  }

  async getById(customerId: string): Promise<UnifiedCustomerProfile> {
    return this.getUnifiedProfile(customerId);
  }

  /**
   * Búsqueda y filtrado de clientes para la tabla / catálogo CRM.
   */
  async searchCustomers(filters: CustomerFilterDTO = {}): Promise<{ customers: UnifiedCustomerProfile[]; total: number }> {
    await this.ensureSeedCustomers();

    try {
      let sql = `
        SELECT c.id
        FROM customers c
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters.search) {
        const pattern = `%${filters.search.trim()}%`;
        const p1 = params.push(pattern);
        const p2 = params.push(pattern);
        const p3 = params.push(pattern);
        const p4 = params.push(pattern);
        const p5 = params.push(pattern);
        sql += ` AND (c.first_name ILIKE $${p1} OR c.last_name ILIKE $${p2} OR c.phone_whatsapp ILIKE $${p3} OR c.email ILIKE $${p4} OR c.instagram ILIKE $${p5})`;
      }

      if (filters.channel) {
        params.push(filters.channel);
        sql += ` AND c.preferred_channel = $${params.length}`;
      }

      if (filters.isActive !== undefined) {
        params.push(filters.isActive ? 1 : 0);
        sql += ` AND c.is_active = $${params.length}`;
      }

      sql += ` ORDER BY c.created_at DESC`;

      const res = await this.db.query(sql, params);
      const profiles = await Promise.all(res.rows.map((r: any) => this.getUnifiedProfile(r.id)));
      return { customers: profiles, total: profiles.length };

    } catch (err) {
      throw this.persistenceError('listar los clientes', err);
    }
  }

  /**
   * Actualiza datos de un cliente existente y sus preferencias dietéticas.
   */
  async updateCustomer(customerId: string, dto: UpdateCustomerDTO): Promise<UnifiedCustomerProfile> {
    const existing = await this.getUnifiedProfile(customerId);

    const firstName = dto.firstName !== undefined ? dto.firstName.trim() : existing.firstName;
    const lastName = dto.lastName !== undefined ? dto.lastName.trim() : existing.lastName;
    const phoneWhatsapp = dto.phoneWhatsapp !== undefined ? dto.phoneWhatsapp.trim().replace(/\s+/g, '') : existing.phoneWhatsapp;
    const email = dto.email !== undefined ? (dto.email ? dto.email.trim().toLowerCase() : null) : (existing.email || null);
    const instagram = dto.instagram !== undefined ? (dto.instagram ? dto.instagram.trim() : null) : (existing.instagram || null);
    const address = dto.address !== undefined ? (dto.address ? dto.address.trim() : null) : (existing.address || null);
    const birthDate = dto.birthDate !== undefined ? dto.birthDate : (existing.birthDate || null);
    const preferredChannel = dto.preferredChannel !== undefined ? dto.preferredChannel : existing.preferredChannel;
    const notes = dto.notes !== undefined ? (dto.notes ? dto.notes.trim() : null) : (existing.notes || null);
    const isActive = dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : (existing.isActive ? 1 : 0);

    const query = `
      UPDATE customers
      SET first_name = $1, last_name = $2, phone_whatsapp = $3, email = $4, instagram = $5, address = $6,
          birth_date = $7, preferred_channel = $8, notes = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11;
    `;

    try {
      await this.db.query(query, [
        firstName, lastName, phoneWhatsapp, email, instagram, address,
        birthDate || null, preferredChannel, notes, isActive, customerId
      ]);

      if (dto.dietaryProfileIds !== undefined) {
        await this.db.query(`DELETE FROM customer_dietary_profiles WHERE customer_id = $1;`, [customerId]);
        for (const rawProfileId of dto.dietaryProfileIds) {
          const specificNotes = dto.dietaryNotes && dto.dietaryNotes[rawProfileId] ? dto.dietaryNotes[rawProfileId] : null;
          const candidateIds = [
            rawProfileId,
            DIETARY_CODE_TO_ID[rawProfileId],
            `dp-${rawProfileId.slice(-1)}`
          ].filter(Boolean);

          for (const pId of candidateIds) {
            try {
              await this.db.query(
                `INSERT INTO customer_dietary_profiles (customer_id, dietary_profile_id, specific_notes) VALUES ($1, $2, $3)
                 ON DUPLICATE KEY UPDATE specific_notes = VALUES(specific_notes);`,
                [customerId, pId, specificNotes]
              );
              break;
            } catch {}
          }
        }
      }

      return await this.getUnifiedProfile(customerId);

    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new Error('Ya existe otro cliente con ese teléfono o correo.');
      }
      throw this.persistenceError('actualizar el cliente', error);
    }
  }

  /**
   * Desactiva / Elimina a un cliente.
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.db.query(`UPDATE customers SET is_active = 0 WHERE id = $1;`, [customerId]);
    } catch (error) {
      throw this.persistenceError('desactivar el cliente', error);
    }
  }
}
