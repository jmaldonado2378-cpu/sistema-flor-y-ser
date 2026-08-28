"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackagingService = void 0;
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
            this.isTableInitialized = true;
        }
        catch (e) {
            console.error(e);
        }
    }
    async getAll() {
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
        WHERE p.is_active = TRUE
        ORDER BY p.name ASC;
      `);
            if (res.rows.length > 0) {
                return res.rows.map((row) => ({
                    ...row,
                    currentStock: parseFloat(row.currentStock),
                    minStock: parseFloat(row.minStock),
                    costPerUnit: parseFloat(row.costPerUnit)
                }));
            }
        }
        catch { }
        return this.inMemoryMaterials.filter(m => m.isActive);
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
}
exports.PackagingService = PackagingService;
