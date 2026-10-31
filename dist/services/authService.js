"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../middleware/auth");
const ALL_ADMIN_MODULES = [
    'dashboard', 'customers', 'stock', 'article_families',
    'merchandise_receipt', 'fractioning', 'new_sale', 'kanban_orders', 'kanban_tasks',
    'suppliers', 'checking_accounts', 'finance', 'settings', 'marketing', 'users'
];
const DEFAULT_SELLER_MODULES = [
    'dashboard', 'customers', 'stock', 'new_sale', 'kanban_orders', 'kanban_tasks', 'fractioning'
];
// Usuarios oficiales por defecto
const DEFAULT_USERS = [
    {
        id: 'usr-admin-1',
        name: 'Juan Pablo (Administrador)',
        email: 'jmaldonado2378@gmail.com',
        password_hash: '',
        visible_password: 'admin123',
        role: 'ADMIN',
        is_protected: 1,
        allowed_modules_json: JSON.stringify(ALL_ADMIN_MODULES),
        avatar_initials: 'JP',
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'usr-seller-1',
        name: 'María Emilia Maldonado',
        email: 'memimaldonado05@gmail.com',
        password_hash: '',
        visible_password: 'LaJefa3012',
        role: 'ADMIN',
        is_protected: 1,
        allowed_modules_json: JSON.stringify(ALL_ADMIN_MODULES),
        avatar_initials: 'ME',
        active: true,
        created_at: new Date().toISOString()
    }
];
const DEFAULT_PASSWORDS = {
    'jmaldonado2378@gmail.com': 'admin123',
    'memimaldonado05@gmail.com': 'LaJefa3012',
    'roquevedo23@gmail.com': 'Laflormaspura',
    'dantesaulommxxii@gmail.com': 'Lasmiradasperdidas'
};
const PROTECTED_ADMIN_EMAILS = new Set([
    'jmaldonado2378@gmail.com',
    'memimaldonado05@gmail.com'
]);
class AuthService {
    db;
    inMemoryUsers = [];
    inMemoryAuditLogs = [];
    initialized = false;
    schemaEnsured = false;
    constructor(db) {
        this.db = db;
        this.initializeDefaults();
    }
    async initializeDefaults() {
        if (this.initialized)
            return;
        for (const user of DEFAULT_USERS) {
            const defaultPass = DEFAULT_PASSWORDS[user.email] || 'password123';
            user.password_hash = await bcrypt_1.default.hash(defaultPass, 10);
        }
        this.inMemoryUsers = [...DEFAULT_USERS];
        this.initialized = true;
    }
    /**
     * Garantiza que la tabla system_users tenga las columnas profesionales
     * (visible_password, avatar_url, last_login_at, is_protected) y que exista audit_logs.
     */
    async ensureUsersAndAuditSchema() {
        if (this.schemaEnsured)
            return;
        this.schemaEnsured = true;
        try {
            await this.db.query("ALTER TABLE `system_users` ADD COLUMN `visible_password` VARCHAR(150) NULL AFTER `password_hash`");
        }
        catch { }
        try {
            await this.db.query("ALTER TABLE `system_users` ADD COLUMN `avatar_url` LONGTEXT NULL AFTER `avatar_initials`");
        }
        catch { }
        try {
            await this.db.query("ALTER TABLE `system_users` ADD COLUMN `last_login_at` DATETIME NULL AFTER `active`");
        }
        catch { }
        try {
            await this.db.query("ALTER TABLE `system_users` ADD COLUMN `is_protected` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role`");
        }
        catch { }
        try {
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          user_id VARCHAR(64) NULL,
          user_name VARCHAR(150) NOT NULL,
          user_email VARCHAR(150) NOT NULL,
          user_role VARCHAR(50) NOT NULL DEFAULT 'SELLER',
          action VARCHAR(100) NOT NULL,
          module VARCHAR(100) NOT NULL,
          details TEXT NOT NULL,
          INDEX idx_audit_ts (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
        }
        catch (e) {
            console.warn('⚠️ Nota al verificar tabla audit_logs:', e.message);
        }
        // Sincronizar datos iniciales en system_users para evitar conflictos entre dispositivos
        try {
            // 1. Asegurar que Juan Pablo y María Emilia figuren como ADMIN protegidos
            await this.db.query(`UPDATE system_users 
         SET role = 'ADMIN', is_protected = 1, active = 1, allowed_modules_json = ?
         WHERE LOWER(email) IN ('jmaldonado2378@gmail.com', 'memimaldonado05@gmail.com')`, [JSON.stringify(ALL_ADMIN_MODULES)]);
            // 2. Poblar visible_password en usuarios existentes si aún estaba NULL
            for (const [emailKey, knownPass] of Object.entries(DEFAULT_PASSWORDS)) {
                await this.db.query(`UPDATE system_users SET visible_password = ? WHERE LOWER(email) = ? AND (visible_password IS NULL OR visible_password = '')`, [knownPass, emailKey.toLowerCase()]);
            }
        }
        catch (e) {
            console.warn('⚠️ Nota al normalizar usuarios en MySQL:', e.message);
        }
    }
    /**
     * Autenticación: valida email + contraseña contra MySQL o fallback en memoria
     */
    async login(email, password) {
        await this.initializeDefaults();
        await this.ensureUsersAndAuditSchema();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = password.trim();
        try {
            const result = await this.db.query('SELECT id, name, email, password_hash, visible_password, role, is_protected, allowed_modules_json, avatar_initials, avatar_url, active, last_login_at, created_at FROM system_users WHERE LOWER(email) = ?', [cleanEmail]);
            if (result.rows.length > 0) {
                const dbUser = result.rows[0];
                let passwordMatch = await bcrypt_1.default.compare(cleanPass, dbUser.password_hash);
                // Si coincide con visible_password guardada en BD pero el hash quedó desfasado
                if (!passwordMatch && dbUser.visible_password && cleanPass === dbUser.visible_password) {
                    const newHash = await bcrypt_1.default.hash(cleanPass, 10);
                    await this.db.query('UPDATE system_users SET password_hash = ? WHERE id = ?', [newHash, dbUser.id]);
                    passwordMatch = true;
                }
                // Si no tenía visible_password y coincide con la clave inicial conocida
                const expectedDefaultPass = DEFAULT_PASSWORDS[cleanEmail];
                if (!passwordMatch && !dbUser.visible_password && expectedDefaultPass && cleanPass === expectedDefaultPass) {
                    const realHash = await bcrypt_1.default.hash(expectedDefaultPass, 10);
                    await this.db.query('UPDATE system_users SET password_hash = ?, visible_password = ? WHERE id = ?', [realHash, expectedDefaultPass, dbUser.id]);
                    dbUser.password_hash = realHash;
                    dbUser.visible_password = expectedDefaultPass;
                    passwordMatch = true;
                }
                // Asegurar que las cuentas de Juan Pablo y María Emilia siempre estén activas
                if (PROTECTED_ADMIN_EMAILS.has(cleanEmail) && !dbUser.active) {
                    await this.db.query('UPDATE system_users SET active = 1, role = \'ADMIN\', is_protected = 1 WHERE id = ?', [dbUser.id]);
                    dbUser.active = 1;
                    dbUser.role = 'ADMIN';
                }
                const isActive = Boolean(dbUser.active == 1 || dbUser.active === true || dbUser.active === '1');
                if (passwordMatch && isActive) {
                    // Guardar visible_password si no estaba guardada aún y actualizar last_login_at
                    const nowIso = new Date().toISOString();
                    try {
                        await this.db.query('UPDATE system_users SET last_login_at = NOW(), visible_password = COALESCE(NULLIF(visible_password, \'\'), ?) WHERE id = ?', [cleanPass, dbUser.id]);
                        dbUser.last_login_at = nowIso;
                        if (!dbUser.visible_password)
                            dbUser.visible_password = cleanPass;
                    }
                    catch { }
                    // Registrar en auditoría centralizada
                    await this.recordAuditLog({
                        userId: dbUser.id,
                        userName: dbUser.name,
                        userEmail: dbUser.email,
                        userRole: dbUser.role,
                        action: 'INICIO_SESION',
                        module: 'Sistema',
                        details: `Inicio de sesión exitoso de ${dbUser.name} (${dbUser.role === 'ADMIN' ? 'Administrador' : 'Vendedor'})`
                    });
                    return this.buildLoginResult(dbUser);
                }
                return null;
            }
            // Auto-Creación en BD si es uno de los administradores principales por defecto
            const defaultUser = DEFAULT_USERS.find(u => u.email.toLowerCase() === cleanEmail);
            const expectedDefaultPass = DEFAULT_PASSWORDS[cleanEmail];
            if (defaultUser && expectedDefaultPass && cleanPass === expectedDefaultPass) {
                const realHash = await bcrypt_1.default.hash(cleanPass, 10);
                try {
                    await this.db.query(`INSERT INTO system_users (id, name, email, password_hash, visible_password, role, is_protected, allowed_modules_json, avatar_initials, active, last_login_at) 
             VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE password_hash = ?, visible_password = ?, active = 1, last_login_at = NOW()`, [
                        defaultUser.id,
                        defaultUser.name,
                        defaultUser.email,
                        realHash,
                        cleanPass,
                        defaultUser.role,
                        defaultUser.allowed_modules_json,
                        defaultUser.avatar_initials,
                        realHash,
                        cleanPass
                    ]);
                    defaultUser.password_hash = realHash;
                    defaultUser.active = true;
                    return this.buildLoginResult(defaultUser);
                }
                catch (insertErr) {
                    console.error('Error al auto-crear usuario en BD:', insertErr);
                }
            }
            return this.loginInMemory(cleanEmail, cleanPass);
        }
        catch (err) {
            console.warn('⚠️ Base de datos no disponible para auth, usando fallback en memoria');
            return this.loginInMemory(cleanEmail, cleanPass);
        }
    }
    async loginInMemory(email, password) {
        const user = this.inMemoryUsers.find(u => u.email.toLowerCase() === email && u.active);
        if (!user)
            return null;
        const passwordMatch = await bcrypt_1.default.compare(password, user.password_hash);
        if (!passwordMatch)
            return null;
        return this.buildLoginResult(user);
    }
    buildLoginResult(dbUser) {
        let allowedModules = typeof dbUser.allowed_modules_json === 'string'
            ? JSON.parse(dbUser.allowed_modules_json)
            : dbUser.allowed_modules_json || [];
        if (dbUser.role === 'ADMIN') {
            allowedModules = ALL_ADMIN_MODULES;
        }
        const emailLower = String(dbUser.email || '').toLowerCase();
        const isProtected = Boolean(dbUser.is_protected || PROTECTED_ADMIN_EMAILS.has(emailLower));
        const userDTO = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            isProtected,
            allowedModules,
            avatarInitials: dbUser.avatar_initials || dbUser.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
            avatarUrl: dbUser.avatar_url || undefined,
            active: Boolean(dbUser.active == 1 || dbUser.active === true || dbUser.active === '1'),
            lastLoginAt: dbUser.last_login_at?.toISOString?.() || dbUser.last_login_at || null,
            createdAt: dbUser.created_at?.toISOString?.() || dbUser.created_at || new Date().toISOString()
        };
        const jwtPayload = {
            userId: userDTO.id,
            email: userDTO.email,
            role: userDTO.role,
            name: userDTO.name
        };
        return {
            user: userDTO,
            token: (0, auth_1.generateToken)(jwtPayload),
            refreshToken: (0, auth_1.generateRefreshToken)(jwtPayload)
        };
    }
    /**
     * Registra un nuevo usuario en la base de datos MySQL
     */
    async createUser(data, actor) {
        await this.ensureUsersAndAuditSchema();
        const id = (0, uuid_1.v4)();
        const cleanEmail = data.email.trim().toLowerCase();
        const cleanPassword = data.password.trim();
        const passwordHash = await bcrypt_1.default.hash(cleanPassword, 10);
        const initials = data.avatarInitials || data.name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const finalModules = data.role === 'ADMIN' ? ALL_ADMIN_MODULES : (data.allowedModules?.length ? data.allowedModules : DEFAULT_SELLER_MODULES);
        const modulesJson = JSON.stringify(finalModules);
        const isProtected = PROTECTED_ADMIN_EMAILS.has(cleanEmail) ? 1 : 0;
        const isActive = data.active !== false ? 1 : 0;
        try {
            await this.db.query(`INSERT INTO system_users (id, name, email, password_hash, visible_password, role, is_protected, allowed_modules_json, avatar_initials, avatar_url, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           visible_password = VALUES(visible_password),
           role = VALUES(role),
           is_protected = VALUES(is_protected),
           allowed_modules_json = VALUES(allowed_modules_json),
           avatar_initials = VALUES(avatar_initials),
           avatar_url = COALESCE(VALUES(avatar_url), avatar_url),
           active = VALUES(active)`, [id, data.name.trim(), cleanEmail, passwordHash, cleanPassword, data.role, isProtected, modulesJson, initials, data.avatarUrl || null, isActive]);
            // Obtener el registro real (por si fue ON DUPLICATE KEY)
            const fetched = await this.db.query('SELECT id, name, email, visible_password, role, is_protected, allowed_modules_json, avatar_initials, avatar_url, active, last_login_at, created_at FROM system_users WHERE LOWER(email) = ?', [cleanEmail]);
            const row = fetched.rows?.[0];
            await this.recordAuditLog({
                userId: actor?.userId || null,
                userName: actor?.name || 'Administrador',
                userEmail: actor?.email || 'admin@floryser.com',
                userRole: actor?.role || 'ADMIN',
                action: 'CREAR_USUARIO',
                module: 'Usuarios & Permisos',
                details: `Usuario registrado/sincronizado en MySQL: ${data.name.trim()} (${cleanEmail}) con rol ${data.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}`
            });
            return {
                id: row?.id || id,
                name: row?.name || data.name.trim(),
                email: cleanEmail,
                password: cleanPassword,
                role: row?.role || data.role,
                isProtected: Boolean(row?.is_protected || isProtected),
                allowedModules: finalModules,
                avatarInitials: row?.avatar_initials || initials,
                avatarUrl: row?.avatar_url || data.avatarUrl || undefined,
                active: Boolean(isActive),
                lastLoginAt: row?.last_login_at?.toISOString?.() || row?.last_login_at || null,
                createdAt: row?.created_at?.toISOString?.() || row?.created_at || new Date().toISOString()
            };
        }
        catch (err) {
            console.error('❌ Error al guardar usuario en MySQL:', err);
            throw new Error(`Error al persistir usuario en MySQL: ${err.message}`);
        }
    }
    /**
     * Lista todos los usuarios.
     * Si includePasswords = true (solo para ADMIN), incluye visible_password para que todos los administradores vean exactamente las mismas credenciales.
     */
    async getAllUsers(includePasswords = false) {
        await this.ensureUsersAndAuditSchema();
        try {
            const result = await this.db.query('SELECT id, name, email, visible_password, role, is_protected, allowed_modules_json, avatar_initials, avatar_url, active, last_login_at, created_at FROM system_users ORDER BY is_protected DESC, role ASC, created_at ASC');
            return result.rows.map((u) => {
                const emailLower = String(u.email || '').toLowerCase();
                const isProt = Boolean(u.is_protected || PROTECTED_ADMIN_EMAILS.has(emailLower));
                const parsedModules = typeof u.allowed_modules_json === 'string'
                    ? JSON.parse(u.allowed_modules_json)
                    : u.allowed_modules_json || [];
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    password: includePasswords ? (u.visible_password || DEFAULT_PASSWORDS[emailLower] || undefined) : undefined,
                    role: u.role,
                    isProtected: isProt,
                    allowedModules: u.role === 'ADMIN' ? ALL_ADMIN_MODULES : parsedModules,
                    avatarInitials: u.avatar_initials || u.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
                    avatarUrl: u.avatar_url || undefined,
                    active: Boolean(u.active == 1 || u.active === true || u.active === '1'),
                    lastLoginAt: u.last_login_at?.toISOString?.() || u.last_login_at || null,
                    createdAt: u.created_at?.toISOString?.() || u.created_at
                };
            });
        }
        catch (err) {
            return this.inMemoryUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                password: includePasswords ? u.visible_password : undefined,
                role: u.role,
                isProtected: Boolean(u.is_protected),
                allowedModules: typeof u.allowed_modules_json === 'string' ? JSON.parse(u.allowed_modules_json) : u.allowed_modules_json || [],
                avatarInitials: u.avatar_initials,
                active: Boolean(u.active),
                createdAt: u.created_at
            }));
        }
    }
    /**
     * Actualiza un usuario existente en MySQL
     */
    async updateUser(userId, updates, actor) {
        await this.ensureUsersAndAuditSchema();
        // Verificar si es un usuario protegido antes de permitir quitarle rol ADMIN o desactivarlo
        let existingUser = null;
        try {
            const existingRes = await this.db.query('SELECT * FROM system_users WHERE id = ?', [userId]);
            existingUser = existingRes.rows?.[0];
        }
        catch { }
        const emailLower = String(existingUser?.email || updates.email || '').toLowerCase();
        const isProtectedAdmin = Boolean(existingUser?.is_protected || PROTECTED_ADMIN_EMAILS.has(emailLower));
        const setClauses = [];
        const params = [];
        const changeDescriptions = [];
        if (updates.name && updates.name.trim()) {
            setClauses.push('name = ?');
            params.push(updates.name.trim());
            if (existingUser && existingUser.name !== updates.name.trim()) {
                changeDescriptions.push(`nombre a "${updates.name.trim()}"`);
            }
        }
        if (updates.email && updates.email.trim()) {
            setClauses.push('email = ?');
            params.push(updates.email.trim().toLowerCase());
        }
        if (updates.password && updates.password.trim().length > 0) {
            const cleanPass = updates.password.trim();
            setClauses.push('password_hash = ?');
            params.push(await bcrypt_1.default.hash(cleanPass, 10));
            setClauses.push('visible_password = ?');
            params.push(cleanPass);
            if (!existingUser || existingUser.visible_password !== cleanPass) {
                changeDescriptions.push('contraseña actualizada');
            }
        }
        if (updates.role) {
            // Proteger a Juan Pablo y María Emilia para que nunca pierdan su rol ADMIN por accidente
            const effectiveRole = isProtectedAdmin ? 'ADMIN' : updates.role;
            setClauses.push('role = ?');
            params.push(effectiveRole);
            if (existingUser && existingUser.role !== effectiveRole) {
                changeDescriptions.push(`rol cambiado a ${effectiveRole === 'ADMIN' ? 'Administrador' : 'Vendedor'}`);
            }
        }
        if (updates.allowedModules) {
            const effectiveRole = isProtectedAdmin ? 'ADMIN' : (updates.role || existingUser?.role || 'SELLER');
            const finalModules = effectiveRole === 'ADMIN' ? ALL_ADMIN_MODULES : updates.allowedModules;
            setClauses.push('allowed_modules_json = ?');
            params.push(JSON.stringify(finalModules));
            changeDescriptions.push(`permisos (${finalModules.length} módulos)`);
        }
        if (updates.avatarInitials) {
            setClauses.push('avatar_initials = ?');
            params.push(updates.avatarInitials);
        }
        if (updates.avatarUrl !== undefined) {
            setClauses.push('avatar_url = ?');
            params.push(updates.avatarUrl || null);
        }
        if (typeof updates.active === 'boolean') {
            const effectiveActive = isProtectedAdmin ? true : updates.active;
            setClauses.push('active = ?');
            params.push(effectiveActive ? 1 : 0);
            if (existingUser && Boolean(existingUser.active) !== effectiveActive) {
                changeDescriptions.push(effectiveActive ? 'cuenta reactivada' : 'cuenta pausada/desactivada');
            }
        }
        if (setClauses.length === 0)
            return null;
        params.push(userId);
        try {
            await this.db.query(`UPDATE system_users SET ${setClauses.join(', ')} WHERE id = ?`, params);
            const result = await this.db.query('SELECT id, name, email, visible_password, role, is_protected, allowed_modules_json, avatar_initials, avatar_url, active, last_login_at, created_at FROM system_users WHERE id = ?', [userId]);
            if (result.rows.length === 0)
                return null;
            const u = result.rows[0];
            const uEmailLower = String(u.email || '').toLowerCase();
            await this.recordAuditLog({
                userId: actor?.userId || null,
                userName: actor?.name || 'Administrador',
                userEmail: actor?.email || 'admin@floryser.com',
                userRole: actor?.role || 'ADMIN',
                action: 'ACTUALIZAR_USUARIO',
                module: 'Usuarios & Permisos',
                details: `Usuario "${u.name}" (${u.email}) actualizado: ${changeDescriptions.length > 0 ? changeDescriptions.join(', ') : 'datos actualizados'}`
            });
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                password: u.visible_password || DEFAULT_PASSWORDS[uEmailLower] || undefined,
                role: u.role,
                isProtected: Boolean(u.is_protected || PROTECTED_ADMIN_EMAILS.has(uEmailLower)),
                allowedModules: u.role === 'ADMIN' ? ALL_ADMIN_MODULES : (typeof u.allowed_modules_json === 'string' ? JSON.parse(u.allowed_modules_json) : u.allowed_modules_json || []),
                avatarInitials: u.avatar_initials,
                avatarUrl: u.avatar_url || undefined,
                active: Boolean(u.active == 1 || u.active === true || u.active === '1'),
                lastLoginAt: u.last_login_at?.toISOString?.() || u.last_login_at || null,
                createdAt: u.created_at?.toISOString?.() || u.created_at
            };
        }
        catch (err) {
            const user = this.inMemoryUsers.find(u => u.id === userId);
            if (!user)
                return null;
            Object.assign(user, updates);
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.visible_password,
                role: user.role,
                isProtected: Boolean(user.is_protected),
                allowedModules: typeof user.allowed_modules_json === 'string' ? JSON.parse(user.allowed_modules_json) : [],
                avatarInitials: user.avatar_initials,
                active: Boolean(user.active),
                createdAt: user.created_at
            };
        }
    }
    /**
     * Elimina o desactiva un usuario (protegiendo a los Administradores Principales)
     */
    async deleteUser(userId, actor) {
        await this.ensureUsersAndAuditSchema();
        try {
            const checkRes = await this.db.query('SELECT id, name, email, role, is_protected FROM system_users WHERE id = ?', [userId]);
            const target = checkRes.rows?.[0];
            if (!target) {
                return { deleted: false, reason: 'Usuario no encontrado' };
            }
            const emailLower = String(target.email || '').toLowerCase();
            if (target.is_protected || PROTECTED_ADMIN_EMAILS.has(emailLower)) {
                return {
                    deleted: false,
                    reason: `La cuenta de Administrador Principal (${target.name}) está protegida y no puede ser eliminada.`
                };
            }
            const result = await this.db.query('DELETE FROM system_users WHERE id = ? AND is_protected = 0', [userId]);
            await this.recordAuditLog({
                userId: actor?.userId || null,
                userName: actor?.name || 'Administrador',
                userEmail: actor?.email || 'admin@floryser.com',
                userRole: actor?.role || 'ADMIN',
                action: 'ELIMINAR_USUARIO',
                module: 'Usuarios & Permisos',
                details: `Usuario eliminado del sistema: ${target.name} (${target.email})`
            });
            return { deleted: result.rowCount > 0 };
        }
        catch (err) {
            return { deleted: false, reason: err.message };
        }
    }
    /**
     * Registra un evento en la tabla audit_logs de MySQL
     */
    async recordAuditLog(entry) {
        await this.ensureUsersAndAuditSchema();
        const id = entry.id || `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const tsIso = entry.timestamp || new Date().toISOString();
        const mysqlDate = tsIso.slice(0, 19).replace('T', ' ');
        const dto = {
            id,
            timestamp: tsIso,
            userId: entry.userId || null,
            userName: entry.userName || 'Sistema',
            userEmail: entry.userEmail || '',
            userRole: entry.userRole || 'SELLER',
            action: entry.action || 'EVENTO',
            module: entry.module || 'Sistema',
            details: entry.details || ''
        };
        try {
            await this.db.query(`INSERT IGNORE INTO audit_logs (id, timestamp, user_id, user_name, user_email, user_role, action, module, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [dto.id, mysqlDate, dto.userId, dto.userName, dto.userEmail, dto.userRole, dto.action, dto.module, dto.details]);
        }
        catch {
            this.inMemoryAuditLogs.unshift(dto);
        }
        return dto;
    }
    /**
     * Sincroniza un lote de logs locales del navegador hacia MySQL (sin duplicar IDs)
     */
    async syncAuditLogsBatch(logs) {
        await this.ensureUsersAndAuditSchema();
        if (!Array.isArray(logs) || logs.length === 0)
            return 0;
        let synced = 0;
        for (const log of logs.slice(0, 200)) {
            if (!log || !log.id || !log.action)
                continue;
            try {
                const tsIso = log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString();
                const mysqlDate = tsIso.slice(0, 19).replace('T', ' ');
                const res = await this.db.query(`INSERT IGNORE INTO audit_logs (id, timestamp, user_id, user_name, user_email, user_role, action, module, details)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    log.id,
                    mysqlDate,
                    log.userId || null,
                    log.userName || 'Usuario',
                    log.userEmail || '',
                    log.userRole || 'SELLER',
                    log.action,
                    log.module || 'Sistema',
                    log.details || ''
                ]);
                if (res.rowCount > 0)
                    synced++;
            }
            catch { }
        }
        return synced;
    }
    /**
     * Obtiene el historial de auditoría centralizado desde MySQL
     */
    async getAuditLogs(limit = 250) {
        await this.ensureUsersAndAuditSchema();
        try {
            const result = await this.db.query(`SELECT id, timestamp, user_id, user_name, user_email, user_role, action, module, details
         FROM audit_logs
         ORDER BY timestamp DESC
         LIMIT ${Number(limit) || 250}`);
            return (result.rows || []).map((r) => ({
                id: r.id,
                timestamp: r.timestamp?.toISOString?.() || r.timestamp || new Date().toISOString(),
                userId: r.user_id,
                userName: r.user_name,
                userEmail: r.user_email,
                userRole: r.user_role,
                action: r.action,
                module: r.module,
                details: r.details
            }));
        }
        catch {
            return this.inMemoryAuditLogs;
        }
    }
}
exports.AuthService = AuthService;
