import { Router } from 'express';
import conversationService from '../services/conversation.service';
import telegramService from '../services/telegram/telegram.service';

const router = Router();

// GET /api/conversations/:businessId - Obtener todas las conversaciones
router.get('/:businessId', (req, res) => {
  try {
    const { businessId } = req.params;
    const { status } = req.query;

    const conversations = conversationService.getConversations(
      businessId,
      status as string | undefined
    );

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener conversaciones',
    });
  }
});

// GET /api/conversations/:businessId/:conversationId/messages - Obtener mensajes
router.get('/:businessId/:conversationId/messages', (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const messages = conversationService.getMessages(conversationId, limit);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener mensajes',
    });
  }
});

// POST /api/conversations/:businessId/:conversationId/messages - Enviar mensaje como agente
router.post('/:businessId/:conversationId/messages', async (req, res) => {
  try {
    const { businessId, conversationId } = req.params;
    const { message, agentId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Mensaje requerido',
      });
    }

    // Obtener conversación
    const conversation = conversationService.getConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversación no encontrada',
      });
    }

    // Enviar mensaje según el canal
    if (conversation.channel === 'telegram') {
      await telegramService.sendMessageAsAgent(
        businessId,
        conversation.customer_phone,
        message,
        agentId || 'human'
      );
    }
    // TODO: Agregar soporte para WhatsApp y webchat

    res.json({
      success: true,
      message: 'Mensaje enviado',
    });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar mensaje',
    });
  }
});

// PATCH /api/conversations/:businessId/:conversationId/status - Actualizar estado
router.patch('/:businessId/:conversationId/status', (req, res) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!['active', 'resolved', 'transferred', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido',
      });
    }

    conversationService.updateStatus(conversationId, status);

    res.json({
      success: true,
      message: 'Estado actualizado',
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado',
    });
  }
});

// PATCH /api/conversations/:businessId/:conversationId/assign - Asignar a agente
router.patch('/:businessId/:conversationId/assign', (req, res) => {
  try {
    const { conversationId } = req.params;
    const { agentId } = req.body;

    conversationService.assignToAgent(conversationId, agentId);

    res.json({
      success: true,
      message: 'Conversación asignada',
    });
  } catch (error) {
    console.error('Error asignando conversación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al asignar conversación',
    });
  }
});

// POST /api/conversations/:businessId/:conversationId/read - Marcar como leída
router.post('/:businessId/:conversationId/read', (req, res) => {
  try {
    const { conversationId } = req.params;

    conversationService.markAsRead(conversationId);

    res.json({
      success: true,
      message: 'Marcada como leída',
    });
  } catch (error) {
    console.error('Error marcando como leída:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar como leída',
    });
  }
});

export default router;
