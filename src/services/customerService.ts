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

  private inMemoryCustomers: UnifiedCustomerProfile[] = [
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      firstName: 'Martina',
      lastName: 'Gómez',
      phoneWhatsapp: '+5491155439821',
      email: 'martina.gomez@email.com',
      address: 'Av. Corrientes 3421, CABA',
      birthDate: '1992-07-25',
      preferredChannel: AcquisitionChannel.WHATSAPP,
      segment: CustomerSegment.FRECUENTE,
      pointsBalance: 1250,
      equivalentDiscountAmount: 1250,
      isActive: true,
      notes: 'Prefiere entregas los días martes por la tarde. Compradora habitual de avena y leches vegetales.',
      dietaryProfiles: [
        { id: '10000000-0000-0000-0000-000000000001', code: 'VEGAN', name: 'Vegano', badgeColorHex: '#5E7055' },
        { id: '10000000-0000-0000-0000-000000000002', code: 'CELIAC', name: 'Sin TACC / Celíaco', badgeColorHex: '#C87053', specificNotes: 'Diagnóstico celíaco confirmado. Evitar contaminación cruzada.' },
        { id: '10000000-0000-0000-0000-000000000003', code: 'ORGANIC', name: 'Orgánico / Agroecológico', badgeColorHex: '#8B9A46' }
      ],
      purchaseStats: {
        totalOrders: 6,
        totalSpent: 62250,
        averageTicket: 10375,
        lastPurchaseDate: '2026-07-20T14:30:00Z',
        daysSinceLastPurchase: 2,
        purchaseFrequencyDays: 8
      },
      createdAt: '2026-05-10T10:00:00Z',
      updatedAt: '2026-07-20T14:30:00Z'
    },
    {
      id: 'c2000000-0000-0000-0000-000000000002',
      firstName: 'Lucas',
      lastName: 'Benítez',
      phoneWhatsapp: '+5491144321199',
      email: 'lucas.benitez@email.com',
      address: 'Calle Florida 890, CABA',
      birthDate: '1988-11-15',
      preferredChannel: AcquisitionChannel.LOCAL,
      segment: CustomerSegment.VIP,
      pointsBalance: 3400,
      equivalentDiscountAmount: 3400,
      isActive: true,
      notes: 'Cliente VIP de mostrador. Compra grandes volúmenes de frutos secos a granel.',
      dietaryProfiles: [
        { id: '10000000-0000-0000-0000-000000000006', code: 'KETO', name: 'Dieta Keto / Cetogénica', badgeColorHex: '#10B981' }
      ],
      purchaseStats: {
        totalOrders: 15,
        totalSpent: 185000,
        averageTicket: 12333,
        lastPurchaseDate: '2026-07-18T11:20:00Z',
        daysSinceLastPurchase: 4,
        purchaseFrequencyDays: 6
      },
      createdAt: '2026-01-15T09:15:00Z',
      updatedAt: '2026-07-18T11:20:00Z'
    },
    {
      id: 'c3000000-0000-0000-0000-000000000003',
      firstName: 'Camila',
      lastName: 'Sosa',
      phoneWhatsapp: '+5491166778899',
      email: 'camila.sosa@email.com',
      address: 'Av. Cabildo 1540, Belgrano, CABA',
      birthDate: '1995-07-22',
      preferredChannel: AcquisitionChannel.ONLINE_STORE,
      segment: CustomerSegment.OCASIONAL,
      pointsBalance: 450,
      equivalentDiscountAmount: 450,
      isActive: true,
      notes: 'Cumpleaños en el mes corriente.',
      dietaryProfiles: [
        { id: '10000000-0000-0000-0000-000000000004', code: 'DIABETIC', name: 'Apto Diabéticos', badgeColorHex: '#6A5ACD' }
      ],
      purchaseStats: {
        totalOrders: 2,
        totalSpent: 14500,
        averageTicket: 7250,
        lastPurchaseDate: '2026-06-01T16:00:00Z',
        daysSinceLastPurchase: 51,
        purchaseFrequencyDays: 30
      },
      createdAt: '2026-04-01T12:00:00Z',
      updatedAt: '2026-06-01T16:00:00Z'
    }
  ];

  constructor(private db: any) {}

  public async ensureSeedCustomers(): Promise<void> {
    if (this.seeded) return;
    try {
      const checkRes = await this.db.query('SELECT COUNT(*) AS total FROM customers');
      const total = parseInt(checkRes.rows[0]?.total ?? checkRes.rows[0]?.['COUNT(*)'] ?? '0', 10);
      if (total === 0) {
        console.log('🌱 Inicializando clientes base en MySQL...');
        for (const c of this.inMemoryCustomers) {
          try {
            await this.db.query(`
              INSERT INTO customers (
                id, first_name, last_name, phone_whatsapp, email, address, birth_date, preferred_channel, points_balance, notes, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
              ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);
            `, [
              c.id,
              c.firstName,
              c.lastName,
              c.phoneWhatsapp,
              c.email || null,
              c.address || null,
              c.birthDate || null,
              c.preferredChannel,
              c.pointsBalance,
              c.notes || null
            ]);

            if (c.dietaryProfiles && c.dietaryProfiles.length > 0) {
              for (const dp of c.dietaryProfiles) {
                const dpId = dp.id.startsWith('dp-') ? dp.id : (DIETARY_CODE_TO_ID[dp.id] || `dp-${dp.id.slice(-1)}`);
                try {
                  await this.db.query(`
                    INSERT INTO customer_dietary_profiles (customer_id, dietary_profile_id, specific_notes)
                    VALUES ($1, $2, $3)
                    ON DUPLICATE KEY UPDATE specific_notes = VALUES(specific_notes);
                  `, [c.id, dpId, dp.specificNotes || null]);
                } catch {}
              }
            }
          } catch (e: any) {
            console.warn(`Aviso al insertar cliente inicial ${c.firstName}:`, e.message);
          }
        }
        console.log('✅ Clientes base inicializados exitosamente en MySQL.');
      }
      this.seeded = true;
    } catch (err: any) {
      console.warn('⚠️ No se pudo inicializar clientes base en BD:', err?.message || err);
    }
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
          id, first_name, last_name, phone_whatsapp, email, address, birth_date, preferred_channel, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'LOCAL'::acquisition_channel), $9)
        RETURNING id;
      `;

      const customerValues = [
        customerId,
        dto.firstName.trim(),
        dto.lastName.trim(),
        cleanPhone,
        dto.email ? dto.email.trim().toLowerCase() : null,
        dto.address ? dto.address.trim() : null,
        dto.birthDate || null,
        dto.preferredChannel || AcquisitionChannel.LOCAL,
        dto.notes ? dto.notes.trim() : null
      ];

      const customerResult = await client.query(customerInsertQuery, customerValues);
      const insertedId = customerResult.rows[0]?.id || customerId;

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
      console.error('Error al registrar cliente en MySQL, usando fallback:', error);
      // Fallback a almacenamiento en memoria si no hay servidor BD activo o falla la BD
      return this.createCustomerInMemory(dto);
    } finally {
      if (client) {
        try { client.release(); } catch {}
      }
    }
  }

  private createCustomerInMemory(dto: CreateCustomerDTO): UnifiedCustomerProfile {
    const cleanPhone = dto.phoneWhatsapp.trim().replace(/\s+/g, '');
    const duplicate = this.inMemoryCustomers.find(c => c.phoneWhatsapp === cleanPhone);
    if (duplicate) {
      throw new Error(`Ya existe un cliente registrado con el WhatsApp ${cleanPhone}.`);
    }

    const newId = 'c-' + Date.now();
    const dietaryProfiles: DietaryProfileSummary[] = (dto.dietaryProfileIds || []).map(id => ({
      id,
      code: 'CUSTOM_DIET',
      name: 'Preferencia Personalizada',
      badgeColorHex: '#5E7055',
      specificNotes: dto.dietaryNotes ? dto.dietaryNotes[id] : undefined
    }));

    const newCustomer: UnifiedCustomerProfile = {
      id: newId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phoneWhatsapp: cleanPhone,
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      address: dto.address ? dto.address.trim() : undefined,
      birthDate: dto.birthDate || undefined,
      preferredChannel: dto.preferredChannel || AcquisitionChannel.LOCAL,
      segment: CustomerSegment.OCASIONAL,
      pointsBalance: 0,
      equivalentDiscountAmount: 0,
      isActive: true,
      notes: dto.notes ? dto.notes.trim() : undefined,
      dietaryProfiles,
      purchaseStats: {
        totalOrders: 0,
        totalSpent: 0,
        averageTicket: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.inMemoryCustomers.unshift(newCustomer);
    return newCustomer;
  }

  /**
   * Obtiene la Ficha Unificada de Cliente por ID.
   */
  async getUnifiedProfile(customerId: string): Promise<UnifiedCustomerProfile> {
    const customerQuery = `
      SELECT 
        id, first_name, last_name, phone_whatsapp, email, address, 
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
      console.warn('Error al buscar cliente en BD:', err);
    }

    const found = this.inMemoryCustomers.find(c => c.id === customerId);
    if (!found) {
      throw new Error(`Cliente con ID ${customerId} no encontrado.`);
    }
    return found;
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
        sql += ` AND (c.first_name ILIKE $${p1} OR c.last_name ILIKE $${p2} OR c.phone_whatsapp ILIKE $${p3} OR c.email ILIKE $${p4})`;
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
      console.error('Error en searchCustomers DB:', err);
      // Fallback en memoria
    }

    let result = [...this.inMemoryCustomers];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c => 
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.phoneWhatsapp.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }

    if (filters.channel) {
      result = result.filter(c => c.preferredChannel === filters.channel);
    }

    if (filters.isActive !== undefined) {
      result = result.filter(c => c.isActive === filters.isActive);
    }

    if (filters.dietaryProfileId) {
      result = result.filter(c => c.dietaryProfiles.some(dp => dp.id === filters.dietaryProfileId || dp.code === filters.dietaryProfileId));
    }

    return { customers: result, total: result.length };
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
    const address = dto.address !== undefined ? (dto.address ? dto.address.trim() : null) : (existing.address || null);
    const birthDate = dto.birthDate !== undefined ? dto.birthDate : (existing.birthDate || null);
    const preferredChannel = dto.preferredChannel !== undefined ? dto.preferredChannel : existing.preferredChannel;
    const notes = dto.notes !== undefined ? (dto.notes ? dto.notes.trim() : null) : (existing.notes || null);
    const isActive = dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : (existing.isActive ? 1 : 0);

    const query = `
      UPDATE customers
      SET first_name = $1, last_name = $2, phone_whatsapp = $3, email = $4, address = $5,
          birth_date = $6, preferred_channel = $7, notes = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10;
    `;

    try {
      await this.db.query(query, [
        firstName, lastName, phoneWhatsapp, email, address,
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
      console.error('Error al actualizar cliente en MySQL:', error);
      // Fallback
    }

    const index = this.inMemoryCustomers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      this.inMemoryCustomers[index] = {
        ...this.inMemoryCustomers[index],
        firstName,
        lastName,
        phoneWhatsapp,
        email: email || undefined,
        address: address || undefined,
        birthDate: birthDate || undefined,
        preferredChannel,
        notes: notes || undefined,
        isActive: !!isActive,
        updatedAt: new Date().toISOString()
      };
      return this.inMemoryCustomers[index];
    }

    throw new Error(`Cliente con ID ${customerId} no pudo ser actualizado.`);
  }

  /**
   * Desactiva / Elimina a un cliente.
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.db.query(`UPDATE customers SET is_active = 0 WHERE id = $1;`, [customerId]);
    } catch {
      // Fallback
    }

    const index = this.inMemoryCustomers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      this.inMemoryCustomers[index].isActive = false;
    }
  }
}
