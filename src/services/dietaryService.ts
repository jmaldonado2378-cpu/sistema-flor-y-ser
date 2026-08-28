import { DietaryProfile, CreateDietaryProfileDTO, UpdateDietaryProfileDTO, AssignDietaryProfileDTO } from '../types/dietary';

export class DietaryService {
  private inMemoryProfiles: DietaryProfile[] = [
    { id: '10000000-0000-0000-0000-000000000001', code: 'VEGAN', name: 'Vegano', description: 'Sin ingredientes de origen animal', badgeColorHex: '#5E7055', isCustom: false, isActive: true },
    { id: '10000000-0000-0000-0000-000000000002', code: 'CELIAC', name: 'Sin TACC / Celíaco', description: 'Libre de trigo, avena, cebada y centeno', badgeColorHex: '#C87053', isCustom: false, isActive: true },
    { id: '10000000-0000-0000-0000-000000000003', code: 'ORGANIC', name: 'Orgánico / Agroecológico', description: 'Libre de agrotóxicos y fertilizantes sintéticos', badgeColorHex: '#8B9A46', isCustom: false, isActive: true },
    { id: '10000000-0000-0000-0000-000000000004', code: 'DIABETIC', name: 'Apto Diabéticos', description: 'Sin azúcares añadidos ni alto índice glucémico', badgeColorHex: '#6A5ACD', isCustom: false, isActive: true },
    { id: '10000000-0000-0000-0000-000000000005', code: 'NUT_ALLERGY', name: 'Alergia a Frutos Secos', description: 'Libre de frutos secos y maní', badgeColorHex: '#D97706', isCustom: false, isActive: true },
    { id: '10000000-0000-0000-0000-000000000006', code: 'KETO', name: 'Dieta Keto / Cetogénica', description: 'Bajo en carbohidratos, alto en grasas saludables', badgeColorHex: '#10B981', isCustom: true, isActive: true },
    { id: '10000000-0000-0000-0000-000000000007', code: 'FODMAP', name: 'Bajo en FODMAP', description: 'Apto para colon irritable y digestión sensible', badgeColorHex: '#0EA5E9', isCustom: true, isActive: true }
  ];

  constructor(private db: any) {}

