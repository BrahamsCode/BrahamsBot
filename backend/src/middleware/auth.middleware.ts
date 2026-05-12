import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import db from '../config/database';

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * Middleware para verificar autenticación
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado. Token requerido.',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    const user = await authService.verifyToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return res.status(401).json({
      success: false,
      error: 'Error de autenticación',
    });
  }
}

/**
 * Middleware para verificar acceso a un negocio
 */
export function businessAccessMiddleware(req: Request, res: Response, next: NextFunction) {
  const { businessId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado',
    });
  }

  if (!businessId) {
    return res.status(400).json({
      success: false,
      error: 'Business ID requerido',
    });
  }

  // Verificar que el usuario tenga acceso al negocio
  const hasAccess = authService.hasAccessToBusiness(userId, businessId);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: 'No tienes acceso a este negocio',
    });
  }

  next();
}

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continuar sin usuario autenticado
    next();
  }
}
