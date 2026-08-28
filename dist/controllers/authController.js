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
     * Lista todos los usuarios del sistema (requiere ADMIN)
     */
    getUsers = async (req, res) => {
        try {
            const users = await this.authService.getAllUsers();
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
            const { name, email, password, role, allowedModules, avatarInitials } = req.body;
            if (!name || !email || !password || !role) {
                return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos' });
            }
            const user = await this.authService.createUser({
                name,
                email,
                password,
                role,
                allowedModules: allowedModules || [],
                avatarInitials
            });
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
            const user = await this.authService.updateUser(id, updates);
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
     * Desactiva un usuario (requiere ADMIN)
     */
    deleteUser = async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await this.authService.deleteUser(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            res.json({ status: 'SUCCESS', message: 'Usuario desactivado' });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
}
exports.AuthController = AuthController;
