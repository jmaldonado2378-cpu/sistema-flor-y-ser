import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware de Autenticación JWT
 * 
 * Verifica el token Bearer en el header Authorization.
 * Si es válido, agrega `req.user` con los datos del usuario decodificado.
 * Si no, responde 401 Unauthorized.
 */

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'SELLER';
  name: string;
}

// Extender el tipo Request de Express para incluir `user`
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'floryser_jwt_secret_key_2026_safe';

/**
 * Middleware que requiere autenticación JWT en la ruta
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
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
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
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
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });
}

/**
 * Genera un refresh token con mayor duración
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}
