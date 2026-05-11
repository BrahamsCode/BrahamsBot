import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  downloadMediaMessage,
} from 'baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import path from 'path';
import env from '../../config/env';
import ollamaService from '../ai/ollama.service';
import type { Business } from '../../types';
import pino from 'pino';

class WhatsAppService {
  private sockets: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private pairingCodes: Map<string, string> = new Map();
  private logger = pino({ level: env.LOG_LEVEL });

  /**
   * Inicializa una sesión de WhatsApp para un negocio con pairing code
   */
  async initSessionWithPairing(businessId: string, business: Business, phoneNumber: string): Promise<string> {
    try {
      const sessionPath = path.join(env.WHATSAPP_SESSION_PATH, businessId);

      // Usar auth state multi-archivo
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

      // Crear socket de WhatsApp
      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: state.keys,
        },
        printQRInTerminal: false,
        logger: this.logger,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        generateHighQualityLinkPreview: true,
      });

      // Guardar socket en el mapa
      this.sockets.set(businessId, sock);

      // Manejar actualización de credenciales
      sock.ev.on('creds.update', saveCreds);

      // Manejar actualización de conexión
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        // Si la conexión se cerró
        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

          console.log('Conexión cerrada:', lastDisconnect?.error, 'Reconectando:', shouldReconnect);

          if (shouldReconnect) {
            // Intentar reconectar
            await this.initSessionWithPairing(businessId, business, phoneNumber);
          } else {
            // Usuario cerró sesión, limpiar
            this.sockets.delete(businessId);
            this.pairingCodes.delete(businessId);
          }
        }

        // Si conectó exitosamente
        if (connection === 'open') {
          console.log(`✓ WhatsApp conectado para ${business.name}`);
          this.pairingCodes.delete(businessId); // Limpiar código
        }
      });

      // Manejar mensajes entrantes
      sock.ev.on('messages.upsert', async ({ messages }) => {
        await this.handleIncomingMessages(businessId, business, messages);
      });

      // Solicitar pairing code
      if (!state.creds.registered) {
        // Limpiar el número (quitar espacios, guiones, etc)
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

        // Solicitar código de emparejamiento
        const code = await sock.requestPairingCode(cleanPhone);
        this.pairingCodes.set(businessId, code);

        console.log(`📱 Código de emparejamiento para ${business.name}: ${code}`);

        return code;
      }

      return 'already_connected';
    } catch (error) {
      console.error(`Error al iniciar sesión de WhatsApp para ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Inicializa una sesión de WhatsApp para un negocio (método legacy con QR)
   */
  async initSession(businessId: string, business: Business): Promise<string | null> {
    try {
      const sessionPath = path.join(env.WHATSAPP_SESSION_PATH, businessId);

      // Usar auth state multi-archivo
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

      // Crear socket de WhatsApp
      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: state.keys,
        },
        printQRInTerminal: false,
        logger: this.logger,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        generateHighQualityLinkPreview: true,
      });

      // Guardar socket en el mapa
      this.sockets.set(businessId, sock);

      // Manejar actualización de credenciales
      sock.ev.on('creds.update', saveCreds);

      // Manejar actualización de conexión
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Si hay QR code, generarlo y guardarlo
        if (qr) {
          const qrDataURL = await qrcode.toDataURL(qr);
          this.qrCodes.set(businessId, qrDataURL);
          console.log(`📱 QR Code generado para ${business.name}`);
        }

        // Si la conexión se cerró
        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

          console.log('Conexión cerrada:', lastDisconnect?.error, 'Reconectando:', shouldReconnect);

          if (shouldReconnect) {
            // Intentar reconectar
            await this.initSession(businessId, business);
          } else {
            // Usuario cerró sesión, limpiar
            this.sockets.delete(businessId);
            this.qrCodes.delete(businessId);
          }
        }

        // Si conectó exitosamente
        if (connection === 'open') {
          console.log(`✓ WhatsApp conectado para ${business.name}`);
          this.qrCodes.delete(businessId); // Limpiar QR
        }
      });

      // Manejar mensajes entrantes
      sock.ev.on('messages.upsert', async ({ messages }) => {
        await this.handleIncomingMessages(businessId, business, messages);
      });

      // Esperar hasta 10 segundos para que se genere el QR
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 20; // 10 segundos (20 * 500ms)

        const checkQR = () => {
          const qr = this.qrCodes.get(businessId);
          if (qr) {
            resolve(qr);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkQR, 500);
          } else {
            resolve(null); // Timeout, retornar null
          }
        };

        checkQR();
      });
    } catch (error) {
      console.error(`Error al iniciar sesión de WhatsApp para ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Maneja mensajes entrantes de WhatsApp
   */
  private async handleIncomingMessages(
    businessId: string,
    business: Business,
    messages: proto.IWebMessageInfo[]
  ) {
    for (const msg of messages) {
      // Ignorar mensajes propios
      if (msg.key.fromMe) continue;

      // Obtener el texto del mensaje
      const messageText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      if (!messageText) continue;

      const remoteJid = msg.key.remoteJid!;
      const customerName = msg.pushName || 'Cliente';

      console.log(`📩 Mensaje de ${customerName}: ${messageText}`);

      try {
        // Verificar si debe transferir a humano
        const shouldTransfer = await ollamaService.shouldTransferToHuman(messageText);

        if (shouldTransfer) {
          await this.sendMessage(
            businessId,
            remoteJid,
            '👤 Entiendo, te voy a transferir con uno de nuestros agentes humanos. Por favor espera un momento.'
          );
          // TODO: Implementar lógica de transferencia
          continue;
        }

        // Generar respuesta con IA
        const aiResponse = await ollamaService.generateResponse(
          messageText,
          business
        );

        // Enviar respuesta
        await this.sendMessage(businessId, remoteJid, aiResponse);

        // TODO: Guardar conversación en base de datos
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
        await this.sendMessage(
          businessId,
          remoteJid,
          'Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?'
        );
      }
    }
  }

  /**
   * Envía un mensaje de WhatsApp
   */
  async sendMessage(businessId: string, to: string, text: string): Promise<void> {
    const sock = this.sockets.get(businessId);

    if (!sock) {
      throw new Error(`No hay sesión activa para el negocio ${businessId}`);
    }

    try {
      await sock.sendMessage(to, { text });
      console.log(`✓ Mensaje enviado a ${to}`);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtiene el QR code para un negocio
   */
  getQRCode(businessId: string): string | null {
    return this.qrCodes.get(businessId) || null;
  }

  /**
   * Verifica si hay una sesión activa
   */
  hasActiveSession(businessId: string): boolean {
    return this.sockets.has(businessId);
  }

  /**
   * Cierra una sesión de WhatsApp
   */
  async closeSession(businessId: string): Promise<void> {
    const sock = this.sockets.get(businessId);

    if (sock) {
      await sock.logout();
      this.sockets.delete(businessId);
      this.qrCodes.delete(businessId);
      console.log(`✓ Sesión cerrada para ${businessId}`);
    }
  }

  /**
   * Obtiene el código de emparejamiento
   */
  getPairingCode(businessId: string): string | null {
    return this.pairingCodes.get(businessId) || null;
  }

  /**
   * Obtiene el estado de una sesión
   */
  getSessionStatus(businessId: string): 'connected' | 'connecting' | 'disconnected' {
    const hasSession = this.sockets.has(businessId);
    const hasQR = this.qrCodes.has(businessId);
    const hasPairingCode = this.pairingCodes.has(businessId);

    if (hasSession && !hasQR && !hasPairingCode) return 'connected';
    if (hasQR || hasPairingCode) return 'connecting';
    return 'disconnected';
  }
}

export default new WhatsAppService();
