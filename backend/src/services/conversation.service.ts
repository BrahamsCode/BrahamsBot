import db from '../config/database';
import { randomUUID } from 'crypto';

export interface Conversation {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string | null;
  channel: 'whatsapp' | 'telegram' | 'webchat';
  status: 'active' | 'resolved' | 'transferred' | 'closed';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  last_message?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  sender_id: string | null;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'document';
  metadata: string | null;
  created_at: string;
}

class ConversationService {
  /**
   * Crea o obtiene una conversación existente
   */
  getOrCreateConversation(
    businessId: string,
    customerPhone: string,
    customerName: string | null,
    channel: 'whatsapp' | 'telegram' | 'webchat'
  ): Conversation {
    // Intentar obtener conversación existente
    const existing = db
      .prepare(
        `SELECT * FROM conversations
         WHERE business_id = ? AND customer_phone = ? AND channel = ?`
      )
      .get(businessId, customerPhone, channel) as Conversation | undefined;

    if (existing) {
      return existing;
    }

    // Crear nueva conversación
    const conversationId = randomUUID();
    db.prepare(
      `INSERT INTO conversations (
        id, business_id, customer_phone, customer_name, channel, status
      ) VALUES (?, ?, ?, ?, ?, 'active')`
    ).run(conversationId, businessId, customerPhone, customerName, channel);

    return db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(conversationId) as Conversation;
  }

  /**
   * Guarda un mensaje en la conversación
   */
  saveMessage(
    conversationId: string,
    senderType: 'customer' | 'bot' | 'agent',
    content: string,
    senderId: string | null = null,
    messageType: 'text' | 'image' | 'audio' | 'document' = 'text'
  ): Message {
    const messageId = randomUUID();

    db.prepare(
      `INSERT INTO messages (
        id, conversation_id, sender_type, sender_id, content, message_type
      ) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(messageId, conversationId, senderType, senderId, content, messageType);

    return db
      .prepare('SELECT * FROM messages WHERE id = ?')
      .get(messageId) as Message;
  }

  /**
   * Obtiene todas las conversaciones de un negocio
   */
  getConversations(businessId: string, status?: string): Conversation[] {
    let query = `
      SELECT
        c.*,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_type = 'customer' AND created_at > c.updated_at) as unread_count
      FROM conversations c
      WHERE c.business_id = ?
    `;

    const params: any[] = [businessId];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.updated_at DESC';

    return db.prepare(query).all(...params) as Conversation[];
  }

  /**
   * Obtiene los mensajes de una conversación
   */
  getMessages(conversationId: string, limit: number = 100): Message[] {
    return db
      .prepare(
        `SELECT * FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at ASC
         LIMIT ?`
      )
      .all(conversationId, limit) as Message[];
  }

  /**
   * Actualiza el estado de una conversación
   */
  updateStatus(
    conversationId: string,
    status: 'active' | 'resolved' | 'transferred' | 'closed'
  ): void {
    db.prepare(
      'UPDATE conversations SET status = ?, updated_at = datetime("now") WHERE id = ?'
    ).run(status, conversationId);
  }

  /**
   * Asigna una conversación a un agente
   */
  assignToAgent(conversationId: string, agentId: string | null): void {
    db.prepare(
      'UPDATE conversations SET assigned_to = ?, updated_at = datetime("now") WHERE id = ?'
    ).run(agentId, conversationId);
  }

  /**
   * Obtiene una conversación por ID
   */
  getConversationById(conversationId: string): Conversation | null {
    return (
      (db
        .prepare('SELECT * FROM conversations WHERE id = ?')
        .get(conversationId) as Conversation) || null
    );
  }

  /**
   * Marca los mensajes como leídos
   */
  markAsRead(conversationId: string): void {
    db.prepare(
      'UPDATE conversations SET updated_at = datetime("now") WHERE id = ?'
    ).run(conversationId);
  }
}

export default new ConversationService();
