const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DashboardStats {
  conversationsToday: number;
  conversationsTodayChange: string;
  aiAutomation: number;
  aiAutomationChange: string;
  activeCustomers: number;
  activeCustomersChange: string;
  satisfaction: number;
  satisfactionChange: string;
}

export interface ConversationsByHour {
  hour: string;
  conversaciones: number;
}

export interface ResponseTimeByDay {
  day: string;
  tiempo: number;
}

class ApiService {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  // Métricas
  async getStats(): Promise<DashboardStats> {
    return this.fetch<DashboardStats>('/api/metrics/stats');
  }

  async getConversationsByHour(): Promise<ConversationsByHour[]> {
    return this.fetch<ConversationsByHour[]>('/api/metrics/conversations-by-hour');
  }

  async getResponseTime(): Promise<ResponseTimeByDay[]> {
    return this.fetch<ResponseTimeByDay[]>('/api/metrics/response-time');
  }

  async getRecentConversations(limit: number = 10) {
    return this.fetch(`/api/metrics/recent-conversations?limit=${limit}`);
  }

  // WhatsApp
  async initWhatsAppSession(businessId: string) {
    const response = await fetch(`${API_URL}/api/whatsapp/init/${businessId}`, {
      method: 'POST',
    });
    return response.json();
  }

  async getWhatsAppQR(businessId: string) {
    const response = await fetch(`${API_URL}/api/whatsapp/qr/${businessId}`);
    return response.json();
  }

  async getWhatsAppStatus(businessId: string) {
    const response = await fetch(`${API_URL}/api/whatsapp/status/${businessId}`);
    return response.json();
  }

  async closeWhatsAppSession(businessId: string) {
    const response = await fetch(`${API_URL}/api/whatsapp/session/${businessId}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export default new ApiService();
