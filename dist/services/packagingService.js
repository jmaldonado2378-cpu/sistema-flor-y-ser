"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackagingService = void 0;
const initialPackagingCategories = [
    { code: 'DOYPACK', label: 'Bolsa Doypack con Cierre / Válvula', badgeLabel: 'Bolsa Doypack', sortOrder: 1 },
    { code: 'JAR', label: 'Frasco / Envase de Vidrio o Plástico', badgeLabel: 'Frasco Vidrio', sortOrder: 2 },
    { code: 'LABEL', label: 'Etiqueta Autoadhesiva / Térmica', badgeLabel: 'Etiqueta', sortOrder: 3 },
    { code: 'BOX', label: 'Caja de Cartón / Embalaje', badgeLabel: 'Caja Embalaje', sortOrder: 4 },
    { code: 'BAG', label: 'Bolsa de Vacío / Camiseta / Granel', badgeLabel: 'Bolsa', sortOrder: 5 },
    { code: 'OTHER', label: 'Otro Material Operativo', badgeLabel: 'Otro Insumo', sortOrder: 6 },
];
const initialPackagingMaterials = [
    {
        id: 'pkg-001',
        code: 'ENV-DOY-250',
        name: 'Bolsa Doypack Kraft 250g con Cierre Ziploc',
        category: 'DOYPACK',
        unit: 'UN',
        currentStock: 500,
        minStock: 100,
        costPerUnit: 120.00,
        supplierName: 'Empaques EcoSur S.A.',
        storageLocation: 'Depósito C - Estante 1',
        familyId: '30000000-0000-0000-0000-000000000002',
        familyName: 'Bolsas Doypack',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'pkg-002',
        code: 'ENV-DOY-500',
        name: 'Bolsa Doypack Kraft 500g con Válvula',
        category: 'DOYPACK',
        unit: 'UN',
        currentStock: 350,
        minStock: 80,
        costPerUnit: 160.00,
        supplierName: 'Empaques EcoSur S.A.',
        storageLocation: 'Depósito C - Estante 1',
        familyId: '30000000-0000-0000-0000-000000000002',
        familyName: 'Bolsas Doypack',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'pkg-003',
        code: 'ETI-NIM-50',
        name: 'Etiqueta Térmica Autoadhesiva 50x30mm',
        category: 'LABEL',
        unit: 'UN',
        currentStock: 1200,
        minStock: 200,
        costPerUnit: 35.00,
        supplierName: 'Impresiones Gráficas del Centro',
        storageLocation: 'Depósito C - Cajón 3',
        familyId: '30000000-0000-0000-0000-000000000010',
        familyName: 'Etiquetas & Rótulos',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'pkg-004',
        code: 'ENV-FRO-500',
        name: 'Frasco de Vidrio Hexagonal 500g con Tapa Dorado',
        category: 'JAR',
        unit: 'UN',
        currentStock: 180,
        minStock: 50,
        costPerUnit: 350.00,
        supplierName: 'Envases Cristalería Argentina',
        storageLocation: 'Depósito C - Estante 4',
        familyId: '30000000-0000-0000-0000-000000000003',
        familyName: 'Frascos de Vidrio',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'pkg-005',
        code: 'ENV-CAJ-12',
        name: 'Caja de Cartón Corrugado Embalaje (12 unidades)',
        category: 'BOX',
        unit: 'UN',
        currentStock: 80,
        minStock: 20,
        costPerUnit: 280.00,
        supplierName: 'Cartonera Nacional',
        storageLocation: 'Depósito Principal',
        familyId: '30000000-0000-0000-0000-000000000011',
        familyName: 'Embalaje & Transporte',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
class PackagingService {
    db;
    inMemoryMaterials = [...initialPackagingMaterials];
    inMemoryCategories = [...initialPackagingCategories];
    isTableInitialized = false;
    constructor(db) {
        this.db = db;
    }
    async ensureTableExists() {
        if (this.isTableInitialized)
            return;
        try {
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS packaging_materials (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          code VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'DOYPACK',
          unit VARCHAR(20) NOT NULL DEFAULT 'UN',
          current_stock DECIMAL(12,3) NOT NULL DEFAULT 0,
          min_stock DECIMAL(12,3) NOT NULL DEFAULT 10,
          cost_per_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
          supplier_name VARCHAR(255),
          storage_location VARCHAR(255),
          family_id VARCHAR(64),
          is_active TINYINT(1) DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
            try {
                await this.db.query(`ALTER TABLE packaging_materials ADD COLUMN family_id VARCHAR(64);`);
            }
            catch (err) {
                // Ignorar si la columna ya existe
            }
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS packaging_categories (
          code VARCHAR(50) NOT NULL PRIMARY KEY,
          label VARCHAR(150) NOT NULL,
          badge_label VARCHAR(100) NOT NULL,
          sort_order INT DEFAULT 0
        );
      `);
            const catCountRes = await this.db.query(`SELECT COUNT(*) AS cnt FROM packaging_categories`);
            const catCount = parseInt(catCountRes.rows?.[0]?.cnt || '0', 10);
            if (catCount === 0) {
                for (const cat of initialPackagingCategories) {
                    await this.db.query(`INSERT INTO packaging_categories (code, label, badge_label, sort_order) VALUES ($1, $2, $3, $4)`, [cat.code, cat.label, cat.badgeLabel, cat.sortOrder ?? 99]);
                }
            }
            // Normalizar categorías heredadas en packaging_materials (ej. ETIQUETA -> LABEL, BOLSA -> BAG)
            await this.db.query(`UPDATE packaging_materials SET category = 'LABEL' WHERE category IN ('ETIQUETA', 'ETIQUETAS')`);
            await this.db.query(`UPDATE packaging_materials SET category = 'BAG' WHERE category IN ('BOLSA', 'BOLSAS')`);
            this.isTableInitialized = true;
        }
        catch (e) {
            console.error(e);
        }
    }
    async getAll(includeInactive = true) {
        await this.ensureTableExists();
        try {
            const whereClause = includeInactive ? '' : 'WHERE p.is_active = 1';
            const res = await this.db.query(`
        SELECT p.id, p.code, p.name, p.category, p.unit, p.current_stock AS "currentStock", p.min_stock AS "minStock",
               p.cost_per_unit AS "costPerUnit", p.supplier_name AS "supplierName",
               p.storage_location AS "storageLocation", p.family_id AS "familyId",
               f.name AS "familyName", p.is_active AS "isActive",
               p.created_at AS "createdAt", p.updated_at AS "updatedAt"
        FROM packaging_materials p
        LEFT JOIN article_families f ON p.family_id = f.id
        ${whereClause}
        ORDER BY p.name ASC;
      `);
            if (res.rows && res.rows.length > 0) {
                return res.rows.map((row) => ({
                    ...row,
                    isActive: row.isActive === 1 || row.isActive === true || row.isActive === '1' || row.isActive === 'true',
                    currentStock: parseFloat(row.currentStock || 0),
                    minStock: parseFloat(row.minStock || 0),
                    costPerUnit: parseFloat(row.costPerUnit || 0)
                }));
            }
        }
        catch (err) {
            console.warn('⚠️ Error en packagingService.getAll:', err.message);
        }
        return this.inMemoryMaterials.filter(m => includeInactive || m.isActive);
    }
    async create(dto) {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        INSERT INTO packaging_materials (code, name, category, unit, current_stock, min_stock, cost_per_unit, supplier_name, storage_location, family_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, code, name, category, unit, current_stock AS "currentStock", min_stock AS "minStock",
                  cost_per_unit AS "costPerUnit", supplier_name AS "supplierName",
                  storage_location AS "storageLocation", family_id AS "familyId", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
      `, [
                dto.code,
                dto.name,
                dto.category || 'DOYPACK',
                dto.unit || 'UN',
                dto.currentStock,
                dto.minStock ?? 10,
                dto.costPerUnit ?? 0,
                dto.supplierName || null,
                dto.storageLocation || null,
                dto.familyId || null
            ]);
            const row = res.rows[0];
            return {
                ...row,
                currentStock: parseFloat(row.currentStock),
                minStock: parseFloat(row.minStock),
                costPerUnit: parseFloat(row.costPerUnit)
            };
        }
        catch {
            const newItem = {
                id: 'pkg-' + Date.now(),
                code: dto.code,
                name: dto.name,
                category: dto.category || 'DOYPACK',
                unit: dto.unit || 'UN',
                currentStock: dto.currentStock,
                minStock: dto.minStock ?? 10,
                costPerUnit: dto.costPerUnit ?? 0,
                supplierName: dto.supplierName,
                storageLocation: dto.storageLocation,
                familyId: dto.familyId,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.inMemoryMaterials.push(newItem);
            return newItem;
        }
    }
    async updateStock(id, newStock) {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        UPDATE packaging_materials
        SET current_stock = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, code, name, category, unit, current_stock AS "currentStock", min_stock AS "minStock",
                  cost_per_unit AS "costPerUnit", supplier_name AS "supplierName",
                  storage_location AS "storageLocation", family_id AS "familyId", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
      `, [newStock, id]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                return {
                    ...row,
                    currentStock: parseFloat(row.currentStock),
                    minStock: parseFloat(row.minStock),
                    costPerUnit: parseFloat(row.costPerUnit)
                };
            }
        }
        catch { }
        const mat = this.inMemoryMaterials.find(m => m.id === id);
        if (mat) {
            mat.currentStock = newStock;
            mat.updatedAt = new Date().toISOString();
            return mat;
        }
        return null;
    }
    async update(id, dto) {
        await this.ensureTableExists();
        try {
            const updates = [];
            const values = [];
            let i = 1;
            if (dto.code !== undefined) {
                updates.push(`code = $${i++}`);
                values.push(dto.code);
            }
            if (dto.name !== undefined) {
                updates.push(`name = $${i++}`);
                values.push(dto.name);
            }
            if (dto.category !== undefined) {
                updates.push(`category = $${i++}`);
                values.push(dto.category);
            }
            if (dto.unit !== undefined) {
                updates.push(`unit = $${i++}`);
                values.push(dto.unit);
            }
            if (dto.currentStock !== undefined) {
                updates.push(`current_stock = $${i++}`);
                values.push(dto.currentStock);
            }
            if (dto.minStock !== undefined) {
                updates.push(`min_stock = $${i++}`);
                values.push(dto.minStock);
            }
            if (dto.costPerUnit !== undefined) {
                updates.push(`cost_per_unit = $${i++}`);
                values.push(dto.costPerUnit);
            }
            if (dto.supplierName !== undefined) {
                updates.push(`supplier_name = $${i++}`);
                values.push(dto.supplierName);
            }
            if (dto.storageLocation !== undefined) {
                updates.push(`storage_location = $${i++}`);
                values.push(dto.storageLocation);
            }
            if (dto.familyId !== undefined) {
                updates.push(`family_id = $${i++}`);
                values.push(dto.familyId || null);
            }
            if (dto.isActive !== undefined) {
                updates.push(`is_active = $${i++}`);
                values.push(dto.isActive);
            }
            if (updates.length === 0)
                return this.getById(id);
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            const res = await this.db.query(`
        UPDATE packaging_materials
        SET ${updates.join(', ')}
        WHERE id = $${i}
        RETURNING id;
      `, values);
            if (res.rows.length > 0)
                return this.getById(id);
        }
        catch { }
        const index = this.inMemoryMaterials.findIndex(m => m.id === id);
        if (index !== -1) {
            this.inMemoryMaterials[index] = {
                ...this.inMemoryMaterials[index],
                ...dto,
                updatedAt: new Date().toISOString()
            };
            return this.inMemoryMaterials[index];
        }
        return null;
    }
    async getById(id) {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        SELECT p.id, p.code, p.name, p.category, p.unit, p.current_stock AS "currentStock", p.min_stock AS "minStock",
               p.cost_per_unit AS "costPerUnit", p.supplier_name AS "supplierName",
               p.storage_location AS "storageLocation", p.family_id AS "familyId",
               f.name AS "familyName", p.is_active AS "isActive",
               p.created_at AS "createdAt", p.updated_at AS "updatedAt"
        FROM packaging_materials p
        LEFT JOIN article_families f ON p.family_id = f.id
        WHERE p.id = $1;
      `, [id]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                return {
                    ...row,
                    currentStock: parseFloat(row.currentStock),
                    minStock: parseFloat(row.minStock),
                    costPerUnit: parseFloat(row.costPerUnit)
                };
            }
        }
        catch { }
        return this.inMemoryMaterials.find(m => m.id === id) || null;
    }
    async delete(id) {
        await this.ensureTableExists();
        try {
            await this.db.query('DELETE FROM packaging_materials WHERE id = $1', [id]);
            this.inMemoryMaterials = this.inMemoryMaterials.filter(m => m.id !== id);
            return { success: true };
        }
        catch (err) {
            if (err.message && (err.message.includes('foreign key') || err.message.includes('a foreign key constraint fails'))) {
                return {
                    success: false,
                    message: 'No se puede eliminar porque está referenciado en el sistema. Se recomienda suspenderlo.'
                };
            }
            throw err;
        }
    }
    async toggleStatus(id, newStatus) {
        await this.ensureTableExists();
        try {
            const mat = await this.getById(id);
            if (!mat)
                return null;
            const targetStatus = newStatus !== undefined ? newStatus : !mat.isActive;
            await this.db.query('UPDATE packaging_materials SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [targetStatus ? 1 : 0, id]);
            return await this.getById(id);
        }
        catch (err) {
            console.warn('⚠️ Error en packagingService.toggleStatus:', err.message);
            const mat = this.inMemoryMaterials.find(m => m.id === id);
            if (mat) {
                mat.isActive = newStatus !== undefined ? newStatus : !mat.isActive;
                mat.updatedAt = new Date().toISOString();
                return mat;
            }
            return null;
        }
    }
    async getCategories() {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        SELECT code, label, badge_label AS "badgeLabel", sort_order AS "sortOrder"
        FROM packaging_categories
        ORDER BY sort_order ASC, label ASC;
      `);
            if (res.rows && res.rows.length > 0) {
                return res.rows;
            }
        }
        catch (err) {
            console.warn('⚠️ Error en packagingService.getCategories:', err.message);
        }
        return this.inMemoryCategories;
    }
    async saveCategory(dto) {
        await this.ensureTableExists();
        const rawLabel = (dto.label || '').trim();
        if (!rawLabel)
            throw new Error('El nombre de la categoría es requerido');
        const code = (dto.code && dto.code.trim())
            ? dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
            : rawLabel
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 40) || `CAT_${Date.now()}`;
        const badgeLabel = (dto.badgeLabel && dto.badgeLabel.trim())
            ? dto.badgeLabel.trim()
            : rawLabel.split('/')[0].trim().slice(0, 40);
        try {
            const existing = await this.db.query(`SELECT code FROM packaging_categories WHERE code = $1`, [code]);
            if (existing.rows && existing.rows.length > 0) {
                await this.db.query(`UPDATE packaging_categories SET label = $1, badge_label = $2 WHERE code = $3`, [rawLabel, badgeLabel, code]);
            }
            else {
                const maxOrderRes = await this.db.query(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder FROM packaging_categories`);
                const nextOrder = dto.sortOrder ?? parseInt(maxOrderRes.rows?.[0]?.nextOrder || '10', 10);
                await this.db.query(`INSERT INTO packaging_categories (code, label, badge_label, sort_order) VALUES ($1, $2, $3, $4)`, [code, rawLabel, badgeLabel, nextOrder]);
            }
        }
        catch (err) {
            console.warn('⚠️ Error guardando categoría en DB, usando memoria:', err.message);
        }
        const idx = this.inMemoryCategories.findIndex(c => c.code === code);
        if (idx !== -1) {
            this.inMemoryCategories[idx] = { ...this.inMemoryCategories[idx], label: rawLabel, badgeLabel };
        }
        else {
            this.inMemoryCategories.push({ code, label: rawLabel, badgeLabel, sortOrder: this.inMemoryCategories.length + 1 });
        }
        return await this.getCategories();
    }
    async deleteCategory(code) {
        await this.ensureTableExists();
        const cleanCode = (code || '').trim().toUpperCase();
        try {
            await this.db.query(`UPDATE packaging_materials SET category = 'OTHER' WHERE category = $1`, [cleanCode]);
            await this.db.query(`DELETE FROM packaging_categories WHERE code = $1`, [cleanCode]);
        }
        catch (err) {
            console.warn('⚠️ Error eliminando categoría en DB:', err.message);
        }
        this.inMemoryCategories = this.inMemoryCategories.filter(c => c.code !== cleanCode);
        this.inMemoryMaterials = this.inMemoryMaterials.map(m => m.category === cleanCode ? { ...m, category: 'OTHER' } : m);
        return await this.getCategories();
    }
}
exports.PackagingService = PackagingService;
