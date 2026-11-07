"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemService = void 0;
const fs_1 = __importDefault(require("fs"));
const seedCatalog_1 = require("../database/seedCatalog");
const autoInit_1 = require("../database/autoInit");
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
                }
                catch {
                    tableCounts[table] = 0;
                }
            }
            // Si MySQL está conectado pero aún faltan tablas principales (ej. la BD se creó después del arranque),
            // ejecutar autoInitDatabase automáticamente y volver a contar.
            if (connected && totalTables < 8) {
                await (0, autoInit_1.autoInitDatabase)(this.db);
                totalTables = 0;
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
    /**
     * Purga ÚNICAMENTE los registros demo iniciales (rm-001..004, fp-001..004, pkg-001..005, ord-1001..1003).
     * NUNCA elimina el catálogo oficial ni los datos reales cargados por el usuario.
     */
    async purgeSeedData() {
        const purged = {};
        const safeQueries = [
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
            }
            catch {
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
    async restoreCatalog() {
        await (0, autoInit_1.autoInitDatabase)(this.db);
        const res = await (0, seedCatalog_1.importCatalogSeed)(this.db);
        return {
            success: res.success,
            counts: res.counts,
            message: res.message || 'Catálogo oficial restaurado y stock sincronizado desde Kardex exitosamente.'
        };
    }
    /**
     * Exporta una copia de seguridad completa de todas las tablas de MySQL
     * y actualiza el snapshot local del servidor si el sistema de archivos lo permite.
     */
    async exportFullBackup() {
        await (0, autoInit_1.autoInitDatabase)(this.db);
        const safeQuery = async (sql, params = []) => {
            try {
                const res = await this.db.query(sql, params);
                return res.rows || [];
            }
            catch {
                return [];
            }
        };
        const ordersRows = await safeQuery('SELECT * FROM orders ORDER BY created_at DESC');
        const orderItemsRows = await safeQuery('SELECT * FROM order_items');
        const itemsByOrder = {};
        for (const item of orderItemsRows) {
            const oid = item.order_id;
            if (!itemsByOrder[oid])
                itemsByOrder[oid] = [];
            itemsByOrder[oid].push(item);
        }
        const ordersWithItems = ordersRows.map((o) => ({
            ...o,
            items: itemsByOrder[o.id] || []
        }));
        const backup = {
            exportedAt: new Date().toISOString(),
            version: '2.0',
            system_users: await safeQuery('SELECT * FROM system_users'),
            article_families: await safeQuery('SELECT * FROM article_families ORDER BY sort_order ASC'),
            suppliers: await safeQuery('SELECT * FROM suppliers'),
            packaging_materials: await safeQuery('SELECT * FROM packaging_materials'),
            raw_materials: await safeQuery('SELECT * FROM raw_materials'),
            final_products: await safeQuery('SELECT * FROM final_products'),
            customers: await safeQuery('SELECT * FROM customers ORDER BY created_at DESC'),
            orders: ordersWithItems,
            stock_movements: await safeQuery('SELECT * FROM stock_movements ORDER BY created_at DESC'),
            product_pricing_structures: await safeQuery('SELECT * FROM product_pricing_structures'),
            operational_expenses: await safeQuery('SELECT * FROM operational_expenses'),
            operational_tasks: await safeQuery('SELECT * FROM operational_tasks'),
            audit_logs: await safeQuery('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500')
        };
        try {
            const snapPath = (0, seedCatalog_1.findSnapshotFile)('liveBackupSnapshot.json');
            if (snapPath) {
                fs_1.default.writeFileSync(snapPath, JSON.stringify(backup, null, 2), 'utf-8');
            }
        }
        catch { }
        return backup;
    }
    /**
     * Restaura una copia de seguridad completa (.json) de forma aditiva (sin borrar registros existentes).
     */
    async restoreFullBackup(payload) {
        await (0, autoInit_1.autoInitDatabase)(this.db);
        let dataToRestore = payload;
        if (!dataToRestore || Object.keys(dataToRestore).length === 0) {
            const snapPath = (0, seedCatalog_1.findSnapshotFile)('liveBackupSnapshot.json');
            if (!snapPath) {
                throw new Error('No se proporcionó archivo de backup ni se encontró liveBackupSnapshot.json en el servidor.');
            }
            dataToRestore = JSON.parse(fs_1.default.readFileSync(snapPath, 'utf-8'));
        }
        return await (0, seedCatalog_1.restoreFromSnapshotData)(this.db, dataToRestore);
    }
}
exports.SystemService = SystemService;
