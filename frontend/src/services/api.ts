import axios from 'axios';
import type { ApiResponse, WhatsAppSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Crear instancia de axios
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// WHATSAPP API
// ============================================

export const whatsappApi = {
  /**
   * Inicializa una sesión de WhatsApp
   */
  async initSession(businessId: string): Promise<ApiResponse<{ qrCode?: string }>> {
    const { data } = await api.post(`/api/whatsapp/init/${businessId}`);
    return data;
  },

  /**
   * Obtiene el código QR de WhatsApp
   */
  async getQRCode(businessId: string): Promise<ApiResponse<{ qrCode: string }>> {
    const { data } = await api.get(`/api/whatsapp/qr/${businessId}`);
    return data;
  },

  /**
   * Obtiene el estado de la sesión
   */
  async getStatus(businessId: string): Promise<ApiResponse<{ status: WhatsAppSession['status'] }>> {
    const { data } = await api.get(`/api/whatsapp/status/${businessId}`);
    return data;
  },

  /**
   * Cierra la sesión de WhatsApp
   */
  async closeSession(businessId: string): Promise<ApiResponse> {
    const { data } = await api.delete(`/api/whatsapp/session/${businessId}`);
    return data;
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthApi = {
  /**
   * Verifica el estado del servidor
   */
  async check(): Promise<ApiResponse> {
    const { data } = await api.get('/health');
    return data;
  },
};

export default api;
