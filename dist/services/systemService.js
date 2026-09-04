"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemService = void 0;
class SystemService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getDbStatus() {
        const dbName = process.env.DB_NAME || 'u829089200_floryser';
        const host = process.env.DB_HOST || 'localhost';
        try {
            // Intentar query básica
            const result = await this.db.query('SELECT 1 as test');
            const connected = Boolean(result && result.rows && result.rows.length > 0);
            const tableCounts = {};
            const tablesToCheck = [
                'system_users',
                'raw_materials',
                'final_products',
                'packaging_materials',
                'article_families',
                'customers',
                'orders',
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
                }
                catch {
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
        }
        catch (error) {
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
    async purgeSeedData() {
        const purged = {};
        const tablesToPurge = [
            'order_items',
            'payments',
            'orders',
            'customer_account_movements',
            'fractioning_orders',
            'operational_tasks',
            'merchandise_receipt_items',
            'merchandise_receipts',
            'final_products',
            'raw_materials',
            'packaging_materials',
            'operational_expenses',
            'quote_items',
            'quotes'
        ];
        for (const table of tablesToPurge) {
            try {
                const res = await this.db.query(`DELETE FROM ${table}`);
                purged[table] = res.rowCount || 0;
            }
            catch {
                purged[table] = 0;
            }
        }
        return {
            success: true,
            purged,
            message: 'Se han purgado los datos semilla de prueba exitosamente. Las cuentas de usuario principales se mantienen intactas.'
        };
    }
}
exports.SystemService = SystemService;
