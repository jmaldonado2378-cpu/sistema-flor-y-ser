"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCatalogSeed = importCatalogSeed;
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
          INSERT INTO article_families (id, code, name, description, article_scope, icon, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon);
        `, [f.id, f.code, f.name, f.name, f.article_scope || 'ALL', f.icon || 'Package', famCount]);
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
          ON DUPLICATE KEY UPDATE name = VALUES(name), cost_per_unit = VALUES(cost_per_unit);
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
          ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), cost_price = VALUES(cost_price);
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
        console.log(`✅ Catálogo importado exitosamente:
      - Familias: ${famCount}
      - Proveedores: ${supCount}
      - Materiales de Empaque: ${pkgCount}
      - Materias Primas: ${rmCount}
      - Productos Finales: ${fpCount}
      - Productos POS: ${pCount}`);
        return {
            success: true,
            counts: {
                families: famCount,
                suppliers: supCount,
                packaging: pkgCount,
                rawMaterials: rmCount,
                finalProducts: fpCount,
                products: pCount
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
