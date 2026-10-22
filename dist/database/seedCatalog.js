"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCatalogSeed = importCatalogSeed;
exports.reconstructFromSurvivingTables = reconstructFromSurvivingTables;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function importCatalogSeed(db) {
    try {
        // Buscar catalogSeedData.json en dist/database o src/database
        let seedPath = path_1.default.join(__dirname, 'catalogSeedData.json');
        if (!fs_1.default.existsSync(seedPath)) {
            seedPath = path_1.default.join(__dirname, '../database/catalogSeedData.json');
        }
        if (!fs_1.default.existsSync(seedPath)) {
            seedPath = path_1.default.join(process.cwd(), 'src/database/catalogSeedData.json');
        }
        if (!fs_1.default.existsSync(seedPath)) {
            seedPath = path_1.default.join(process.cwd(), 'dist/database/catalogSeedData.json');
        }
        if (!fs_1.default.existsSync(seedPath)) {
            console.warn('⚠️ Archivo catalogSeedData.json no encontrado en:', seedPath);
            return { success: false, message: 'Archivo de catálogo no encontrado' };
        }
        const data = JSON.parse(fs_1.default.readFileSync(seedPath, 'utf-8'));
        console.log('📦 Iniciando importación y sincronización de catálogo desde Costos SISTEMA...');
        await db.query('SET FOREIGN_KEY_CHECKS = 0;');
        // 1. Familias
        let famCount = 0;
        for (const f of data.families || []) {
            try {
                await db.query(`
          INSERT INTO article_families (id, parent_id, code, name, description, article_scope, icon, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
          ON DUPLICATE KEY UPDATE
            parent_id = VALUES(parent_id),
            code = VALUES(code),
            name = VALUES(name),
            description = VALUES(description),
            article_scope = VALUES(article_scope),
            icon = VALUES(icon),
            sort_order = VALUES(sort_order),
            is_active = 1;
        `, [f.id, f.parent_id || null, f.code, f.name, f.name, f.article_scope || 'ALL', f.icon || 'Package', f.sort_order ?? famCount]);
                famCount++;
            }
            catch (err) {
                // Ignorar duplicados
            }
        }
        // 2. Proveedores
        let supCount = 0;
        for (const s of data.suppliers || []) {
            try {
                await db.query(`
          INSERT INTO suppliers (id, tax_id, business_name, contact_name, phone, email, categories, notes, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
          ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), contact_name = VALUES(contact_name);
        `, [s.id, s.tax_id, s.business_name, s.contact_name, s.phone, s.email, s.categories, s.notes]);
                supCount++;
            }
            catch (err) {
                // Ignorar duplicados
            }
        }
        // 3. Materiales de Empaque
        let pkgCount = 0;
        for (const p of data.packaging_materials || []) {
            try {
                await db.query(`
          INSERT INTO packaging_materials (id, code, name, category, unit, current_stock, min_stock, cost_per_unit, supplier_name, family_id, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), cost_per_unit = VALUES(cost_per_unit), current_stock = VALUES(current_stock);
        `, [p.id, p.code, p.name, p.category, p.unit, p.current_stock, p.min_stock, p.cost_per_unit, p.supplier_name, p.family_id]);
                pkgCount++;
            }
            catch (err) {
                // Ignorar
            }
        }
        // 4. Materias Primas (Granel)
        let rmCount = 0;
        for (const rm of data.raw_materials || []) {
            try {
                await db.query(`
          INSERT INTO raw_materials (id, code, name, unit, current_stock, min_stock, cost_per_unit, storage_location, family_id, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), cost_per_unit = VALUES(cost_per_unit), family_id = VALUES(family_id);
        `, [rm.id, rm.code, rm.name, rm.unit, rm.current_stock, rm.min_stock, rm.cost_per_unit, rm.storage_location, rm.family_id]);
                rmCount++;
            }
            catch (err) {
                // Ignorar
            }
        }
        // 5. Productos Finales
        let fpCount = 0;
        for (const fp of data.final_products || []) {
            try {
                await db.query(`
          INSERT INTO final_products (
            id, raw_material_id, code, barcode, name, unit_weight_grams, net_content_label,
            current_stock, min_stock, cost_price, price, ingredients, dietary_badge_codes,
            default_expiration_days, family_id, is_blend, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), cost_price = VALUES(cost_price), family_id = VALUES(family_id);
        `, [
                    fp.id, fp.raw_material_id, fp.code, fp.barcode, fp.name, fp.unit_weight_grams, fp.net_content_label,
                    fp.current_stock, fp.min_stock, fp.cost_price, fp.price, fp.ingredients, fp.dietary_badge_codes,
                    fp.default_expiration_days, fp.family_id, fp.is_blend
                ]);
                fpCount++;
            }
            catch (err) {
                // Ignorar
            }
        }
        // 6. Productos POS / Venta
        let pCount = 0;
        for (const p of data.products || []) {
            try {
                await db.query(`
          INSERT INTO products (
            id, sku, name, product_type, unit_of_measure, current_stock, min_stock,
            cost_price, sale_price, category, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), sale_price = VALUES(sale_price), cost_price = VALUES(cost_price);
        `, [
                    p.id, p.sku, p.name, p.product_type, p.unit_of_measure, p.current_stock, p.min_stock,
                    p.cost_price, p.sale_price, p.category
                ]);
                pCount++;
            }
            catch (err) {
                // Ignorar
            }
        }
        await db.query('SET FOREIGN_KEY_CHECKS = 1;');
        // 7. Reconstruir stock, costos, precios y artículos personalizados desde las tablas que sobrevivieron (stock_movements, products, product_pricing_structures)
        const reconstructed = await reconstructFromSurvivingTables(db);
        console.log(`✅ Catálogo importado y reconstruido exitosamente:
      - Familias: ${famCount}
      - Proveedores: ${supCount}
      - Materiales de Empaque: ${pkgCount}
      - Materias Primas: ${rmCount}
      - Productos Finales: ${fpCount}
      - Productos POS: ${pCount}
      - Stock/Artículos recuperados de Kardex y Precios: ${reconstructed.recoveredItems}`);
        return {
            success: true,
            counts: {
                families: famCount,
                suppliers: supCount,
                packaging: pkgCount,
                rawMaterials: rmCount,
                finalProducts: fpCount,
                products: pCount,
                recoveredFromKardexAndPricing: reconstructed.recoveredItems
            }
        };
    }
    catch (error) {
        console.error('❌ Error en importCatalogSeed:', error.message);
        try {
            await db.query('SET FOREIGN_KEY_CHECKS = 1;');
        }
        catch { }
        return { success: false, message: error.message };
    }
}
/**
 * Reconstruye stock actual, costos, precios personalizados y artículos creados por el usuario
 * a partir de las tablas que no fueron afectadas (stock_movements, product_pricing_structures, products).
 */
