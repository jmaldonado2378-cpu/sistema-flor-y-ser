"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    /**
     * POST /api/v1/auth/login
     * Autenticación con email y contraseña, devuelve JWT real
     */
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }
            const result = await this.authService.login(email, password);
            if (!result) {
                return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
            }
            res.json(result);
        }
        catch (err) {
            console.error('Error en login:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    /**
     * GET /api/v1/auth/users
     * Lista los usuarios del sistema. Si el solicitante es ADMIN, incluye las claves sincronizadas.
     */
    getUsers = async (req, res) => {
        try {
            const isAdmin = req.user?.role === 'ADMIN';
            const users = await this.authService.getAllUsers(isAdmin);
            res.json({ status: 'SUCCESS', data: users });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
    /**
     * POST /api/v1/auth/users
     * Crea un nuevo usuario del sistema (requiere ADMIN)
     */
    createUser = async (req, res) => {
        try {
            const { name, email, password, role, allowedModules, avatarInitials, avatarUrl, active } = req.body;
            if (!name || !email || !password || !role) {
                return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos' });
            }
            const user = await this.authService.createUser({
                name,
                email,
                password,
                role,
                allowedModules: allowedModules || [],
                avatarInitials,
                avatarUrl,
                active
            }, req.user);
            res.status(201).json({ status: 'SUCCESS', data: user });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
    /**
     * PUT /api/v1/auth/users/:id
     * Actualiza un usuario existente (requiere ADMIN)
     */
    updateUser = async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const user = await this.authService.updateUser(id, updates, req.user);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            res.json({ status: 'SUCCESS', data: user });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
    /**
     * DELETE /api/v1/auth/users/:id
     * Elimina un usuario (protegiendo a los Administradores Principales)
     */
    deleteUser = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.authService.deleteUser(id, req.user);
            if (!result.deleted) {
                return res.status(400).json({ error: result.reason || 'No se pudo eliminar el usuario' });
            }
            res.json({ status: 'SUCCESS', message: 'Usuario eliminado correctamente' });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
    /**
     * GET /api/v1/auth/audit-logs
     * Obtiene el historial de auditoría centralizado en MySQL
     */
    getAuditLogs = async (req, res) => {
        try {
            const limit = Number(req.query.limit) || 250;
            const logs = await this.authService.getAuditLogs(limit);
            res.json({ status: 'SUCCESS', data: logs });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
    /**
     * POST /api/v1/auth/audit-logs
     * Registra un evento de auditoría en MySQL
     */
    createAuditLog = async (req, res) => {
        try {
            const { id, timestamp, userName, userEmail, userRole, action, module, details } = req.body;
            const created = await this.authService.recordAuditLog({
                id,
                timestamp,
                userId: req.user?.userId || null,
                userName: userName || req.user?.name || 'Usuario',
                userEmail: userEmail || req.user?.email || '',
                userRole: userRole || req.user?.role || 'SELLER',
                action: action || 'EVENTO',
                module: module || 'Sistema',
                details: details || ''
            });
            res.status(201).json({ status: 'SUCCESS', data: created });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
    /**
     * POST /api/v1/auth/audit-logs/sync
     * Sincroniza en lote los registros de auditoría locales del navegador hacia MySQL
     */
    syncAuditLogs = async (req, res) => {
        try {
            const logs = Array.isArray(req.body?.logs) ? req.body.logs : [];
            const synced = await this.authService.syncAuditLogsBatch(logs);
            const allLogs = await this.authService.getAuditLogs(250);
            res.json({ status: 'SUCCESS', synced, data: allLogs });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
}
exports.AuthController = AuthController;
