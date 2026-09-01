import fs from 'fs';
import path from 'path';

/**
 * AutoInitDatabase - Verfica y crea automáticamente la estructura de tablas MySQL
 * en Hostinger si aún no existen.
 */
export async function autoInitDatabase(db: any): Promise<boolean> {
  try {
    // 1. Probar si la base de datos responde y si existe la tabla de usuarios
    const checkResult = await db.query("SHOW TABLES LIKE 'system_users'");
    if (checkResult.rows && checkResult.rows.length > 0) {
      console.log('✅ Base de datos MySQL inicializada y tablas verificadas.');
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
      } catch (err: any) {
        // Ignorar advertencias menores de tablas existentes
        if (!err.message?.includes('already exists')) {
          console.warn(`⚠️ Nota en DDL automático (${err.message}):`, statement.substring(0, 60));
        }
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`🚀 Esquema de MySQL inicializado exitosamente (${executed} sentencias ejecutadas)!`);
    return true;
  } catch (error: any) {
    console.error('❌ No se pudo auto-inicializar la base de datos MySQL:', error.message);
    return false;
  }
}