async function reconstructFromSurvivingTables(db) {
    let recoveredItems = 0;
    try {
        // A. Recuperar precios y productos desde product_pricing_structures
        try {
            const pricingRes = await db.query('SELECT * FROM product_pricing_structures');
            for (const row of pricingRes.rows || []) {
                const finalPrice = parseFloat(row.mostrador_final_price || row.mostrador_suggested_price || '0');
                const rawCost = parseFloat(row.raw_material_cost || '0');
                if (finalPrice > 0 || rawCost > 0) {
                    const checkFp = await db.query('SELECT id FROM final_products WHERE id = $1 OR code = $2 OR LOWER(name) = LOWER($3)', [row.product_id, row.product_sku || '', row.product_name || '']);
                    if (checkFp.rows && checkFp.rows.length > 0) {
                        await db.query(`UPDATE final_products
               SET price = CASE WHEN $1 > 0 THEN $1 ELSE price END,
                   cost_price = CASE WHEN $2 > 0 THEN $2 ELSE cost_price END
               WHERE id = $3`, [finalPrice, rawCost, checkFp.rows[0].id]);
                        recoveredItems++;
                    }
                    else if (row.product_name) {
                        const code = row.product_sku || ('PF-' + row.product_id.slice(0, 6).toUpperCase());
                        await db.query(`INSERT INTO final_products (id, code, name, unit_weight_grams, net_content_label, current_stock, min_stock, cost_price, price, is_active)
               VALUES ($1, $2, $3, 100, '100g', 0, 5, $4, $5, 1)
               ON DUPLICATE KEY UPDATE price = VALUES(price), cost_price = VALUES(cost_price)`, [row.product_id, code, row.product_name, rawCost, finalPrice]);
                        recoveredItems++;
                    }
                }
            }
        }
        catch (e) {
            console.warn('⚠️ Nota en reconstrucción desde product_pricing_structures:', e.message);
        }
        // B. Recuperar stock y artículos desde la tabla `products` (que no estaba en tablesToPurge)
        try {
            const prodRes = await db.query('SELECT * FROM products WHERE current_stock > 0 OR cost_price > 0');
            for (const p of prodRes.rows || []) {
                const stock = parseFloat(p.current_stock || '0');
                const cost = parseFloat(p.cost_price || '0');
                if (stock > 0 || cost > 0) {
                    const isGranel = (p.product_type || '').toUpperCase().includes('GRANEL') || (p.unit_of_measure || '').toUpperCase() === 'KG';
                    if (isGranel) {
                        const rmUpd = await db.query(`UPDATE raw_materials
               SET current_stock = GREATEST(current_stock, $1),
                   cost_per_unit = CASE WHEN $2 > 0 THEN $2 ELSE cost_per_unit END
               WHERE id = $3 OR code = $4 OR LOWER(name) = LOWER($5)`, [stock, cost, p.id, p.sku || '', p.name || '']);
                        if ((rmUpd.rowCount || 0) > 0)
                            recoveredItems++;
                    }
                    else {
                        const fpUpd = await db.query(`UPDATE final_products
               SET current_stock = GREATEST(current_stock, $1),
                   cost_price = CASE WHEN $2 > 0 THEN $2 ELSE cost_price END
               WHERE id = $3 OR code = $4 OR LOWER(name) = LOWER($5)`, [stock, cost, p.id, p.sku || '', p.name || '']);
                        if ((fpUpd.rowCount || 0) > 0)
                            recoveredItems++;
                    }
                }
            }
        }
        catch (e) {
            console.warn('⚠️ Nota en reconstrucción desde products:', e.message);
        }
        // C. Reconstruir stock e ítems desde `stock_movements` (Kardex intacto)
        try {
            const movRes = await db.query('SELECT * FROM stock_movements ORDER BY created_at ASC');
            const itemMap = new Map();
            for (const m of movRes.rows || []) {
                const key = `${m.item_type}::${m.item_id !== 'N/A' && m.item_id ? m.item_id : m.item_name}`;
                const prev = itemMap.get(key) || {
                    itemType: m.item_type,
                    itemId: m.item_id,
                    itemName: m.item_name,
                    stock: 0,
                    unit: m.unit_of_measure || 'UN',
                    unitCost: 0
                };
                const resStock = parseFloat(m.resulting_stock || '0');
                const qty = parseFloat(m.quantity || '0');
                const cost = parseFloat(m.unit_cost || '0');
                if (resStock > 0 || (m.movement_type === 'MANUAL_ADJUSTMENT' && m.resulting_stock !== null)) {
                    prev.stock = resStock;
                }
                else {
                    prev.stock = Math.max(0, prev.stock + qty);
                }
                if (cost > 0)
                    prev.unitCost = cost;
                if (m.item_name)
                    prev.itemName = m.item_name;
                itemMap.set(key, prev);
            }
            for (const [, info] of itemMap.entries()) {
                if (info.itemType === 'RAW_MATERIAL') {
                    const check = await db.query('SELECT id FROM raw_materials WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($2)', [info.itemId, info.itemName]);
                    if (check.rows && check.rows.length > 0) {
                        await db.query(`UPDATE raw_materials
               SET current_stock = $1,
                   cost_per_unit = CASE WHEN $2 > 0 THEN $2 ELSE cost_per_unit END
               WHERE id = $3`, [info.stock, info.unitCost, check.rows[0].id]);
                        recoveredItems++;
                    }
                    else if (info.itemName) {
                        const newId = info.itemId && info.itemId !== 'N/A' ? info.itemId : ('rm-rec-' + Date.now() + Math.floor(Math.random() * 100));
                        const newCode = 'MP-REC-' + Math.floor(1000 + Math.random() * 9000);
                        await db.query(`INSERT INTO raw_materials (id, code, name, unit, current_stock, min_stock, cost_per_unit, is_active)
               VALUES ($1, $2, $3, $4, $5, 5, $6, 1)
               ON DUPLICATE KEY UPDATE current_stock = VALUES(current_stock)`, [newId, newCode, info.itemName, info.unit || 'KG', info.stock, info.unitCost]);
                        recoveredItems++;
                    }
                }
                else if (info.itemType === 'PACKAGING') {
                    const check = await db.query('SELECT id FROM packaging_materials WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($2)', [info.itemId, info.itemName]);
                    if (check.rows && check.rows.length > 0) {
                        await db.query(`UPDATE packaging_materials
               SET current_stock = $1,
                   cost_per_unit = CASE WHEN $2 > 0 THEN $2 ELSE cost_per_unit END
               WHERE id = $3`, [info.stock, info.unitCost, check.rows[0].id]);
                        recoveredItems++;
                    }
                    else if (info.itemName) {
                        const newId = info.itemId && info.itemId !== 'N/A' ? info.itemId : ('pkg-rec-' + Date.now() + Math.floor(Math.random() * 100));
                        const newCode = 'EMP-REC-' + Math.floor(1000 + Math.random() * 9000);
                        await db.query(`INSERT INTO packaging_materials (id, code, name, category, unit, current_stock, min_stock, cost_per_unit, is_active)
               VALUES ($1, $2, $3, 'OTHER', $4, $5, 10, $6, 1)
               ON DUPLICATE KEY UPDATE current_stock = VALUES(current_stock)`, [newId, newCode, info.itemName, info.unit || 'UN', info.stock, info.unitCost]);
                        recoveredItems++;
                    }
                }
                else if (info.itemType === 'FINAL_PRODUCT') {
                    const check = await db.query('SELECT id FROM final_products WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($2)', [info.itemId, info.itemName]);
                    if (check.rows && check.rows.length > 0) {
                        await db.query(`UPDATE final_products
               SET current_stock = $1,
                   cost_price = CASE WHEN $2 > 0 THEN $2 ELSE cost_price END
               WHERE id = $3`, [info.stock, info.unitCost, check.rows[0].id]);
                        recoveredItems++;
                    }
                    else if (info.itemName) {
                        const newId = info.itemId && info.itemId !== 'N/A' ? info.itemId : ('fp-rec-' + Date.now() + Math.floor(Math.random() * 100));
                        const newCode = 'PF-REC-' + Math.floor(1000 + Math.random() * 9000);
                        await db.query(`INSERT INTO final_products (id, code, name, unit_weight_grams, net_content_label, current_stock, min_stock, cost_price, price, is_active)
               VALUES ($1, $2, $3, 100, '100g', $4, 5, $5, $6, 1)
               ON DUPLICATE KEY UPDATE current_stock = VALUES(current_stock)`, [newId, newCode, info.itemName, info.stock, info.unitCost, info.unitCost * 1.5]);
                        recoveredItems++;
                    }
                }
            }
        }
        catch (e) {
            console.warn('⚠️ Nota en reconstrucción desde stock_movements:', e.message);
        }
    }
    catch (err) {
        console.warn('⚠️ Error general en reconstructFromSurvivingTables:', err.message);
    }
    return { recoveredItems };
}
