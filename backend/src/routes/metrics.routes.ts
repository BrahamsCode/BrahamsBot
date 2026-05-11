import { Router } from 'express';
import metricsService from '../services/metrics.service';

const router = Router();

// GET /api/metrics/stats - Estadísticas generales del dashboard
router.get('/stats', (req, res) => {
  try {
    const stats = metricsService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
    });
  }
});

// GET /api/metrics/conversations-by-hour - Conversaciones por hora
router.get('/conversations-by-hour', (req, res) => {
  try {
    const data = metricsService.getConversationsByHour();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones por hora:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener conversaciones por hora',
    });
  }
});

// GET /api/metrics/response-time - Tiempo de respuesta por día
router.get('/response-time', (req, res) => {
  try {
    const data = metricsService.getResponseTimeByDay();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error obteniendo tiempo de respuesta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tiempo de respuesta',
    });
  }
});

// GET /api/metrics/recent-conversations - Conversaciones recientes
router.get('/recent-conversations', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = metricsService.getRecentConversations(limit);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones recientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener conversaciones recientes',
    });
  }
});

export default router;
