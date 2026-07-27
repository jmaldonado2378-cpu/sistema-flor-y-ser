"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawMaterialService = void 0;
// Mock initial data for fallback when DB is not yet populated
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
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'rm-003',
        code: 'MP-HAR-01',
        name: 'Harina de Almendras Fina Granel (Sin TACC)',
        unit: 'KG',
        currentStock: 3.200, // Stock bajo para alerta
        minStock: 5.000,
        costPerUnit: 9800.00,
        supplierName: 'BioNutrient Ltda.',
        storageLocation: 'Depósito B - Contenedor 1',
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
        SELECT id, code, name, unit, current_stock AS "currentStock", min_stock AS "minStock",
               cost_per_unit AS "costPerUnit", supplier_name AS "supplierName",
               storage_location AS "storageLocation", is_active AS "isActive",
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM raw_materials
        WHERE is_active = TRUE
        ORDER BY name ASC;
      `);
            if (res.rows.length > 0) {
                return res.rows.map(row => ({
                    ...row,
                    currentStock: parseFloat(row.currentStock),
                    minStock: parseFloat(row.minStock),
                    costPerUnit: parseFloat(row.costPerUnit)
                }));
            }
        }
        catch {
            // Fallback in-memory
        }
        return this.inMemoryMaterials.filter(m => m.isActive);
    }
    async getById(id) {
        try {
            const res = await this.db.query(`
        SELECT id, code, name, unit, current_stock AS "currentStock", min_stock AS "minStock",
               cost_per_unit AS "costPerUnit", supplier_name AS "supplierName",
               storage_location AS "storageLocation", is_active AS "isActive",
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM raw_materials
        WHERE id = $1;
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
        catch {
            // Fallback
        }
        return this.inMemoryMaterials.find(m => m.id === id) || null;
    }
    async create(dto) {
        try {
            const res = await this.db.query(`
        INSERT INTO raw_materials (code, name, unit, current_stock, min_stock, cost_per_unit, supplier_name, storage_location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, code, name, unit, current_stock AS "currentStock", min_stock AS "minStock",
                  cost_per_unit AS "costPerUnit", supplier_name AS "supplierName",
                  storage_location AS "storageLocation", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
      `, [
                dto.code,
                dto.name,
                dto.unit,
                dto.currentStock,
                dto.minStock ?? 5.0,
                dto.costPerUnit ?? 0.0,
                dto.supplierName || null,
                dto.storageLocation || null
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
            // Fallback in-memory
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
                  storage_location AS "storageLocation", is_active AS "isActive",
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
        catch {
            // Fallback
        }
        const mat = this.inMemoryMaterials.find(m => m.id === id);
        if (mat) {
            mat.currentStock = newStock;
            mat.updatedAt = new Date().toISOString();
            return mat;
        }
        return null;
    }
}
exports.RawMaterialService = RawMaterialService;
