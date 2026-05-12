import { Router } from 'express';
import authService from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error en /register:', error);

    res.status(400).json({
      success: false,
      error: error.message || 'Error al registrar usuario',
    });
  }
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: result,
    });
  } catch (error: any) {
    console.error('Error en /login:', error);

    res.status(401).json({
      success: false,
      error: error.message || 'Error al iniciar sesión',
    });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (token) {
      await authService.logout(token);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error: any) {
    console.error('Error en /logout:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Error al cerrar sesión',
    });
  }
});

/**
 * GET /api/auth/me
 * Obtener datos del usuario autenticado
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Obtener negocios del usuario
    const businesses = authService.getUserBusinesses(req.user!.id);

    res.json({
      success: true,
      data: {
        user: req.user,
        businesses,
      },
    });
  } catch (error: any) {
    console.error('Error en /me:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener datos del usuario',
    });
  }
});

/**
 * GET /api/auth/businesses
 * Obtener negocios del usuario autenticado
 */
router.get('/businesses', authMiddleware, async (req, res) => {
  try {
    const businesses = authService.getUserBusinesses(req.user!.id);

    res.json({
      success: true,
      data: businesses,
    });
  } catch (error: any) {
    console.error('Error en /businesses:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener negocios',
    });
  }
});

export default router;
