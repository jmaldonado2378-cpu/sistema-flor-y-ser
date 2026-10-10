import fs from 'fs';
import path from 'path';
import { importCatalogSeed } from './seedCatalog';

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

      // Sincronizar catálogo base de Costos SISTEMA si faltan productos
      try {
        const prodCheck = await db.query('SELECT COUNT(*) AS total FROM final_products');
        const prodTotal = parseInt(prodCheck.rows[0]?.total ?? prodCheck.rows[0]?.['COUNT(*)'] ?? '0', 10);
        if (prodTotal < 50) {
          console.log(`📦 Catálogo de productos inicial (${prodTotal} productos). Sincronizando catálogo completo desde Costos SISTEMA...`);
          await importCatalogSeed(db);
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
