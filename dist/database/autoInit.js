"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoInitDatabase = autoInitDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
        return true;
    }
    catch (error) {
        console.error('❌ No se pudo auto-inicializar la base de datos MySQL:', error.message);
        return false;
    }
}
