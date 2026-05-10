// ============================================
// TIPOS PRINCIPALES DEL SISTEMA
// ============================================

export interface Business {
  id: string;
  name: string;
  description: string;
  industry: string; // restaurante, tienda, hotel, etc.
  phone?: string;
  email?: string;
  website?: string;
  knowledge_base: string; // Base de conocimiento para la IA
  ai_personality: string; // Personalidad de la IA (formal, casual, etc.)
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name?: string;
  channel: 'whatsapp' | 'telegram' | 'webchat';
  status: 'active' | 'resolved' | 'transferred' | 'closed';
  assigned_to?: string; // ID del agente humano si fue transferido
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  sender_id?: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'document';
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface WhatsAppSession {
  business_id: string;
  phone_number: string;
  qr_code?: string;
  status: 'disconnected' | 'connecting' | 'connected';
  last_seen?: Date;
}

export interface TelegramBot {
  business_id: string;
  bot_token: string;
  bot_username: string;
  status: 'active' | 'inactive';
  created_at: Date;
}

// ============================================
// TIPOS PARA GROQ API
// ============================================

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatRequest {
  messages: GroqMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: GroqMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================
// TIPOS PARA WHATSAPP (BAILEYS)
// ============================================

export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

// ============================================
// TIPOS PARA ANALYTICS
// ============================================

export interface ConversationMetrics {
  total_conversations: number;
  active_conversations: number;
  avg_response_time: number; // en segundos
  satisfaction_rate: number; // 0-100
  resolved_by_bot: number;
  transferred_to_human: number;
}
