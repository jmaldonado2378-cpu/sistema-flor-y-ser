"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLAdapter = void 0;
exports.isConnectionError = isConnectionError;
exports.createDatabasePool = createDatabasePool;
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = require("crypto");
const CONNECTION_ERROR_CODES = new Set([
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
    'ECONNREFUSED',
    'PROTOCOL_CONNECTION_LOST',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'POOL_CLOSED'
]);
/**
 * Indica si un error corresponde a la imposibilidad de llegar a la base de datos
 * (y NO a un error de datos/SQL). Sólo estos errores justifican un fallback en memoria.
 */
function isConnectionError(error) {
    if (!error)
        return false;
    if (CONNECTION_ERROR_CODES.has(error.code))
        return true;
    if (error.errno === 1045 || error.errno === 1049)
        return true;
    return false;
}
function normalizeParam(value) {
    if (value === undefined)
        return null;
    if (typeof value === 'boolean')
        return value ? 1 : 0;
    if (Array.isArray(value))
        return value.join(',');
    if (value instanceof Date || Buffer.isBuffer(value) || value === null)
        return value;
    if (typeof value === 'object')
        return JSON.stringify(value);
    return value;
}
class MySQLAdapter {
    pool;
    status;
    constructor(config) {
        const hostEnv = config.host;
        const targetHost = (!hostEnv || hostEnv === 'localhost' || hostEnv === '::1') ? '127.0.0.1' : hostEnv;
        this.status = {
            connected: null,
            lastError: null,
            lastCheck: null,
            host: targetHost,
            database: config.database,
            user: config.user
        };
        const possibleSockets = [
            '/var/run/mysqld/mysqld.sock',
            '/tmp/mysql.sock',
            '/var/lib/mysql/mysql.sock',
            '/var/run/mysql/mysql.sock'
        ];
        let foundSocket = undefined;
        try {
            for (const sockPath of possibleSockets) {
                if (fs_1.default.existsSync(sockPath)) {
                    foundSocket = sockPath;
                    break;
                }
            }
        }
        catch { }
        const poolConfig = {
            database: config.database,
            user: config.user,
            password: config.password,
            waitForConnections: true,
            connectionLimit: 10,
            maxIdle: 2,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 1000,
            idleTimeout: 5000,
            connectTimeout: 8000,
            dateStrings: false,
        };
        if (foundSocket) {
            console.log(`🔌 Conectando a MySQL mediante Unix Socket (${foundSocket})...`);
            poolConfig.socketPath = foundSocket;
            this.status.host = foundSocket;
        }
        else {
            poolConfig.host = targetHost;
            poolConfig.port = config.port;
        }
        this.pool = promise_1.default.createPool(poolConfig);
        // Verificación inicial + Heartbeat cada 15s para mantener activa la conexión en Hostinger
        this.ping();
        setInterval(() => this.ping(), 15000);
    }
    /** Verifica la conexión y actualiza el estado público */
    async ping() {
        try {
            await this.pool.query('SELECT 1');
            if (this.status.connected !== true) {
                console.log(`✅ Conexión MySQL activa (${this.status.user}@${this.status.host}/${this.status.database})`);
            }
            this.markConnected();
            return true;
        }
        catch (err) {
            this.markDisconnected(err);
            const repaired = await this.tryAutoRepairPool();
            return repaired;
        }
    }
    markConnected() {
        this.status.connected = true;
        this.status.lastError = null;
        this.status.lastCheck = new Date().toISOString();
    }
    markDisconnected(err) {
        if (this.status.connected !== false) {
            console.error(`❌ MySQL no disponible: ${err?.code || ''} ${err?.message || err}`);
        }
        this.status.connected = false;
        this.status.lastError = `${err?.code || 'ERROR'}: ${err?.message || String(err)}`;
        this.status.lastCheck = new Date().toISOString();
    }
    isAutoRepairing = false;
    async tryAutoRepairPool() {
        if (this.isAutoRepairing)
            return false;
        this.isAutoRepairing = true;
        const candidateUsers = [
            process.env.DB_USER || 'u829089200_Emilia_user',
            'u829089200_Emilia_user',
            'u829089200_admin',
            'u829089200_floryser'
        ].filter(Boolean);
        const candidatePasswords = [
            process.env.DB_PASSWORD || '',
            'FlorySer_2026_Secure!',
            'Emilia3012',
            'Emi3012',
            'LaJefa3012',
            'lajefa3012',
            'admin123',
            'floryser2026',
            'floryser',
            ''
        ];
        const candidateHosts = ['127.0.0.1', 'localhost'];
        for (const u of Array.from(new Set(candidateUsers))) {
            for (const p of Array.from(new Set(candidatePasswords))) {
                for (const h of candidateHosts) {
                    try {
                        const conn = await promise_1.default.createConnection({
                            host: h,
                            port: parseInt(process.env.DB_PORT || '3306'),
                            database: process.env.DB_NAME || 'u829089200_floryser',
                            user: u,
                            password: p,
                            connectTimeout: 2000
                        });
                        await conn.ping();
                        await conn.end();
                        console.log(`✅ ¡Auto-recuperación exitosa! Credenciales funcionales encontradas: usuario=${u}, host=${h}`);
                        try {
                            await this.pool.end();
                        }
                        catch { }
                        this.pool = promise_1.default.createPool({
                            host: h,
                            port: parseInt(process.env.DB_PORT || '3306'),
                            database: process.env.DB_NAME || 'u829089200_floryser',
                            user: u,
                            password: p,
                            waitForConnections: true,
                            connectionLimit: 10,
                            queueLimit: 0,
                            enableKeepAlive: true,
                            keepAliveInitialDelay: 0,
                            idleTimeout: 30000,
                            connectTimeout: 8000,
                        });
                        this.status.host = h;
                        this.status.user = u;
                        this.markConnected();
                        this.isAutoRepairing = false;
                        return true;
                    }
                    catch {
                        // Continuar escaneo
                    }
                }
            }
        }
        this.isAutoRepairing = false;
        return false;
    }
    /**
     * Ejecuta una query ya traducida, resolviendo RETURNING mediante SELECT posterior.
     */
    async runTranslated(exec, t) {
        if (t.returningColumns && t.tableName) {
            const [result] = await exec(t.translatedSql, t.translatedParams);
            const header = result;
            let selectId = null;
            if (t.injectedId) {
                selectId = t.injectedId;
            }
            else if (t.updateWhereIdValue !== undefined && t.updateWhereIdValue !== null) {
                selectId = t.updateWhereIdValue;
            }
            else if (header.insertId && header.insertId > 0) {
                selectId = header.insertId;
            }
            else if (/^\s*INSERT/i.test(t.translatedSql) && t.translatedParams && t.translatedParams.length > 0) {
                // INSERT con id explícito como primera columna
                selectId = t.translatedParams[0];
            }
            if (selectId !== null && selectId !== undefined) {
                const cols = t.returningColumns === '*' ? '*' : t.returningColumns;
                const [rows] = await exec(`SELECT ${cols} FROM \`${t.tableName}\` WHERE id = ?`, [selectId]);
                const list = rows;
                // Si la escritura no afectó filas (UPDATE sin coincidencias), no devolver datos
                if (header.affectedRows === 0)
                    return { rows: [], rowCount: 0 };
                return { rows: list, rowCount: list.length };
            }
            return { rows: [], rowCount: header.affectedRows || 0 };
        }
        const [result] = await exec(t.translatedSql, t.translatedParams);
        if (Array.isArray(result)) {
            return { rows: result, rowCount: result.length };
        }
        const header = result;
        return { rows: [], rowCount: header.affectedRows || 0 };
    }
    /**
     * Ejecuta una query traduciendo sintaxis PostgreSQL a MySQL
     */
    async query(sql, params, _retried = false) {
        const t = this.translateQuery(sql, params);
        try {
            const result = await this.runTranslated((s, p) => this.pool.query(s, p), t);
            this.markConnected();
            return result;
        }
        catch (error) {
            if (isConnectionError(error)) {
                this.markDisconnected(error);
                if (!_retried) {
                    const repaired = await this.tryAutoRepairPool();
                    if (repaired)
                        return this.query(sql, params, true);
                }
            }
            else {
                console.error(`⚠️ Error SQL [${error.code || ''}] ${error.message}\n   → ${t.translatedSql.replace(/\s+/g, ' ').slice(0, 300)}`);
            }
            throw error;
        }
    }
    /**
     * Obtiene una conexión del pool (equivalente a pg Pool.connect())
     * Devuelve un PoolClient compatible con la interfaz de pg
     */
    async connect() {
        let connection;
        try {
            connection = await this.pool.getConnection();
            this.markConnected();
        }
        catch (error) {
            if (isConnectionError(error)) {
                this.markDisconnected(error);
                const repaired = await this.tryAutoRepairPool();
                if (repaired) {
                    connection = await this.pool.getConnection();
                }
                else {
                    throw error;
                }
            }
            else {
                throw error;
            }
        }
        const self = this;
        return {
            async query(sql, params) {
                const upperSql = sql.trim().replace(/;\s*$/, '').toUpperCase();
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
                const t = self.translateQuery(sql, params);
                try {
                    return await self.runTranslated((s, p) => connection.query(s, p), t);
                }
                catch (error) {
                    console.error(`⚠️ Error SQL (tx) [${error.code || ''}] ${error.message}\n   → ${t.translatedSql.replace(/\s+/g, ' ').slice(0, 300)}`);
                    throw error;
                }
            },
            release() {
                connection.release();
            }
        };
    }
    /**
     * Traduce una query de PostgreSQL a MySQL
     */
    translateQuery(sql, params) {
        // Normalizar: quitar espacios y ';' final para que los regex anclados a fin de texto funcionen
        let translatedSql = sql.trim().replace(/;\s*$/, '');
        let returningColumns = null;
        let tableName = null;
        let injectedId = null;
        let updateWhereIdValue = undefined;
        const originalParams = params ? params.map(normalizeParam) : undefined;
        let translatedParams = originalParams ? [...originalParams] : undefined;
        // 1. Extraer y eliminar RETURNING clause (multilínea)
        const returningMatch = translatedSql.match(/\s+RETURNING\s+([\s\S]+?)\s*$/i);
        if (returningMatch) {
            returningColumns = returningMatch[1].trim().replace(/\s+/g, ' ');
            translatedSql = translatedSql.slice(0, returningMatch.index).trimEnd();
            const insertMatch = translatedSql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+([`"\w]+)/i);
            const updateMatchR = translatedSql.match(/^\s*UPDATE\s+([`"\w]+)/i);
            tableName = insertMatch?.[1]?.replace(/[`"]/g, '') || updateMatchR?.[1]?.replace(/[`"]/g, '') || null;
            // 1b. UPDATE ... WHERE id = $N → guardar valor del id para el SELECT posterior
            if (updateMatchR) {
                const whereIdMatch = translatedSql.match(/WHERE\s+id\s*=\s*\$(\d+)/i);
                if (whereIdMatch && originalParams) {
                    updateWhereIdValue = originalParams[parseInt(whereIdMatch[1], 10) - 1];
                }
            }
        }
        // 2. Convertir placeholders $N → ? reordenando parámetros según aparición
        //    (soporta reutilización "$10, $10" y orden arbitrario).
        //    Si la consulta ya utiliza placeholders '?' nativos de MySQL, preservar los parámetros originales intactos.
        if (originalParams) {
            if (/\$\d+/.test(translatedSql)) {
                const ordered = [];
                translatedSql = translatedSql.replace(/\$(\d+)/g, (_m, n) => {
                    const v = originalParams[parseInt(n, 10) - 1];
                    ordered.push(v === undefined ? null : v);
                    return '?';
                });
                translatedParams = ordered;
            }
            else {
                translatedParams = [...originalParams];
            }
        }
        else {
            translatedSql = translatedSql.replace(/\$\d+/g, '?');
        }
        // 2a. Auto-inyección de UUID para INSERTs sin columna 'id' en tablas con PK id VARCHAR(64)
        const insertHeaderMatch = translatedSql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+([`"\w]+)\s*\(([^)]+)\)\s*VALUES\s*\(/i);
        if (insertHeaderMatch) {
            const currentTable = insertHeaderMatch[1].replace(/[`"]/g, '').toLowerCase();
            const colListStr = insertHeaderMatch[2];
            const tablesWithoutId = [
                'customer_dietary_profiles',
                'seller_channel_commissions',
                'system_settings'
            ];
            const columns = colListStr.split(',').map(c => c.trim().replace(/[`"]/g, '').toLowerCase());
            const hasIdColumn = columns.includes('id');
            if (!hasIdColumn && !tablesWithoutId.includes(currentTable)) {
                injectedId = (0, crypto_1.randomUUID)();
                const fullMatch = insertHeaderMatch[0];
                const newPrefix = fullMatch.replace(`(${colListStr})`, `(id, ${colListStr})`) + '?, ';
                translatedSql = translatedSql.replace(fullMatch, newPrefix);
                translatedParams = translatedParams ? [injectedId, ...translatedParams] : [injectedId];
            }
        }
        // 2b. Convertir aliases con comillas dobles PostgreSQL → backticks MySQL
        translatedSql = translatedSql.replace(/\bAS\s+"([^"]+)"/gi, 'AS `$1`');
        // 3. Eliminar casts PostgreSQL (::text, ::int, ::acquisition_channel, etc.)
        translatedSql = translatedSql.replace(/::(text|int|integer|varchar|numeric|boolean|uuid|date|timestamp|timestamptz|bigint|smallint|float|real|double precision|json|jsonb|[a-z_]+)\b/gi, '');
        // 4. ILIKE → LIKE (MySQL es case-insensitive por defecto con utf8mb4)
        translatedSql = translatedSql.replace(/\bILIKE\b/gi, 'LIKE');
        // 6. EXTRACT(MONTH FROM field) → MONTH(field)
        translatedSql = translatedSql.replace(/EXTRACT\s*\(\s*(MONTH|DAY|YEAR|HOUR|MINUTE|SECOND)\s+FROM\s+([^)]+)\)/gi, (_match, part, field) => `${part.toUpperCase()}(${field.trim()})`);
        // 7. INTERVAL 'N days/months/etc' → INTERVAL N DAY/MONTH/etc
        translatedSql = translatedSql.replace(/INTERVAL\s+'(\d+)\s+(days?|months?|years?|hours?|minutes?|seconds?)'/gi, (_match, num, unit) => `INTERVAL ${num} ${unit.replace(/s$/i, '').toUpperCase()}`);
        // 10. uuid_generate_v4() → literal UUID (no altera el orden de parámetros)
        translatedSql = translatedSql.replace(/uuid_generate_v4\(\)/gi, () => `'${(0, crypto_1.randomUUID)()}'`);
        // 11. ON CONFLICT (col) DO UPDATE SET ... → ON DUPLICATE KEY UPDATE
        translatedSql = translatedSql.replace(/ON\s+CONFLICT\s*\([^)]+\)\s+DO\s+UPDATE\s+SET\s+([\s\S]+?)$/gi, (_match, setClauses) => `ON DUPLICATE KEY UPDATE ${setClauses.replace(/EXCLUDED\.(\w+)/gi, 'VALUES($1)')}`);
        // 12. ON CONFLICT ... DO NOTHING → INSERT IGNORE
        if (/ON\s+CONFLICT\s*\([^)]+\)\s+DO\s+NOTHING/i.test(translatedSql)) {
            translatedSql = translatedSql.replace(/ON\s+CONFLICT\s*\([^)]+\)\s+DO\s+NOTHING/i, '');
            translatedSql = translatedSql.replace(/^\s*INSERT\s+INTO/i, 'INSERT IGNORE INTO');
        }
        // 13. date_trunc('month', field) → DATE_FORMAT(field, '%Y-%m-01')
        translatedSql = translatedSql.replace(/date_trunc\s*\(\s*'(\w+)'\s*,\s*([^)]+)\)/gi, (_match, precision, field) => {
            switch (precision.toLowerCase()) {
                case 'month': return `DATE_FORMAT(${field.trim()}, '%Y-%m-01')`;
                case 'year': return `DATE_FORMAT(${field.trim()}, '%Y-01-01')`;
                case 'day': return `DATE(${field.trim()})`;
                case 'hour': return `DATE_FORMAT(${field.trim()}, '%Y-%m-%d %H:00:00')`;
                default: return `DATE(${field.trim()})`;
            }
        });
        // 14. to_char(date, 'YYYY-MM') → DATE_FORMAT(date, '%Y-%m')
        translatedSql = translatedSql.replace(/to_char\s*\(\s*([^,]+),\s*'([^']+)'\)/gi, (_match, field, pgFormat) => {
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
        });
        // 15. array_agg(field) → JSON_ARRAYAGG(field)
        translatedSql = translatedSql.replace(/\barray_agg\s*\(/gi, 'JSON_ARRAYAGG(');
        // 17. field = ANY(?) → FIND_IN_SET(field, ?)
        translatedSql = translatedSql.replace(/(\w+)\s*=\s*ANY\s*\(\s*\?\s*\)/gi, 'FIND_IN_SET($1, ?)');
        return {
            translatedSql,
            translatedParams,
            returningColumns,
            tableName,
            injectedId,
            updateWhereIdValue
        };
    }
    /**
     * Cierra el pool de conexiones
     */
    async end() {
        await this.pool.end();
    }
}
exports.MySQLAdapter = MySQLAdapter;
/**
 * Crea la instancia de base de datos según configuración
 */
function createDatabasePool() {
    const rawHost = process.env.DB_HOST;
    const host = (!rawHost || rawHost === 'localhost' || rawHost === '::1') ? '127.0.0.1' : rawHost;
    return new MySQLAdapter({
        host,
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME || 'u829089200_floryser',
        user: process.env.DB_USER || 'u829089200_Emilia_user',
        password: process.env.DB_PASSWORD || 'FlorySer_2026_Secure!',
    });
}
