"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            if (!result) {
                return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
            }
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
}
exports.AuthController = AuthController;
