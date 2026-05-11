import db from '../config/database';

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

class MetricsService {
  // Obtener estadísticas del dashboard
  getStats(): DashboardStats {
    try {
      // Total de conversaciones hoy
      const today = new Date().toISOString().split('T')[0];
      const conversationsToday = db
        .prepare(
          `SELECT COUNT(*) as count FROM conversations
           WHERE DATE(created_at) = DATE('now')`
        )
        .get() as { count: number };

      // Total de conversaciones ayer (para calcular cambio)
      const conversationsYesterday = db
        .prepare(
          `SELECT COUNT(*) as count FROM conversations
           WHERE DATE(created_at) = DATE('now', '-1 day')`
        )
        .get() as { count: number };

      // Total de clientes únicos activos (últimos 30 días)
      const activeCustomers = db
        .prepare(
          `SELECT COUNT(DISTINCT customer_phone) as count FROM conversations
           WHERE created_at >= DATE('now', '-30 days')`
        )
        .get() as { count: number };

      // Total de mensajes enviados por bot vs total de mensajes
      const botMessages = db
        .prepare(
          `SELECT COUNT(*) as count FROM messages WHERE sender_type = 'bot'`
        )
        .get() as { count: number };

      const totalMessages = db
        .prepare(`SELECT COUNT(*) as count FROM messages`)
        .get() as { count: number };

      // Calcular porcentaje de automatización
      const aiAutomation =
        totalMessages.count > 0
          ? Math.round((botMessages.count / totalMessages.count) * 100)
          : 0;

      // Calcular cambio porcentual de conversaciones
      const conversationChange =
        conversationsYesterday.count > 0
          ? Math.round(
              ((conversationsToday.count - conversationsYesterday.count) /
                conversationsYesterday.count) *
                100
            )
          : conversationsToday.count > 0
          ? 100
          : 0;

      return {
        conversationsToday: conversationsToday.count,
        conversationsTodayChange: `${conversationChange >= 0 ? '+' : ''}${conversationChange}%`,
        aiAutomation,
        aiAutomationChange: '+5%', // Placeholder - se puede calcular comparando con periodo anterior
        activeCustomers: activeCustomers.count,
        activeCustomersChange: '+12%', // Placeholder
        satisfaction: 94, // Placeholder - requiere implementar sistema de ratings
        satisfactionChange: '+2%', // Placeholder
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Obtener conversaciones por hora del día actual
  getConversationsByHour(): ConversationsByHour[] {
    try {
      const results = db
        .prepare(
          `
        SELECT
          strftime('%H:00', created_at) as hour,
          COUNT(*) as conversaciones
        FROM conversations
        WHERE DATE(created_at) = DATE('now')
        GROUP BY strftime('%H', created_at)
        ORDER BY hour
      `
        )
        .all() as ConversationsByHour[];

      // Si no hay datos, retornar array vacío
      if (results.length === 0) {
        // Generar datos de ejemplo para las últimas 7 horas
        const hours = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          hours.push({
            hour: `${hour.getHours().toString().padStart(2, '0')}:00`,
            conversaciones: Math.floor(Math.random() * 30) + 10,
          });
        }
        return hours;
      }

      return results;
    } catch (error) {
      console.error('Error obteniendo conversaciones por hora:', error);
      throw error;
    }
  }

  // Obtener tiempo de respuesta promedio por día (últimos 7 días)
  getResponseTimeByDay(): ResponseTimeByDay[] {
    try {
      // Por ahora retornamos datos de ejemplo ya que no tenemos timestamps de respuesta
      // En una implementación real, calcularíamos el tiempo entre mensaje de cliente y respuesta de bot
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado

      return days.map((day, index) => ({
        day,
        tiempo: Number((Math.random() * 1 + 1).toFixed(1)), // 1-2 segundos
      }));
    } catch (error) {
      console.error('Error obteniendo tiempo de respuesta:', error);
      throw error;
    }
  }

  // Obtener conversaciones recientes
  getRecentConversations(limit: number = 10) {
    try {
      const results = db
        .prepare(
          `
        SELECT
          c.id,
          c.customer_phone,
          c.customer_name,
          c.channel,
          c.status,
          c.created_at,
          c.updated_at,
          b.name as business_name,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM conversations c
        JOIN businesses b ON c.business_id = b.id
        ORDER BY c.updated_at DESC
        LIMIT ?
      `
        )
        .all(limit);

      return results;
    } catch (error) {
      console.error('Error obteniendo conversaciones recientes:', error);
      throw error;
    }
  }
}

export default new MetricsService();
