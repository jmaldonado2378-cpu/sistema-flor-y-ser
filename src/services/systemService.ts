import { importCatalogSeed } from '../database/seedCatalog';

export class SystemService {
  constructor(private db: any) {}

  async getDbStatus(): Promise<{
    connected: boolean;
    dbType: string;
    databaseName: string;
    host: string;
    tablesCount: number;
    tables: Record<string, number>;
    message: string;
  }> {
    const dbName = process.env.DB_NAME || 'u829089200_floryser';
    const host = process.env.DB_HOST || 'localhost';

    try {
      // Intentar query básica
      const result = await this.db.query('SELECT 1 as test');
      const connected = Boolean(result && result.rows && result.rows.length > 0);

      const tableCounts: Record<string, number> = {};
      const tablesToCheck = [
        'system_users',
        'raw_materials',
        'final_products',
        'packaging_materials',
        'article_families',
        'customers',
        'orders',
        'stock_movements',
        'customer_account_movements',
        'operational_tasks'
      ];

      let totalTables = 0;
      for (const table of tablesToCheck) {
        try {
          const countRes = await this.db.query(`SELECT COUNT(*) as count FROM ${table}`);
          if (countRes.rows && countRes.rows.length > 0) {
            const cnt = parseInt(countRes.rows[0].count || countRes.rows[0].COUNT || '0', 10);
            tableCounts[table] = cnt;
            totalTables++;
          }
        } catch {
          tableCounts[table] = 0;
        }
      }

      return {
        connected,
        dbType: 'MySQL',
        databaseName: dbName,
        host,
        tablesCount: totalTables,
        tables: tableCounts,
        message: connected ? 'Conexión activa a MySQL' : 'Base de datos en modo fallback local'
      };
    } catch (error: any) {
      const dbUser = process.env.DB_USER || 'u829089200_Emilia_user';
      const rawPass = process.env.DB_PASSWORD || '';
      const passMask = rawPass ? `${rawPass.substring(0, 3)}*** (${rawPass.length} caracteres)` : '(Vacía/Sin clave)';

      return {
        connected: false,
        dbType: 'MySQL (Fallback in-memory)',
        databaseName: dbName,
        host,
        tablesCount: 0,
        tables: {},
        message: `Servidor operando en modo local.\n\nError MySQL: ${error.message || 'desconectado'}\n\n[Diagnóstico de Node.js]:\n- DB_HOST: ${host}\n- DB_USER: ${dbUser}\n- DB_PASSWORD leída por Node: ${passMask}`
      };
    }
  }

  /**
   * Purga ÚNICAMENTE los registros demo iniciales (rm-001..004, fp-001..004, pkg-001..005, ord-1001..1003).
   * NUNCA elimina el catálogo oficial ni los datos reales cargados por el usuario.
   */
  async purgeSeedData(): Promise<{ success: boolean; purged: Record<string, number>; message: string }> {
    const purged: Record<string, number> = {};

    const safeQueries: Array<{ table: string; sql: string }> = [
      { table: 'order_items', sql: `DELETE FROM order_items WHERE order_id IN ('ord-1001', 'ord-1002', 'ord-1003')` },
      { table: 'payments', sql: `DELETE FROM payments WHERE order_id IN ('ord-1001', 'ord-1002', 'ord-1003')` },
      { table: 'orders', sql: `DELETE FROM orders WHERE id IN ('ord-1001', 'ord-1002', 'ord-1003')` },
      { table: 'operational_tasks', sql: `DELETE FROM operational_tasks WHERE id IN ('task-001', 'task-002', 'task-003')` },
      { table: 'operational_expenses', sql: `DELETE FROM operational_expenses WHERE id IN ('exp-001', 'exp-002', 'exp-003')` },
      { table: 'final_products', sql: `DELETE FROM final_products WHERE id IN ('fp-001', 'fp-002', 'fp-003', 'fp-004')` },
      { table: 'raw_materials', sql: `DELETE FROM raw_materials WHERE id IN ('rm-001', 'rm-002', 'rm-003', 'rm-004')` },
      { table: 'packaging_materials', sql: `DELETE FROM packaging_materials WHERE id IN ('pkg-001', 'pkg-002', 'pkg-003', 'pkg-004', 'pkg-005')` }
    ];

    for (const q of safeQueries) {
      try {
        const res = await this.db.query(q.sql);
        purged[q.table] = res.rowCount || 0;
      } catch {
        purged[q.table] = 0;
      }
    }

    return {
      success: true,
      purged,
      message: 'Se han quitado únicamente los artículos demo de prueba iniciales. Tu catálogo oficial y tus registros reales están protegidos.'
    };
  }

  /**
   * Restaura el catálogo completo oficial y reconstruye los stocks, costos y precios reales
   * desde las tablas de respaldo (Kardex stock_movements, product_pricing_structures y products).
   */
  async restoreCatalog(): Promise<{ success: boolean; counts: any; message: string }> {
    const res = await importCatalogSeed(this.db);
    return {
      success: res.success,
      counts: res.counts,
      message: res.message || 'Catálogo oficial restaurado y stock sincronizado desde Kardex exitosamente.'
    };
  }
}
