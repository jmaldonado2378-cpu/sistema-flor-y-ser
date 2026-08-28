"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../middleware/auth");
// Usuarios por defecto para fallback en memoria (se usan si la BD no está disponible)
const DEFAULT_USERS = [
    {
        id: 'usr-admin-1',
        name: 'Juan Pablo (Administrador)',
        email: 'jmaldonado2378@gmail.com',
        password_hash: '', // Se hashea al inicializar
        role: 'ADMIN',
        allowed_modules_json: JSON.stringify([
            'dashboard', 'customers', 'stock', 'article_families',
            'merchandise_receipt', 'fractioning', 'new_sale', 'kanban_orders', 'kanban_tasks',
            'suppliers', 'checking_accounts', 'finance', 'settings', 'marketing', 'users'
        ]),
        avatar_initials: 'JP',
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'usr-seller-1',
        name: 'Emilia Maldonado Hernandez',
        email: 'memimaldonado05@gmail.com',
        password_hash: '',
        role: 'SELLER',
        allowed_modules_json: JSON.stringify(['dashboard', 'customers', 'stock', 'new_sale', 'kanban_orders', 'fractioning']),
        avatar_initials: 'EH',
        active: true,
        created_at: new Date().toISOString()
    }
];
// Contraseñas por defecto (se hashean al inicializar)
const DEFAULT_PASSWORDS = {
    'jmaldonado2378@gmail.com': 'admin123',
    'memimaldonado05@gmail.com': 'LaJefa3012'
};
class AuthService {
    db; // MySQLAdapter compatible con pg.Pool interface
    inMemoryUsers = [];
    initialized = false;
    constructor(db) {
        this.db = db;
        this.initializeDefaults();
    }
    /**
     * Inicializa los hashes de contraseñas para los usuarios en memoria
     */
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
     * Autenticación: valida email + contraseña contra la BD o fallback en memoria
     */
    async login(email, password) {
        // Asegurar que los defaults están inicializados
        await this.initializeDefaults();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = password.trim();
        try {
            // Buscar usuario por email (sin restringir active en SQL para auto-reparar si estuviera inactivo)
            const result = await this.db.query('SELECT id, name, email, password_hash, role, allowed_modules_json, avatar_initials, active, created_at FROM system_users WHERE LOWER(email) = ?', [cleanEmail]);
            if (result.rows.length > 0) {
                const dbUser = result.rows[0];
                let passwordMatch = await bcrypt_1.default.compare(cleanPass, dbUser.password_hash);
                // Auto-Reparación: si la contraseña no coincide pero ingresó la clave oficial por defecto
                const expectedDefaultPass = DEFAULT_PASSWORDS[cleanEmail];
                if (!passwordMatch && expectedDefaultPass && cleanPass === expectedDefaultPass) {
                    console.log(`🔧 Auto-reparando hash de contraseña para ${cleanEmail}...`);
                    const realHash = await bcrypt_1.default.hash(cleanPass, 10);
                    try {
                        await this.db.query('UPDATE system_users SET password_hash = ?, active = 1 WHERE id = ?', [realHash, dbUser.id]);
                        dbUser.password_hash = realHash;
                        dbUser.active = 1;
                        passwordMatch = true;
                    }
                    catch (updateErr) {
                        console.error('Error al auto-reparar hash de usuario en BD:', updateErr);
                    }
                }
                const isActive = Boolean(dbUser.active == 1 || dbUser.active === true || dbUser.active === '1');
                if (passwordMatch && isActive) {
                    return this.buildLoginResult(dbUser);
                }
                return null;
            }
            // Auto-Creación en BD si el usuario es uno de los administradores/vendedores oficiales por defecto
            const defaultUser = DEFAULT_USERS.find(u => u.email.toLowerCase() === cleanEmail);
            const expectedDefaultPass = DEFAULT_PASSWORDS[cleanEmail];
            if (defaultUser && expectedDefaultPass && cleanPass === expectedDefaultPass) {
                console.log(`🔧 Auto-creando usuario por defecto ${cleanEmail} en la base de datos...`);
                const realHash = await bcrypt_1.default.hash(cleanPass, 10);
                try {
                    await this.db.query(`INSERT INTO system_users (id, name, email, password_hash, role, allowed_modules_json, avatar_initials, active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE password_hash = ?, active = 1`, [
                        defaultUser.id,
                        defaultUser.name,
                        defaultUser.email,
                        realHash,
                        defaultUser.role,
                        defaultUser.allowed_modules_json,
                        defaultUser.avatar_initials,
                        realHash
                    ]);
                    defaultUser.password_hash = realHash;
                    defaultUser.active = true;
                    return this.buildLoginResult(defaultUser);
                }
                catch (insertErr) {
                    console.error('Error al auto-crear usuario en BD:', insertErr);
                }
            }
            // Si no está en BD ni se auto-creó, probar fallback en memoria
            return this.loginInMemory(cleanEmail, cleanPass);
        }
        catch (err) {
            console.warn('⚠️ Base de datos no disponible para auth, usando fallback en memoria');
            return this.loginInMemory(cleanEmail, cleanPass);
        }
    }
    /**
     * Fallback: autenticación en memoria
     */
    async loginInMemory(email, password) {
        const user = this.inMemoryUsers.find(u => u.email.toLowerCase() === email && u.active);
        if (!user)
            return null;
        const passwordMatch = await bcrypt_1.default.compare(password, user.password_hash);
        if (!passwordMatch)
            return null;
        return this.buildLoginResult(user);
    }
    /**
     * Construye el resultado de login con tokens JWT
     */
    buildLoginResult(dbUser) {
        const allowedModules = typeof dbUser.allowed_modules_json === 'string'
            ? JSON.parse(dbUser.allowed_modules_json)
            : dbUser.allowed_modules_json || [];
        const userDTO = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            allowedModules: allowedModules,
            avatarInitials: dbUser.avatar_initials || dbUser.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
            active: Boolean(dbUser.active),
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
     * Registra un nuevo usuario en la base de datos
     */
    async createUser(data) {
        const id = (0, uuid_1.v4)();
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        const initials = data.avatarInitials || data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const modulesJson = JSON.stringify(data.allowedModules);
        try {
            await this.db.query(`INSERT INTO system_users (id, name, email, password_hash, role, allowed_modules_json, avatar_initials, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`, [id, data.name, data.email.toLowerCase(), passwordHash, data.role, modulesJson, initials]);
            return {
                id,
                name: data.name,
                email: data.email.toLowerCase(),
                role: data.role,
                allowedModules: data.allowedModules,
                avatarInitials: initials,
                active: true,
                createdAt: new Date().toISOString()
            };
        }
        catch (err) {
            // Fallback: crear en memoria
            const newUser = {
                id,
                name: data.name,
                email: data.email.toLowerCase(),
                password_hash: passwordHash,
                role: data.role,
                allowed_modules_json: modulesJson,
                avatar_initials: initials,
                active: true,
                created_at: new Date().toISOString()
            };
            this.inMemoryUsers.push(newUser);
            return {
                id,
                name: data.name,
                email: data.email.toLowerCase(),
                role: data.role,
                allowedModules: data.allowedModules,
                avatarInitials: initials,
                active: true,
                createdAt: newUser.created_at
            };
        }
    }
    /**
     * Lista todos los usuarios (sin password_hash)
     */
    async getAllUsers() {
        try {
            const result = await this.db.query('SELECT id, name, email, role, allowed_modules_json, avatar_initials, active, created_at FROM system_users ORDER BY created_at');
            return result.rows.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                allowedModules: typeof u.allowed_modules_json === 'string' ? JSON.parse(u.allowed_modules_json) : u.allowed_modules_json || [],
                avatarInitials: u.avatar_initials,
                active: Boolean(u.active),
                createdAt: u.created_at?.toISOString?.() || u.created_at
            }));
        }
        catch (err) {
            return this.inMemoryUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                allowedModules: typeof u.allowed_modules_json === 'string' ? JSON.parse(u.allowed_modules_json) : u.allowed_modules_json || [],
                avatarInitials: u.avatar_initials,
                active: Boolean(u.active),
                createdAt: u.created_at
            }));
        }
    }
    /**
     * Actualiza un usuario existente
     */
    async updateUser(userId, updates) {
        const setClauses = [];
        const params = [];
        if (updates.name) {
            setClauses.push('name = ?');
            params.push(updates.name);
        }
        if (updates.email) {
            setClauses.push('email = ?');
            params.push(updates.email.toLowerCase());
        }
        if (updates.password) {
            setClauses.push('password_hash = ?');
            params.push(await bcrypt_1.default.hash(updates.password, 10));
        }
        if (updates.role) {
            setClauses.push('role = ?');
            params.push(updates.role);
        }
        if (updates.allowedModules) {
            setClauses.push('allowed_modules_json = ?');
            params.push(JSON.stringify(updates.allowedModules));
        }
        if (updates.avatarInitials) {
            setClauses.push('avatar_initials = ?');
            params.push(updates.avatarInitials);
        }
        if (typeof updates.active === 'boolean') {
            setClauses.push('active = ?');
            params.push(updates.active ? 1 : 0);
        }
        if (setClauses.length === 0)
            return null;
        params.push(userId);
        try {
            await this.db.query(`UPDATE system_users SET ${setClauses.join(', ')} WHERE id = ?`, params);
            const result = await this.db.query('SELECT id, name, email, role, allowed_modules_json, avatar_initials, active, created_at FROM system_users WHERE id = ?', [userId]);
            if (result.rows.length === 0)
                return null;
            const u = result.rows[0];
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                allowedModules: typeof u.allowed_modules_json === 'string' ? JSON.parse(u.allowed_modules_json) : u.allowed_modules_json || [],
                avatarInitials: u.avatar_initials,
                active: Boolean(u.active),
                createdAt: u.created_at?.toISOString?.() || u.created_at
            };
        }
        catch (err) {
            // Fallback en memoria
            const user = this.inMemoryUsers.find(u => u.id === userId);
            if (!user)
                return null;
            Object.assign(user, updates);
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                allowedModules: typeof user.allowed_modules_json === 'string' ? JSON.parse(user.allowed_modules_json) : [],
                avatarInitials: user.avatar_initials,
                active: Boolean(user.active),
                createdAt: user.created_at
            };
        }
    }
    /**
     * Elimina (desactiva) un usuario
     */
    async deleteUser(userId) {
        try {
            const result = await this.db.query('UPDATE system_users SET active = 0 WHERE id = ?', [userId]);
            return result.rowCount > 0;
        }
        catch (err) {
            const user = this.inMemoryUsers.find(u => u.id === userId);
            if (user) {
                user.active = false;
                return true;
            }
            return false;
        }
    }
}
exports.AuthService = AuthService;
