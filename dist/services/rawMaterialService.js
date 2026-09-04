"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawMaterialService = void 0;
const initialRawMaterials = [
    {
        id: 'rm-001',
        code: 'MP-ALM-01',
        name: 'Almendras Peladas Importadas Granel',
        unit: 'KG',
        currentStock: 45.500,
        minStock: 10.000,
        costPerUnit: 8500.00,
        supplierName: 'Frutos del Valle S.A.',
        storageLocation: 'Depósito A - Estante 2',
        familyId: '10000000-0000-0000-0000-000000000010',
        familyName: 'Frutos Secos & Deshidratados',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'rm-002',
        code: 'MP-GRA-01',
        name: 'Granola Miel & Coco Base Granel',
        unit: 'KG',
        currentStock: 80.000,
        minStock: 15.000,
        costPerUnit: 3200.00,
        supplierName: 'El Molino Natural',
        storageLocation: 'Depósito A - Estante 4',
        familyId: '10000000-0000-0000-0000-000000000001',
        familyName: 'Semillas & Granos',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'rm-003',
        code: 'MP-HAR-01',
        name: 'Harina de Almendras Fina Granel (Sin TACC)',
        unit: 'KG',
        currentStock: 3.200,
        minStock: 5.000,
        costPerUnit: 9800.00,
        supplierName: 'BioNutrient Ltda.',
        storageLocation: 'Depósito B - Contenedor 1',
        familyId: '10000000-0000-0000-0000-000000000020',
        familyName: 'Harinas & Almidones',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'rm-004',
        code: 'MP-CHIA-01',
        name: 'Semillas de Chía Orgánicas Granel',
        unit: 'KG',
        currentStock: 25.000,
        minStock: 8.000,
        costPerUnit: 4100.00,
        supplierName: 'Organia Argentina',
        storageLocation: 'Depósito B - Contenedor 3',
        familyId: '10000000-0000-0000-0000-000000000002',
        familyName: 'Chía',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
class RawMaterialService {
    db;
    inMemoryMaterials = [...initialRawMaterials];
    constructor(db) {
        this.db = db;
    }
    async getAll() {
        try {
            const res = await this.db.query(`
        SELECT r.id, r.code, r.name, r.unit, r.current_stock AS "currentStock", r.min_stock AS "minStock",
               r.cost_per_unit AS "costPerUnit", r.supplier_name AS "supplierName",
               r.storage_location AS "storageLocation", r.family_id AS "familyId",
               f.name AS "familyName", r.is_active AS "isActive",
               r.created_at AS "createdAt", r.updated_at AS "updatedAt"
        FROM raw_materials r
        LEFT JOIN article_families f ON r.family_id = f.id
        WHERE r.is_active = TRUE
        ORDER BY r.name ASC;
      `);
            if (res.rows.length > 0) {
                return res.rows.map((row) => ({
                    ...row,
                    currentStock: parseFloat(row.currentStock || 0),
                    minStock: parseFloat(row.minStock || 0),
                    costPerUnit: parseFloat(row.costPerUnit || 0)
                }));
            }
        }
        catch { }
        return this.inMemoryMaterials.filter(m => m.isActive);
    }
    async getById(id) {
        try {
            const res = await this.db.query(`
        SELECT r.id, r.code, r.name, r.unit, r.current_stock AS "currentStock", r.min_stock AS "minStock",
               r.cost_per_unit AS "costPerUnit", r.supplier_name AS "supplierName",
               r.storage_location AS "storageLocation", r.family_id AS "familyId",
               f.name AS "familyName", r.is_active AS "isActive",
               r.created_at AS "createdAt", r.updated_at AS "updatedAt"
        FROM raw_materials r
        LEFT JOIN article_families f ON r.family_id = f.id
        WHERE r.id = $1;
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
    async create(dto) {
        try {
            const res = await this.db.query(`
        INSERT INTO raw_materials (code, name, unit, current_stock, min_stock, cost_per_unit, supplier_name, storage_location, family_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, code, name, unit, current_stock AS "currentStock", min_stock AS "minStock",
                  cost_per_unit AS "costPerUnit", supplier_name AS "supplierName",
                  storage_location AS "storageLocation", family_id AS "familyId", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
      `, [
                dto.code,
                dto.name,
                dto.unit,
                dto.currentStock,
                dto.minStock ?? 5.0,
                dto.costPerUnit ?? 0.0,
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
            const newMaterial = {
                id: 'rm-' + Date.now(),
                code: dto.code,
                name: dto.name,
                unit: dto.unit,
                currentStock: dto.currentStock,
                minStock: dto.minStock ?? 5.0,
                costPerUnit: dto.costPerUnit ?? 0.0,
                supplierName: dto.supplierName,
                storageLocation: dto.storageLocation,
                familyId: dto.familyId,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.inMemoryMaterials.push(newMaterial);
            return newMaterial;
        }
    }
    async updateStock(id, newStock) {
        try {
            const res = await this.db.query(`
        UPDATE raw_materials
        SET current_stock = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, code, name, unit, current_stock AS "currentStock", min_stock AS "minStock",
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
        UPDATE raw_materials
        SET ${updates.join(', ')}
        WHERE id = $${i}
        RETURNING id, code, name, unit, current_stock AS "currentStock", min_stock AS "minStock",
                  cost_per_unit AS "costPerUnit", supplier_name AS "supplierName",
                  storage_location AS "storageLocation", family_id AS "familyId", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
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
    async purgeAll() {
        const count = this.inMemoryMaterials.length;
        this.inMemoryMaterials = [];
        try {
            const res = await this.db.query('DELETE FROM raw_materials');
            return res.rowCount !== undefined ? res.rowCount : count;
        }
        catch {
            return count;
        }
    }
    async bulkImport(items) {
        const imported = [];
        for (const dto of items) {
            try {
                const created = await this.create(dto);
                if (created)
                    imported.push(created);
            }
            catch (e) {
                console.error('Error al importar materia prima:', e);
            }
        }
        return { importedCount: imported.length, items: imported };
    }
}
exports.RawMaterialService = RawMaterialService;
