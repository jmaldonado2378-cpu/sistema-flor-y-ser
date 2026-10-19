import fs from 'fs';
import path from 'path';
import { importCatalogSeed, reconstructFromSurvivingTables } from './seedCatalog';

/**
 * AutoInitDatabase - Verfica y crea automáticamente la estructura de tablas MySQL
 * en Hostinger si aún no existen.
 */
export async function autoInitDatabase(db: any): Promise<boolean> {
  try {
    // 1. Probar si la base de datos responde y si existe la tabla de usuarios
    //    Reintenta hasta 6 veces (≈30s) para no saltear migraciones si MySQL tarda al arrancar.
    let checkResult: any = null;
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        checkResult = await db.query("SHOW TABLES LIKE 'system_users'");
        break;
      } catch (e: any) {
        console.warn(`⏳ MySQL aún no responde (intento ${attempt}/6): ${e.message}`);
        if (attempt === 6) throw e;
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    if (checkResult.rows && checkResult.rows.length > 0) {
      console.log('✅ Base de datos MySQL inicializada y tablas verificadas.');

      // Migraciones de compatibilidad automáticas
      try {
        // Garantizar que la columna status de orders admita los estados completos de Kanban
        await db.query("ALTER TABLE `orders` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'RECEIVED'");
      } catch (e: any) {
        // Ignorar si ya está modificado o no aplica
      }

      try {
        // Garantizar que la columna instagram exista en customers
        await db.query("ALTER TABLE `customers` ADD COLUMN `instagram` VARCHAR(100) NULL AFTER `email`");
        console.log("✅ Columna 'instagram' añadida a tabla customers");
      } catch (e: any) {
        // Ignorar si ya existe
      }

      // Garantizar que la columna is_active exista en las tablas de inventario
      try {
        await db.query("ALTER TABLE `raw_materials` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1");
      } catch (e: any) {}
      try {
        await db.query("ALTER TABLE `packaging_materials` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1");
      } catch (e: any) {}
      try {
        await db.query("ALTER TABLE `final_products` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1");
      } catch (e: any) {}

      try {
        // Garantizar que exista la tabla operational_tasks si no estuviese creada
        await db.query(`
          CREATE TABLE IF NOT EXISTS operational_tasks (
            id VARCHAR(64) NOT NULL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
            status VARCHAR(50) NOT NULL DEFAULT 'PENDING_FRACTIONING',
            priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
            assigned_to VARCHAR(150),
            order_id VARCHAR(64),
            product_id VARCHAR(64),
            product_name VARCHAR(255),
            quantity DECIMAL(12,3),
            unit_of_measure VARCHAR(50),
            due_date DATE,
            completed_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (e: any) {}

      try {
        // Garantizar que exista la tabla stock_movements (Kardex Centralizado)
        await db.query(`
          CREATE TABLE IF NOT EXISTS stock_movements (
            id VARCHAR(64) NOT NULL PRIMARY KEY,
            item_type VARCHAR(50) NOT NULL,
            item_id VARCHAR(64) NOT NULL,
            item_name VARCHAR(255) NOT NULL,
            movement_type VARCHAR(50) NOT NULL,
            quantity DECIMAL(12,3) NOT NULL,
            previous_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
            resulting_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
            unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'KG',
            unit_cost DECIMAL(12,2) NULL,
            reference_type VARCHAR(50) NULL,
            reference_id VARCHAR(64) NULL,
            reference_number VARCHAR(100) NULL,
            reason VARCHAR(255) NULL,
            user_name VARCHAR(150) NULL,
            notes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_sm_item (item_id, item_type),
            INDEX idx_sm_created (created_at),
            INDEX idx_sm_type (movement_type)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("✅ Tabla 'stock_movements' (Kardex) verificada / inicializada.");
      } catch (e: any) {
        console.warn("⚠️ Nota al verificar tabla stock_movements:", e.message);
      }

      // Sincronizar catálogo base de Costos SISTEMA si faltan productos o materias primas
      try {
        const prodCheck = await db.query('SELECT COUNT(*) AS total FROM final_products');
        const prodTotal = parseInt(prodCheck.rows[0]?.total ?? prodCheck.rows[0]?.['COUNT(*)'] ?? '0', 10);
        const rmCheck = await db.query('SELECT COUNT(*) AS total FROM raw_materials');
        const rmTotal = parseInt(rmCheck.rows[0]?.total ?? rmCheck.rows[0]?.['COUNT(*)'] ?? '0', 10);
        if (prodTotal < 50 || rmTotal < 10) {
          console.log(`📦 Catálogo incompleto (${prodTotal} productos, ${rmTotal} materias primas). Restaurando catálogo completo y reconstruyendo stock...`);
          await importCatalogSeed(db);
        } else {
          await reconstructFromSurvivingTables(db);
        }
      } catch (err: any) {
        console.warn('⚠️ Nota al verificar importación de catálogo:', err.message);
      }

      return true;
    }

    console.log('⚡ Tablas no encontradas en MySQL. Ejecutando esquema automático schema_mysql.sql...');
    const schemaPath = path.join(__dirname, '../../schema_mysql.sql');
    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️ No se encontró schema_mysql.sql para inicialización automática.');
      return false;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Desactivar claves foráneas temporalmente durante la creación de tablas
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // Limpiar comentarios de bloque y dividir por punto y coma
    // PROTECCIÓN DE DATOS: el arranque automático NUNCA ejecuta sentencias destructivas
    // (DROP / TRUNCATE / DELETE). Solo crea lo que falta.
    const cleanSql = schemaSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => !/^(DROP|TRUNCATE|DELETE)\b/i.test(s));

    let executed = 0;
    for (const statement of statements) {
      try {
        await db.query(statement);
        executed++;
      } catch (err: any) {
        // Ignorar advertencias menores de tablas existentes
        if (!err.message?.includes('already exists')) {
          console.warn(`⚠️ Nota en DDL automático (${err.message}):`, statement.substring(0, 60));
        }
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`🚀 Esquema de MySQL inicializado exitosamente (${executed} sentencias ejecutadas)!`);
    await importCatalogSeed(db);
    return true;
  } catch (error: any) {
    console.error('❌ No se pudo auto-inicializar la base de datos MySQL:', error.message);
    return false;
  }
}
