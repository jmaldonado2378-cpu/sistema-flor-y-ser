"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalProductService = void 0;
const initialFinalProducts = [
    {
        id: 'fp-001',
        rawMaterialId: 'rm-001',
        rawMaterialName: 'Almendras Peladas Importadas Granel',
        code: 'PF-ALM-250',
        barcode: '7791234567891',
        name: 'Almendras Peladas Selección 250g',
        unitWeightGrams: 250,
        netContentLabel: '250g',
        currentStock: 48,
        minStock: 15,
        price: 3400.00,
        ingredients: '100% Almendras peladas sin sal agregada',
        dietaryBadgeCodes: ['VEGAN', 'CELIAC', 'KETO'],
        defaultExpirationDays: 180,
        familyId: '20000000-0000-0000-0000-000000000002',
        familyName: 'Presentación 250g',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'fp-002',
        rawMaterialId: 'rm-001',
        rawMaterialName: 'Almendras Peladas Importadas Granel',
        code: 'PF-ALM-500',
        barcode: '7791234567892',
        name: 'Almendras Peladas Selección 500g',
        unitWeightGrams: 500,
        netContentLabel: '500g',
        currentStock: 22,
        minStock: 10,
        price: 6500.00,
        ingredients: '100% Almendras peladas sin sal agregada',
        dietaryBadgeCodes: ['VEGAN', 'CELIAC', 'KETO'],
        defaultExpirationDays: 180,
        familyId: '20000000-0000-0000-0000-000000000003',
        familyName: 'Presentación 500g',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'fp-003',
        rawMaterialId: 'rm-002',
        rawMaterialName: 'Granola Miel & Coco Base Granel',
        code: 'PF-GRA-500',
        barcode: '7791234567893',
        name: 'Granola Artesanal Coco & Almendras 500g',
        unitWeightGrams: 500,
        netContentLabel: '500g',
        currentStock: 35,
        minStock: 12,
        price: 2800.00,
        ingredients: 'Avena arrollada, miel orgánica, escamas de coco, almendras, semillas de girasol',
        dietaryBadgeCodes: ['ORGANIC'],
        defaultExpirationDays: 120,
        familyId: '20000000-0000-0000-0000-000000000011',
        familyName: 'Granolas & Cereales',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'fp-004',
        rawMaterialId: 'rm-003',
        rawMaterialName: 'Harina de Almendras Fina Granel (Sin TACC)',
        code: 'PF-HAR-250',
        barcode: '7791234567894',
        name: 'Harina de Almendras Ultra Fina 250g',
        unitWeightGrams: 250,
        netContentLabel: '250g',
        currentStock: 4,
        minStock: 10,
        price: 3900.00,
        ingredients: '100% Almendras molidas libres de gluten',
        dietaryBadgeCodes: ['VEGAN', 'CELIAC', 'KETO'],
        defaultExpirationDays: 150,
        familyId: '20000000-0000-0000-0000-000000000002',
        familyName: 'Presentación 250g',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
const parseJsonArray = (val) => {
    if (!val)
        return [];
    if (Array.isArray(val))
        return val;
    if (typeof val === 'object')
        return [val];
    try {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
};
const inferUnitFromLabel = (unit, label) => {
    if (unit && unit.trim()) {
        const u = unit.trim().toUpperCase();
        if (u === 'G' || u === 'GR')
            return 'GRS';
        if (u === 'UN')
            return 'UND';
        if (u === 'L')
            return 'LTS';
        return u;
    }
    if (label) {
        const l = label.toLowerCase();
        if (l.includes('cm3') || l.includes('cc'))
            return 'CM3';
        if (l.includes('ml'))
            return 'ML';
        if (l.includes('lts') || l.includes('lt'))
            return 'LTS';
        if (l.includes('kg'))
            return 'KG';
        if (l.includes('und') || l.includes('un'))
            return 'UND';
    }
    return 'GRS';
};
const formatNetContent = (amount, unit, existingLabel) => {
    const unitSuffixMap = {
        GRS: 'grs', GR: 'grs', G: 'grs',
        KG: 'kg',
        ML: 'ml',
        CM3: 'cm3',
        LTS: 'lts', L: 'lts',
        UND: 'und', UN: 'und'
    };
    const suffix = unitSuffixMap[unit.toUpperCase()] || unit.toLowerCase();
    if (amount > 0) {
        return `${amount} ${suffix}`;
    }
    return existingLabel || `${amount} ${suffix}`;
};
class FinalProductService {
    db;
    inMemoryProducts = [...initialFinalProducts];
    constructor(db) {
        this.db = db;
    }
    async getAll(includeInactive = true) {
        try {
            const whereClause = includeInactive ? '' : 'WHERE fp.is_active = 1';
            const res = await this.db.query(`
        SELECT fp.id, fp.raw_material_id AS "rawMaterialId", rm.name AS "rawMaterialName",
               fp.code, fp.barcode, fp.name, fp.unit_weight_grams AS "unitWeightGrams",
               fp.unit, fp.net_content_label AS "netContentLabel", fp.current_stock AS "currentStock",
               fp.min_stock AS "minStock", fp.cost_price AS "costPrice", fp.price, fp.ingredients,
               fp.dietary_badge_codes AS "dietaryBadgeCodes",
               fp.default_expiration_days AS "defaultExpirationDays",
               fp.family_id AS "familyId", f.name AS "familyName",
               fp.is_blend AS "isBlend", fp.is_resale AS "isResale", fp.supplier_name AS "supplierName",
               fp.ingredients_json AS "ingredientsList",
               fp.is_active AS "isActive", fp.created_at AS "createdAt", fp.updated_at AS "updatedAt"
        FROM final_products fp
        LEFT JOIN raw_materials rm ON fp.raw_material_id = rm.id
        LEFT JOIN article_families f ON fp.family_id = f.id
        ${whereClause}
        ORDER BY fp.name ASC;
      `);
            if (res.rows && res.rows.length > 0) {
                return res.rows.map((row) => {
                    const unitWeightGrams = parseFloat(row.unitWeightGrams || 0);
                    const resolvedUnit = inferUnitFromLabel(row.unit, row.netContentLabel);
                    const netContentLabel = formatNetContent(unitWeightGrams, resolvedUnit, row.netContentLabel);
                    return {
                        ...row,
                        unit: resolvedUnit,
                        isActive: row.isActive === 1 || row.isActive === true || row.isActive === '1' || row.isActive === 'true',
                        isBlend: row.isBlend === 1 || row.isBlend === true || row.isBlend === '1' || row.isBlend === 'true',
                        isResale: row.isResale === 1 || row.isResale === true || row.isResale === '1' || row.isResale === 'true',
                        unitWeightGrams,
                        netContentLabel,
                        currentStock: parseFloat(row.currentStock || 0),
                        minStock: parseFloat(row.minStock || 0),
                        costPrice: parseFloat(row.costPrice || 0),
                        price: parseFloat(row.price || 0),
                        dietaryBadgeCodes: parseJsonArray(row.dietaryBadgeCodes),
                        ingredientsList: parseJsonArray(row.ingredientsList)
                    };
                });
            }
        }
        catch (err) {
            console.warn('⚠️ Error en finalProductService.getAll:', err.message);
        }
        return this.inMemoryProducts.filter(p => includeInactive || p.isActive);
    }
    async getById(id) {
        try {
            const res = await this.db.query(`
        SELECT fp.id, fp.raw_material_id AS "rawMaterialId", rm.name AS "rawMaterialName",
               fp.code, fp.barcode, fp.name, fp.unit_weight_grams AS "unitWeightGrams",
               fp.unit, fp.net_content_label AS "netContentLabel", fp.current_stock AS "currentStock",
               fp.min_stock AS "minStock", fp.cost_price AS "costPrice", fp.price, fp.ingredients,
               fp.dietary_badge_codes AS "dietaryBadgeCodes",
               fp.default_expiration_days AS "defaultExpirationDays",
               fp.family_id AS "familyId", f.name AS "familyName",
               fp.is_blend AS "isBlend", fp.is_resale AS "isResale", fp.supplier_name AS "supplierName",
               fp.ingredients_json AS "ingredientsList",
               fp.is_active AS "isActive", fp.created_at AS "createdAt", fp.updated_at AS "updatedAt"
        FROM final_products fp
        LEFT JOIN raw_materials rm ON fp.raw_material_id = rm.id
        LEFT JOIN article_families f ON fp.family_id = f.id
        WHERE fp.id = $1;
      `, [id]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                const unitWeightGrams = parseFloat(row.unitWeightGrams || 0);
                const resolvedUnit = inferUnitFromLabel(row.unit, row.netContentLabel);
                const netContentLabel = formatNetContent(unitWeightGrams, resolvedUnit, row.netContentLabel);
                return {
                    ...row,
                    unit: resolvedUnit,
                    isActive: row.isActive === 1 || row.isActive === true || row.isActive === '1' || row.isActive === 'true',
                    isBlend: row.isBlend === 1 || row.isBlend === true || row.isBlend === '1' || row.isBlend === 'true',
                    isResale: row.isResale === 1 || row.isResale === true || row.isResale === '1' || row.isResale === 'true',
                    unitWeightGrams,
                    netContentLabel,
                    currentStock: parseFloat(row.currentStock || 0),
                    minStock: parseFloat(row.minStock || 0),
                    costPrice: parseFloat(row.costPrice || 0),
                    price: parseFloat(row.price || 0),
                    dietaryBadgeCodes: parseJsonArray(row.dietaryBadgeCodes),
                    ingredientsList: parseJsonArray(row.ingredientsList)
                };
            }
        }
        catch { }
        return this.inMemoryProducts.find(p => p.id === id) || null;
    }
    async create(dto) {
        const generatedBarcode = dto.barcode || '779' + Math.floor(1000000000 + Math.random() * 9000000000);
        const resolvedUnit = inferUnitFromLabel(dto.unit, dto.netContentLabel);
        const resolvedNetLabel = formatNetContent(dto.unitWeightGrams, resolvedUnit, dto.netContentLabel);
        try {
            const res = await this.db.query(`
        INSERT INTO final_products (
          raw_material_id, code, barcode, name, unit_weight_grams, unit, net_content_label,
          current_stock, min_stock, cost_price, price, ingredients, dietary_badge_codes,
          default_expiration_days, family_id, is_blend, is_resale, supplier_name, ingredients_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18, $19::jsonb)
        RETURNING id, raw_material_id AS "rawMaterialId", code, barcode, name, unit_weight_grams AS "unitWeightGrams",
                  unit, net_content_label AS "netContentLabel", current_stock AS "currentStock",
                  min_stock AS "minStock", cost_price AS "costPrice", price, ingredients,
                  dietary_badge_codes AS "dietaryBadgeCodes",
                  default_expiration_days AS "defaultExpirationDays", family_id AS "familyId",
                  is_blend AS "isBlend", is_resale AS "isResale", supplier_name AS "supplierName",
                  ingredients_json AS "ingredientsList", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
      `, [
                dto.isResale ? null : (dto.rawMaterialId || null),
                dto.code,
                generatedBarcode,
                dto.name,
                dto.unitWeightGrams,
                resolvedUnit,
                resolvedNetLabel,
                dto.currentStock,
                dto.minStock ?? 10,
                dto.costPrice ?? 0,
                dto.price ?? 0,
                dto.ingredients || null,
                JSON.stringify(dto.dietaryBadgeCodes || []),
                dto.defaultExpirationDays ?? 180,
                dto.familyId || null,
                dto.isResale ? false : (dto.isBlend ?? false),
                dto.isResale ?? false,
                dto.supplierName || null,
                JSON.stringify(dto.isResale ? [] : (dto.ingredientsList || []))
            ]);
            const row = res.rows[0];
            return {
                ...row,
                unit: inferUnitFromLabel(row.unit, row.netContentLabel),
                isActive: row.isActive === 1 || row.isActive === true || row.isActive === '1' || row.isActive === 'true',
                isBlend: row.isBlend === 1 || row.isBlend === true || row.isBlend === '1' || row.isBlend === 'true',
                isResale: row.isResale === 1 || row.isResale === true || row.isResale === '1' || row.isResale === 'true',
                unitWeightGrams: parseFloat(row.unitWeightGrams),
                costPrice: parseFloat(row.costPrice || 0),
                price: parseFloat(row.price),
                dietaryBadgeCodes: Array.isArray(row.dietaryBadgeCodes) ? row.dietaryBadgeCodes : JSON.parse(row.dietaryBadgeCodes || '[]'),
                ingredientsList: Array.isArray(row.ingredientsList) ? row.ingredientsList : JSON.parse(row.ingredientsList || '[]')
            };
        }
        catch {
            const newProduct = {
                id: 'fp-' + Date.now(),
                rawMaterialId: dto.isResale ? undefined : dto.rawMaterialId,
                code: dto.code,
                barcode: generatedBarcode,
                name: dto.name,
                unitWeightGrams: dto.unitWeightGrams,
                unit: resolvedUnit,
                netContentLabel: resolvedNetLabel,
                currentStock: dto.currentStock,
                minStock: dto.minStock ?? 10,
                costPrice: dto.costPrice ?? 0,
                price: dto.price,
                ingredients: dto.ingredients,
                dietaryBadgeCodes: dto.dietaryBadgeCodes || [],
                defaultExpirationDays: dto.defaultExpirationDays ?? 180,
                familyId: dto.familyId,
                isBlend: dto.isResale ? false : (dto.isBlend ?? false),
                isResale: dto.isResale ?? false,
                supplierName: dto.supplierName,
                ingredientsList: dto.isResale ? [] : (dto.ingredientsList || []),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.inMemoryProducts.push(newProduct);
            return newProduct;
        }
    }
    async updateStock(id, newStock) {
        try {
            const res = await this.db.query(`
        UPDATE final_products
        SET current_stock = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, raw_material_id AS "rawMaterialId", code, barcode, name, unit_weight_grams AS "unitWeightGrams",
                  net_content_label AS "netContentLabel", current_stock AS "currentStock",
                  min_stock AS "minStock", price, ingredients, dietary_badge_codes AS "dietaryBadgeCodes",
                  default_expiration_days AS "defaultExpirationDays", family_id AS "familyId", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
      `, [newStock, id]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                return {
                    ...row,
                    unitWeightGrams: parseFloat(row.unitWeightGrams),
                    price: parseFloat(row.price),
                    dietaryBadgeCodes: Array.isArray(row.dietaryBadgeCodes) ? row.dietaryBadgeCodes : JSON.parse(row.dietaryBadgeCodes || '[]')
                };
            }
        }
        catch { }
        const prod = this.inMemoryProducts.find(p => p.id === id);
        if (prod) {
            prod.currentStock = newStock;
            prod.updatedAt = new Date().toISOString();
            return prod;
        }
        return null;
    }
    async update(id, dto) {
        try {
            const updates = [];
            const values = [];
            let i = 1;
            if (dto.rawMaterialId !== undefined) {
                updates.push(`raw_material_id = $${i++}`);
                values.push(dto.isResale ? null : (dto.rawMaterialId || null));
            }
            if (dto.code !== undefined) {
                updates.push(`code = $${i++}`);
                values.push(dto.code);
            }
            if (dto.barcode !== undefined) {
                updates.push(`barcode = $${i++}`);
                values.push(dto.barcode);
            }
            if (dto.name !== undefined) {
                updates.push(`name = $${i++}`);
                values.push(dto.name);
            }
            if (dto.unit !== undefined) {
                updates.push(`unit = $${i++}`);
                values.push(inferUnitFromLabel(dto.unit, dto.netContentLabel));
            }
            if (dto.unitWeightGrams !== undefined) {
                updates.push(`unit_weight_grams = $${i++}`);
                values.push(dto.unitWeightGrams);
                const targetUnit = inferUnitFromLabel(dto.unit, dto.netContentLabel);
                dto.netContentLabel = formatNetContent(Number(dto.unitWeightGrams), targetUnit, dto.netContentLabel);
            }
            if (dto.netContentLabel !== undefined) {
                updates.push(`net_content_label = $${i++}`);
                values.push(dto.netContentLabel);
            }
            if (dto.currentStock !== undefined) {
                updates.push(`current_stock = $${i++}`);
                values.push(dto.currentStock);
            }
            if (dto.minStock !== undefined) {
                updates.push(`min_stock = $${i++}`);
                values.push(dto.minStock);
            }
            if (dto.costPrice !== undefined) {
                updates.push(`cost_price = $${i++}`);
                values.push(dto.costPrice);
            }
            if (dto.price !== undefined) {
                updates.push(`price = $${i++}`);
                values.push(dto.price);
            }
            if (dto.ingredients !== undefined) {
                updates.push(`ingredients = $${i++}`);
                values.push(dto.ingredients);
            }
            if (dto.dietaryBadgeCodes !== undefined) {
                updates.push(`dietary_badge_codes = $${i++}::jsonb`);
                values.push(JSON.stringify(dto.dietaryBadgeCodes));
            }
            if (dto.defaultExpirationDays !== undefined) {
                updates.push(`default_expiration_days = $${i++}`);
                values.push(dto.defaultExpirationDays);
            }
            if (dto.familyId !== undefined) {
                updates.push(`family_id = $${i++}`);
                values.push(dto.familyId || null);
            }
            if (dto.isBlend !== undefined) {
                updates.push(`is_blend = $${i++}`);
                values.push(dto.isResale ? false : dto.isBlend);
            }
            if (dto.isResale !== undefined) {
                updates.push(`is_resale = $${i++}`);
                values.push(dto.isResale);
            }
            if (dto.supplierName !== undefined) {
                updates.push(`supplier_name = $${i++}`);
                values.push(dto.supplierName || null);
            }
            if (dto.ingredientsList !== undefined) {
                updates.push(`ingredients_json = $${i++}::jsonb`);
                values.push(JSON.stringify(dto.isResale ? [] : dto.ingredientsList));
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
        UPDATE final_products
        SET ${updates.join(', ')}
        WHERE id = $${i}
        RETURNING id;
      `, values);
            if (res.rows.length > 0)
                return this.getById(id);
        }
        catch { }
        const index = this.inMemoryProducts.findIndex(p => p.id === id);
        if (index !== -1) {
            this.inMemoryProducts[index] = {
                ...this.inMemoryProducts[index],
                ...dto,
                updatedAt: new Date().toISOString()
            };
            return this.inMemoryProducts[index];
        }
        return null;
    }
    async purgeAll() {
        const count = this.inMemoryProducts.length;
        this.inMemoryProducts = [];
        try {
            const res = await this.db.query('DELETE FROM final_products');
            return res.rowCount !== undefined ? res.rowCount : count;
        }
        catch {
            return count;
        }
    }
    async delete(id) {
        try {
            // 1. Verificar si tiene órdenes/ventas asociadas
            const orderCheck = await this.db.query('SELECT COUNT(*) AS total FROM order_items WHERE product_id = $1', [id]);
            const orderCount = parseInt(orderCheck.rows[0]?.total ?? orderCheck.rows[0]?.['COUNT(*)'] ?? '0', 10);
            if (orderCount > 0) {
                return {
                    success: false,
                    message: `El producto tiene ${orderCount} venta(s) u orden(es) históricas asociadas. Para preservar la integridad del historial contable no puede eliminarse permanentemente. Se recomienda suspenderlo.`
                };
            }
            // 2. Limpiar estructuras de costos y movimientos para que no se regenere ni falle por FK
            try {
                await this.db.query('DELETE FROM product_pricing_structures WHERE product_id = $1', [id]);
            }
            catch { }
            try {
                await this.db.query("DELETE FROM stock_movements WHERE item_id = $1 AND item_type = 'FINAL_PRODUCT'", [id]);
            }
            catch { }
            try {
                await this.db.query('DELETE FROM fractioning_orders WHERE final_product_id = $1', [id]);
            }
            catch { }
            await this.db.query('DELETE FROM final_products WHERE id = $1', [id]);
            this.inMemoryProducts = this.inMemoryProducts.filter(p => p.id !== id);
            return { success: true };
        }
        catch (err) {
            if (err.message && (err.message.includes('foreign key') || err.message.includes('a foreign key constraint fails'))) {
                return {
                    success: false,
                    message: 'No se puede eliminar porque está referenciado en otros registros del sistema. Utilice la opción Suspender.'
                };
            }
            throw err;
        }
    }
    async toggleStatus(id, newStatus) {
        try {
            const prod = await this.getById(id);
            if (!prod)
                return null;
            const targetStatus = newStatus !== undefined ? newStatus : !prod.isActive;
            await this.db.query('UPDATE final_products SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [targetStatus ? 1 : 0, id]);
            return await this.getById(id);
        }
        catch (err) {
            console.warn('⚠️ Error en toggleStatus:', err.message);
            const prod = this.inMemoryProducts.find(p => p.id === id);
            if (prod) {
                prod.isActive = newStatus !== undefined ? newStatus : !prod.isActive;
                prod.updatedAt = new Date().toISOString();
                return prod;
            }
            return null;
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
                console.error('Error al importar producto final:', e);
            }
        }
        return { importedCount: imported.length, items: imported };
    }
}
exports.FinalProductService = FinalProductService;
