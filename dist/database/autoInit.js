"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoInitDatabase = autoInitDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const seedCatalog_1 = require("./seedCatalog");
/**
 * AutoInitDatabase - Verfica y crea automáticamente la estructura de tablas MySQL
 * en Hostinger si aún no existen.
 */
async function autoInitDatabase(db) {
    try {
        // 1. Probar si la base de datos responde y si existe la tabla de usuarios
        const checkResult = await db.query("SHOW TABLES LIKE 'system_users'");
        if (checkResult.rows && checkResult.rows.length > 0) {
            console.log('✅ Base de datos MySQL inicializada y tablas verificadas.');
            // Migraciones de compatibilidad automáticas
            try {
                // Garantizar que la columna status de orders admita los estados completos de Kanban
                await db.query("ALTER TABLE `orders` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'RECEIVED'");
            }
            catch (e) {
                // Ignorar si ya está modificado o no aplica
            }
            try {
                // Garantizar que la columna instagram exista en customers
                await db.query("ALTER TABLE `customers` ADD COLUMN `instagram` VARCHAR(100) NULL AFTER `email`");
                console.log("✅ Columna 'instagram' añadida a tabla customers");
            }
            catch (e) {
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
            }
            catch (e) { }
            // Sincronizar catálogo base de Costos SISTEMA si faltan productos
            try {
                const prodCheck = await db.query('SELECT COUNT(*) AS total FROM final_products');
                const prodTotal = parseInt(prodCheck.rows[0]?.total ?? prodCheck.rows[0]?.['COUNT(*)'] ?? '0', 10);
                if (prodTotal < 50) {
                    console.log(`📦 Catálogo de productos inicial (${prodTotal} productos). Sincronizando catálogo completo desde Costos SISTEMA...`);
                    await (0, seedCatalog_1.importCatalogSeed)(db);
                }
            }
            catch (err) {
                console.warn('⚠️ Nota al verificar importación de catálogo:', err.message);
            }
            return true;
        }
        console.log('⚡ Tablas no encontradas en MySQL. Ejecutando esquema automático schema_mysql.sql...');
        const schemaPath = path_1.default.join(__dirname, '../../schema_mysql.sql');
        if (!fs_1.default.existsSync(schemaPath)) {
            console.warn('⚠️ No se encontró schema_mysql.sql para inicialización automática.');
            return false;
        }
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf-8');
        // Desactivar claves foráneas temporalmente durante la creación de tablas
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        // Limpiar comentarios de bloque y dividir por punto y coma
        const cleanSql = schemaSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const statements = cleanSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        let executed = 0;
        for (const statement of statements) {
            try {
                await db.query(statement);
                executed++;
            }
            catch (err) {
                // Ignorar advertencias menores de tablas existentes
                if (!err.message?.includes('already exists')) {
                    console.warn(`⚠️ Nota en DDL automático (${err.message}):`, statement.substring(0, 60));
                }
            }
        }
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log(`🚀 Esquema de MySQL inicializado exitosamente (${executed} sentencias ejecutadas)!`);
        await (0, seedCatalog_1.importCatalogSeed)(db);
        return true;
    }
    catch (error) {
        console.error('❌ No se pudo auto-inicializar la base de datos MySQL:', error.message);
        return false;
    }
}