  /**
   * Obtiene todos los perfiles dietéticos del catálogo.
   */
  async getAllProfiles(onlyActive: boolean = true): Promise<DietaryProfile[]> {
    const query = `
      SELECT id, code, name, description, badge_color_hex, is_custom, is_active, created_at, updated_at
      FROM dietary_profiles
      ${onlyActive ? 'WHERE is_active = TRUE' : ''}
      ORDER BY is_custom ASC, name ASC;
    `;

    try {
      const res = await this.db.query(query);
      if (res.rows.length > 0) {
        return res.rows.map((row: any) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description || '',
          badgeColorHex: row.badge_color_hex || '#5E7055',
          isCustom: row.is_custom,
          isActive: row.is_active,
          createdAt: row.created_at ? row.created_at.toISOString() : undefined,
          updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined
        }));
      }
    } catch {
      // Fallback en memoria si la BD no está disponible
    }

    return onlyActive ? this.inMemoryProfiles.filter(p => p.isActive) : this.inMemoryProfiles;
  }

  /**
   * Obtiene un perfil dietético por su ID.
   */
  async getProfileById(id: string): Promise<DietaryProfile> {
    const query = `
      SELECT id, code, name, description, badge_color_hex, is_custom, is_active, created_at, updated_at
      FROM dietary_profiles
      WHERE id = $1;
    `;

    try {
      const res = await this.db.query(query, [id]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description || '',
          badgeColorHex: row.badge_color_hex || '#5E7055',
          isCustom: row.is_custom,
          isActive: row.is_active,
          createdAt: row.created_at ? row.created_at.toISOString() : undefined,
          updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined
        };
      }
    } catch {
      // Fallback
    }

    const found = this.inMemoryProfiles.find(p => p.id === id);
    if (!found) {
      throw new Error(`Perfil dietético con ID ${id} no encontrado.`);
    }
    return found;
  }

  /**
   * Crea un nuevo perfil dietético dinámico.
   */
  async createProfile(dto: CreateDietaryProfileDTO): Promise<DietaryProfile> {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('El nombre de la preferencia dietética es obligatorio.');
    }

    const code = (dto.code || dto.name).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const colorHex = dto.badgeColorHex && /^#[0-9A-F]{6}$/i.test(dto.badgeColorHex) ? dto.badgeColorHex : '#5E7055';

    const query = `
      INSERT INTO dietary_profiles (code, name, description, badge_color_hex, is_custom)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, code, name, description, badge_color_hex, is_custom, is_active, created_at, updated_at;
    `;

    try {
      const res = await this.db.query(query, [code, dto.name.trim(), dto.description || null, colorHex]);
      const row = res.rows[0];
      const newProfile: DietaryProfile = {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description || '',
        badgeColorHex: row.badge_color_hex,
        isCustom: row.is_custom,
        isActive: row.is_active,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
      this.inMemoryProfiles.push(newProfile);
      return newProfile;
    } catch (err: any) {
      if (err.code === '23505') {
        throw new Error(`Ya existe un perfil dietético registrado con el código "${code}".`);
      }
    }

    // Fallback si BD falla o no disponible
    const newProfile: DietaryProfile = {
      id: 'diet-' + Date.now(),
      code,
      name: dto.name.trim(),
      description: dto.description || '',
      badgeColorHex: colorHex,
      isCustom: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.inMemoryProfiles.push(newProfile);
    return newProfile;
  }

  /**
   * Actualiza un perfil dietético existente.
   */
  async updateProfile(id: string, dto: UpdateDietaryProfileDTO): Promise<DietaryProfile> {
    const existing = await this.getProfileById(id);

    const updatedName = dto.name !== undefined ? dto.name.trim() : existing.name;
    const updatedDesc = dto.description !== undefined ? dto.description : existing.description;
    const updatedColor = dto.badgeColorHex !== undefined ? dto.badgeColorHex : existing.badgeColorHex;
    const updatedActive = dto.isActive !== undefined ? dto.isActive : existing.isActive;

    const query = `
      UPDATE dietary_profiles
      SET name = $1, description = $2, badge_color_hex = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, code, name, description, badge_color_hex, is_custom, is_active, created_at, updated_at;
    `;

    try {
      const res = await this.db.query(query, [updatedName, updatedDesc || null, updatedColor, updatedActive, id]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description || '',
          badgeColorHex: row.badge_color_hex,
          isCustom: row.is_custom,
          isActive: row.is_active,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      }
    } catch {
      // Fallback
    }

    const index = this.inMemoryProfiles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.inMemoryProfiles[index] = {
        ...this.inMemoryProfiles[index],
        name: updatedName,
        description: updatedDesc,
        badgeColorHex: updatedColor,
        isActive: updatedActive,
        updatedAt: new Date().toISOString()
      };
      return this.inMemoryProfiles[index];
    }

    throw new Error(`No se pudo actualizar el perfil dietético con ID ${id}.`);
  }

  /**
   * Asigna un perfil dietético a un cliente con notas específicas (ej. "Alergias graves a trazas").
   */
  async assignToCustomer(dto: AssignDietaryProfileDTO): Promise<void> {
    const query = `
      INSERT INTO customer_dietary_profiles (customer_id, dietary_profile_id, specific_notes)
      VALUES ($1, $2, $3)
      ON CONFLICT (customer_id, dietary_profile_id)
      DO UPDATE SET specific_notes = EXCLUDED.specific_notes;
    `;

    try {
      await this.db.query(query, [dto.customerId, dto.dietaryProfileId, dto.specificNotes || null]);
    } catch {
      // Manejado vía CustomerService en fallback
    }
  }

  /**
   * Elimina la asociación de un perfil dietético de un cliente.
   */
  async removeFromCustomer(customerId: string, dietaryProfileId: string): Promise<void> {
    const query = `
      DELETE FROM customer_dietary_profiles
      WHERE customer_id = $1 AND dietary_profile_id = $2;
    `;

    try {
      await this.db.query(query, [customerId, dietaryProfileId]);
    } catch {
      // Fallback
    }
  }
}
