import mysql, { Pool as MySQLPool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * MySQLAdapter — Wrapper compatible con la interfaz de pg.Pool
 * 
 * Convierte automáticamente:
 * - Placeholders: $1, $2, $3 → ?, ?, ?
 * - Resultados: [rows, fields] → { rows, rowCount }
 * - RETURNING * → INSERT + SELECT automático
 * - Casts PostgreSQL: ::text, ::int → eliminados
 * - ON CONFLICT → ON DUPLICATE KEY UPDATE
 */

export interface QueryResult {
  rows: any[];
  rowCount: number;
}

export interface PoolClient {
  query(sql: string, params?: any[]): Promise<QueryResult>;
  release(): void;
}

export class MySQLAdapter {
  private pool: MySQLPool;

  constructor(config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // MySQL equivalent of idleTimeoutMillis
      idleTimeout: 30000,
    });
  }

  /**
   * Ejecuta una query traduciendo sintaxis PostgreSQL a MySQL
   */
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const { translatedSql, translatedParams, returningColumns, tableName } = this.translateQuery(sql, params);

    try {
      // Si tiene RETURNING, hacer INSERT/UPDATE + SELECT
      if (returningColumns && tableName) {
        const [result] = await this.pool.execute<ResultSetHeader>(translatedSql, translatedParams);

        // Determinar el ID para el SELECT posterior
        let selectId: any;
        
        if (result.insertId && result.insertId > 0) {
          // Auto-increment INSERT
          selectId = result.insertId;
        } else if (translatedParams && translatedParams.length > 0) {
          // UUID-based INSERT — el primer parámetro suele ser el ID
          selectId = translatedParams[0];
        }

        if (selectId) {
          const selectSql = returningColumns === '*'
            ? `SELECT * FROM ${tableName} WHERE id = ?`
            : `SELECT ${returningColumns} FROM ${tableName} WHERE id = ?`;
          
          const [rows] = await this.pool.execute<RowDataPacket[]>(selectSql, [selectId]);
          return { rows: rows as any[], rowCount: rows.length };
        }

        // Fallback: devolver resultado vacío con affectedRows
        return { rows: [], rowCount: result.affectedRows || 0 };
      }

      // Query normal (SELECT, UPDATE sin RETURNING, DELETE)
      const [result] = await this.pool.execute(translatedSql, translatedParams);

      if (Array.isArray(result)) {
        // SELECT — result es array de filas
        return { rows: result as any[], rowCount: (result as any[]).length };
      } else {
        // INSERT/UPDATE/DELETE sin RETURNING
        const header = result as ResultSetHeader;
        return { rows: [], rowCount: header.affectedRows || 0 };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una conexión del pool (equivalente a pg Pool.connect())
   * Devuelve un PoolClient compatible con la interfaz de pg
   */
  async connect(): Promise<PoolClient> {
    const connection = await this.pool.getConnection();
    const self = this;

    return {
      async query(sql: string, params?: any[]): Promise<QueryResult> {
        const { translatedSql, translatedParams, returningColumns, tableName } = self.translateQuery(sql, params);

        if (returningColumns && tableName) {
          const [result] = await connection.execute<ResultSetHeader>(translatedSql, translatedParams);
          
          let selectId: any;
          if (result.insertId && result.insertId > 0) {
            selectId = result.insertId;
          } else if (translatedParams && translatedParams.length > 0) {
            selectId = translatedParams[0];
          }

          if (selectId) {
            const selectSql = returningColumns === '*'
              ? `SELECT * FROM ${tableName} WHERE id = ?`
              : `SELECT ${returningColumns} FROM ${tableName} WHERE id = ?`;
            
            const [rows] = await connection.execute<RowDataPacket[]>(selectSql, [selectId]);
            return { rows: rows as any[], rowCount: rows.length };
          }

          return { rows: [], rowCount: result.affectedRows || 0 };
        }

        // Manejar BEGIN/COMMIT/ROLLBACK como comandos de transacción
        const upperSql = translatedSql.trim().toUpperCase();
        if (upperSql === 'BEGIN' || upperSql === 'START TRANSACTION') {
          await connection.beginTransaction();
          return { rows: [], rowCount: 0 };
        }
        if (upperSql === 'COMMIT') {
          await connection.commit();
          return { rows: [], rowCount: 0 };
        }
        if (upperSql === 'ROLLBACK') {
          await connection.rollback();
          return { rows: [], rowCount: 0 };
        }

        const [result] = await connection.execute(translatedSql, translatedParams);

        if (Array.isArray(result)) {
          return { rows: result as any[], rowCount: (result as any[]).length };
        } else {
          const header = result as ResultSetHeader;
          return { rows: [], rowCount: header.affectedRows || 0 };
        }
      },

      release(): void {
        connection.release();
      }
    };
  }

  /**
   * Traduce una query de PostgreSQL a MySQL
   */
  private translateQuery(sql: string, params?: any[]): {
    translatedSql: string;
    translatedParams: any[] | undefined;
    returningColumns: string | null;
    tableName: string | null;
  } {
    let translatedSql = sql;
    let returningColumns: string | null = null;
    let tableName: string | null = null;

    // 1. Extraer y eliminar RETURNING clause
    const returningMatch = translatedSql.match(/\s+RETURNING\s+(.+?)$/i);
    if (returningMatch) {
      returningColumns = returningMatch[1].trim().replace(/;$/, '');
      translatedSql = translatedSql.replace(/\s+RETURNING\s+.+$/i, '');

      // Extraer tabla del INSERT INTO o UPDATE
      const insertMatch = translatedSql.match(/INSERT\s+INTO\s+(\w+)/i);
      const updateMatch = translatedSql.match(/UPDATE\s+(\w+)/i);
      tableName = insertMatch?.[1] || updateMatch?.[1] || null;
    }

    // 2. Convertir placeholders $1, $2, $3 → ?
    translatedSql = translatedSql.replace(/\$\d+/g, '?');

    // 3. Eliminar casts PostgreSQL (::text, ::int, ::varchar, ::numeric, ::boolean, ::uuid, ::date, ::timestamp)
    translatedSql = translatedSql.replace(/::(text|int|integer|varchar|numeric|boolean|uuid|date|timestamp|timestamptz|bigint|smallint|float|real|double precision|json|jsonb)\b/gi, '');

    // 4. ILIKE → LIKE (MySQL es case-insensitive por defecto con utf8mb4)
    translatedSql = translatedSql.replace(/\bILIKE\b/gi, 'LIKE');

    // 5. string concatenation: || → CONCAT()
    // Solo para concatenación de strings simples (campo || 'literal' || campo)
    // Esto es complejo de hacer con regex genérico, lo dejamos para casos específicos en servicios

    // 6. EXTRACT(MONTH FROM field) → MONTH(field), EXTRACT(DAY FROM field) → DAY(field)
    translatedSql = translatedSql.replace(
      /EXTRACT\s*\(\s*(MONTH|DAY|YEAR|HOUR|MINUTE|SECOND)\s+FROM\s+([^)]+)\)/gi,
      (_match, part, field) => `${part.toUpperCase()}(${field.trim()})`
    );

    // 7. INTERVAL 'N days/months/etc' → INTERVAL N DAY/MONTH/etc
    translatedSql = translatedSql.replace(
      /INTERVAL\s+'(\d+)\s+(days?|months?|years?|hours?|minutes?|seconds?)'/gi,
      (_match, num, unit) => {
        const mysqlUnit = unit.replace(/s$/, '').toUpperCase();
        return `INTERVAL ${num} ${mysqlUnit}`;
      }
    );

    // 8. NOW() y CURRENT_TIMESTAMP funcionan en ambos — no cambiar

    // 9. boolean TRUE/FALSE → MySQL 1/0 (en contextos WHERE)
    // MySQL entiende TRUE/FALSE como keywords, así que generalmente no hace falta cambiar

    // 10. uuid_generate_v4() → eliminado (se genera en Node.js y se pasa como parámetro)
    translatedSql = translatedSql.replace(/uuid_generate_v4\(\)/gi, '?');
    // NOTA: Si se usa uuid_generate_v4() como DEFAULT en INSERT, el servicio debe generar el UUID

    // 11. ON CONFLICT → ON DUPLICATE KEY UPDATE  
    // Patrón: ON CONFLICT (col) DO UPDATE SET col1 = EXCLUDED.col1
    translatedSql = translatedSql.replace(
      /ON\s+CONFLICT\s*\([^)]+\)\s+DO\s+UPDATE\s+SET\s+(.+?)(?=;|\s*$)/gi,
      (_match, setClauses) => {
        // Reemplazar EXCLUDED.campo por VALUES(campo)
        const mysqlSet = setClauses.replace(/EXCLUDED\.(\w+)/gi, 'VALUES($1)');
        return `ON DUPLICATE KEY UPDATE ${mysqlSet}`;
      }
    );

    // 12. ON CONFLICT ... DO NOTHING → INSERT IGNORE (se maneja reescribiendo el INSERT)
    if (translatedSql.match(/ON\s+CONFLICT\s*\([^)]+\)\s+DO\s+NOTHING/i)) {
      translatedSql = translatedSql.replace(/ON\s+CONFLICT\s*\([^)]+\)\s+DO\s+NOTHING/i, '');
      translatedSql = translatedSql.replace(/^INSERT\s+INTO/i, 'INSERT IGNORE INTO');
    }

    // 13. date_trunc('month', field) → DATE_FORMAT(field, '%Y-%m-01')
    translatedSql = translatedSql.replace(
      /date_trunc\s*\(\s*'(\w+)'\s*,\s*([^)]+)\)/gi,
      (_match, precision, field) => {
        switch (precision.toLowerCase()) {
          case 'month': return `DATE_FORMAT(${field.trim()}, '%Y-%m-01')`;
          case 'year': return `DATE_FORMAT(${field.trim()}, '%Y-01-01')`;
          case 'day': return `DATE(${field.trim()})`;
          case 'hour': return `DATE_FORMAT(${field.trim()}, '%Y-%m-%d %H:00:00')`;
          default: return `DATE(${field.trim()})`;
        }
      }
    );

    // 14. to_char(date, 'YYYY-MM') → DATE_FORMAT(date, '%Y-%m')
    translatedSql = translatedSql.replace(
      /to_char\s*\(\s*([^,]+),\s*'([^']+)'\)/gi,
      (_match, field, pgFormat) => {
        const mysqlFormat = pgFormat
          .replace(/YYYY/g, '%Y')
          .replace(/YY/g, '%y')
          .replace(/MM/g, '%m')
          .replace(/DD/g, '%d')
          .replace(/HH24/g, '%H')
          .replace(/HH/g, '%h')
          .replace(/MI/g, '%i')
          .replace(/SS/g, '%s')
          .replace(/Month/g, '%M')
          .replace(/Mon/g, '%b')
          .replace(/Day/g, '%W')
          .replace(/Dy/g, '%a');
        return `DATE_FORMAT(${field.trim()}, '${mysqlFormat}')`;
      }
    );

    // 15. array_agg(field) → JSON_ARRAYAGG(field) o GROUP_CONCAT(field)
    translatedSql = translatedSql.replace(/\barray_agg\s*\(/gi, 'JSON_ARRAYAGG(');

    // 16. DISTINCT ON (field) → No tiene equivalente directo, se maneja en el servicio
    // Lo dejamos como está y los servicios que lo usen lo arreglan manualmente

    // 17. ANY(?) para arrays → se maneja reemplazando por IN (?)
    // Patrón: field = ANY($N) → FIND_IN_SET(field, ?)
    translatedSql = translatedSql.replace(
      /(\w+)\s*=\s*ANY\s*\(\s*\?\s*\)/gi,
      'FIND_IN_SET($1, ?)'
    );

    return { translatedSql, translatedParams: params, returningColumns, tableName };
  }

  /**
   * Cierra el pool de conexiones
   */
  async end(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Crea la instancia de base de datos según configuración
 */
export function createDatabasePool(): MySQLAdapter {
  const hostEnv = process.env.DB_HOST;
  const targetHost = (!hostEnv || hostEnv === 'localhost' || hostEnv === '::1') ? '127.0.0.1' : hostEnv;

  return new MySQLAdapter({
    host: targetHost,
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'u829089200_floryser',
    user: process.env.DB_USER || 'u829089200_admin',
    password: process.env.DB_PASSWORD || '',
  });
}
