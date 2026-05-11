import TelegramBot from 'node-telegram-bot-api';
import env from '../../config/env';
import ollamaService from '../ai/ollama.service';
import conversationService from '../conversation.service';
import type { Business } from '../../types';
import db from '../../config/database';

class TelegramService {
  private bots: Map<string, TelegramBot> = new Map();
  private io: any = null; // Socket.IO instance

  setSocketIO(io: any) {
    this.io = io;
  }

  private emitNewMessage(businessId: string, conversationId: string, senderType: string, content: string) {
    if (this.io) {
      this.io.emit('new_message', {
        businessId,
        conversationId,
        senderType,
        content,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Inicializa un bot de Telegram para un negocio
   */
  async initBot(businessId: string, token: string): Promise<void> {
    try {
      // Verificar si ya existe un bot para este negocio
      if (this.bots.has(businessId)) {
        console.log(`Bot de Telegram ya existe para ${businessId}`);
        return;
      }

      // Crear bot de Telegram
      const bot = new TelegramBot(token, { polling: true });

      // Guardar bot en el mapa
      this.bots.set(businessId, bot);

      // Obtener datos del negocio
      const businessQuery = db.prepare('SELECT * FROM businesses WHERE id = ?');
      const business = businessQuery.get(businessId) as Business;

      if (!business) {
        throw new Error('Negocio no encontrado');
      }

      console.log(`✓ Bot de Telegram iniciado para ${business.name}`);

      // Manejar comando /start
      bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `¡Hola! 👋 Soy el asistente virtual de ${business.name}.

${business.description || ''}

¿En qué puedo ayudarte hoy?`;

        await bot.sendMessage(chatId, welcomeMessage);
      });

      // Manejar todos los mensajes
      bot.on('message', async (msg) => {
        // Ignorar comandos
        if (msg.text?.startsWith('/')) return;

        const chatId = msg.chat.id;
        const userMessage = msg.text || '';

        if (!userMessage) return;

        const userName = msg.from?.first_name || 'Usuario';
        const customerPhone = `telegram_${chatId}`;

        console.log(`📩 Mensaje de ${userName} (Telegram): ${userMessage}`);

        try {
          // Obtener o crear conversación
          const conversation = conversationService.getOrCreateConversation(
            businessId,
            customerPhone,
            userName,
            'telegram'
          );

          // Guardar mensaje del cliente
          conversationService.saveMessage(
            conversation.id,
            'customer',
            userMessage
          );

          // Indicar que está escribiendo
          await bot.sendChatAction(chatId, 'typing');

          // Verificar si debe transferir a humano
          const shouldTransfer = await ollamaService.shouldTransferToHuman(userMessage);

          if (shouldTransfer) {
            const transferMsg = '👤 Entiendo, te voy a transferir con uno de nuestros agentes humanos. Por favor espera un momento.';
            await bot.sendMessage(chatId, transferMsg);

            // Guardar mensaje del bot
            conversationService.saveMessage(
              conversation.id,
              'bot',
              transferMsg
            );

            // Actualizar estado a transferido
            conversationService.updateStatus(conversation.id, 'transferred');

            // Emitir evento WebSocket
            this.emitNewMessage(businessId, conversation.id, 'customer', userMessage);

            return;
          }

          // Generar respuesta con IA
          const aiResponse = await ollamaService.generateResponse(
            userMessage,
            business
          );

          // Enviar respuesta
          await bot.sendMessage(chatId, aiResponse);

          // Guardar mensaje del bot
          conversationService.saveMessage(
            conversation.id,
            'bot',
            aiResponse
          );

          // Emitir evento WebSocket
          this.emitNewMessage(businessId, conversation.id, 'customer', userMessage);
          this.emitNewMessage(businessId, conversation.id, 'bot', aiResponse);

        } catch (error) {
          console.error('Error al procesar mensaje de Telegram:', error);
          await bot.sendMessage(
            chatId,
            'Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?'
          );
        }
      });

      // Manejar errores del bot
      bot.on('polling_error', (error) => {
        console.error('Error en polling de Telegram:', error);
      });

    } catch (error) {
      console.error(`Error al iniciar bot de Telegram para ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Detiene un bot de Telegram
   */
  async stopBot(businessId: string): Promise<void> {
    const bot = this.bots.get(businessId);

    if (bot) {
      await bot.stopPolling();
      this.bots.delete(businessId);
      console.log(`✓ Bot de Telegram detenido para ${businessId}`);
    }
  }

  /**
   * Verifica si hay un bot activo
   */
  hasActiveBot(businessId: string): boolean {
    return this.bots.has(businessId);
  }

  /**
   * Obtiene el estado de un bot
   */
  getBotStatus(businessId: string): 'active' | 'inactive' {
    return this.bots.has(businessId) ? 'active' : 'inactive';
  }

  /**
   * Obtiene información del bot
   */
  async getBotInfo(businessId: string): Promise<any> {
    const bot = this.bots.get(businessId);

    if (!bot) {
      return null;
    }

    try {
      const me = await bot.getMe();
      return {
        id: me.id,
        username: me.username,
        first_name: me.first_name,
        is_bot: me.is_bot,
      };
    } catch (error) {
      console.error('Error al obtener info del bot:', error);
      return null;
    }
  }

  /**
   * Envía un mensaje como agente humano
   */
  async sendMessageAsAgent(
    businessId: string,
    customerPhone: string,
    message: string,
    agentId: string = 'human'
  ): Promise<void> {
    const bot = this.bots.get(businessId);

    if (!bot) {
      throw new Error('Bot no encontrado');
    }

    // Extraer chatId del customerPhone (formato: telegram_CHATID)
    const chatId = customerPhone.replace('telegram_', '');

    // Enviar mensaje
    await bot.sendMessage(chatId, message);

    // Guardar en conversación
    const conversation = conversationService.getOrCreateConversation(
      businessId,
      customerPhone,
      null,
      'telegram'
    );

    conversationService.saveMessage(
      conversation.id,
      'agent',
      message,
      agentId
    );

    // Actualizar estado si estaba transferido
    if (conversation.status === 'transferred') {
      conversationService.updateStatus(conversation.id, 'active');
    }

    // Emitir evento WebSocket
    this.emitNewMessage(businessId, conversation.id, 'agent', message);
  }
}

export default new TelegramService();
