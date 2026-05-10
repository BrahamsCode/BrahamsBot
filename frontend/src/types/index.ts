// ============================================
// TIPOS DEL FRONTEND
// ============================================

export interface Business {
  id: string;
  name: string;
  description: string;
  industry: string;
  phone?: string;
  email?: string;
  website?: string;
  knowledge_base: string;
  ai_personality: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name?: string;
  channel: 'whatsapp' | 'telegram' | 'webchat';
  status: 'active' | 'resolved' | 'transferred' | 'closed';
  assigned_to?: string;
  last_message?: Message;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  sender_id?: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'document';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WhatsAppSession {
  business_id: string;
  phone_number: string;
  qr_code?: string;
  status: 'disconnected' | 'connecting' | 'connected';
  last_seen?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConversationMetrics {
  total_conversations: number;
  active_conversations: number;
  avg_response_time: number;
  satisfaction_rate: number;
  resolved_by_bot: number;
  transferred_to_human: number;
}
