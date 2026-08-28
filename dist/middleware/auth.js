"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.generateToken = generateToken;
exports.generateRefreshToken = generateRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'floryser_jwt_secret_key_2026_safe';
/**
 * Middleware que requiere autenticación JWT en la ruta
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token de autenticación requerido' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Token expirado. Inicie sesión nuevamente.' });
            return;
        }
        res.status(401).json({ error: 'Token inválido' });
        return;
    }
}
/**
 * Middleware que requiere un rol específico (se usa después de requireAuth)
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'No tiene permisos para acceder a este recurso' });
            return;
        }
        next();
    };
}
/**
 * Genera un token JWT para un usuario autenticado
 */
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '24h',
    });
}
/**
 * Genera un refresh token con mayor duración
 */
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '7d',
    });
}
