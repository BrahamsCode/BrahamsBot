import type { GroqMessage, Business } from '../../types';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

class OllamaService {
  private baseUrl = 'http://localhost:11434';
  private model = 'llama3.2:latest';

  /**
   * Genera una respuesta automática basada en el contexto del negocio
   */
  async generateResponse(
    userMessage: string,
    business: Business,
    conversationHistory: GroqMessage[] = []
  ): Promise<string> {
    try {
      // Construir el prompt del sistema con el contexto del negocio
      const systemPrompt = this.buildSystemPrompt(business);

      // Preparar los mensajes para Ollama
      const messages: OllamaMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      // Llamar a Ollama API
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 1,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();

      const aiResponse = data.message?.content ||
        'Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?';

      return aiResponse;
    } catch (error) {
      console.error('Error en OllamaService.generateResponse:', error);
      throw new Error('Error al generar respuesta con IA');
    }
  }

  /**
   * Construye el prompt del sistema basado en la configuración del negocio
   */
  private buildSystemPrompt(business: Business): string {
    return `Eres un asistente virtual inteligente para ${business.name}.

INFORMACIÓN DEL NEGOCIO:
${business.description}

INDUSTRIA: ${business.industry}

BASE DE CONOCIMIENTO:
${business.knowledge_base}

PERSONALIDAD:
${business.ai_personality}

INSTRUCCIONES:
- Responde de manera ${business.ai_personality} y profesional
- Si te preguntan algo que no sabes, sé honesto y ofrece contactar a un agente humano
- Mantén las respuestas concisas y útiles (máximo 2-3 párrafos)
- Si el cliente está molesto o la consulta es compleja, sugiere transferir a un agente humano
- Siempre incluye información de contacto si es relevante: ${business.phone || ''} ${business.email || ''}
- Si mencionan precios o información sensible que no tienes, indica que un agente confirmará los detalles

PALABRAS CLAVE PARA TRANSFERIR A HUMANO:
- "hablar con una persona"
- "agente humano"
- "problema urgente"
- "queja"
- "reclamación"

Si detectas estas palabras, responde: "Entiendo, te voy a transferir con uno de nuestros agentes humanos. Por favor espera un momento."`;
  }

  /**
   * Analiza el sentimiento del mensaje (positivo, neutral, negativo)
   */
  async analyzeSentiment(message: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Analiza el sentimiento del siguiente mensaje y responde solo con una palabra: positive, neutral o negative',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          stream: false,
          options: {
            temperature: 0.3,
          },
        }),
      });

      const data: OllamaResponse = await response.json();
      const sentiment = data.message?.content?.trim().toLowerCase() as
        'positive' | 'neutral' | 'negative';

      return ['positive', 'neutral', 'negative'].includes(sentiment)
        ? sentiment
        : 'neutral';
    } catch (error) {
      console.error('Error en analyzeSentiment:', error);
      return 'neutral';
    }
  }

  /**
   * Detecta si el mensaje requiere transferencia a un agente humano
   */
  async shouldTransferToHuman(message: string): Promise<boolean> {
    const keywords = [
      'hablar con una persona',
      'agente humano',
      'operador',
      'problema urgente',
      'queja',
      'reclamación',
      'insatisfecho',
      'gerente',
      'supervisor',
    ];

    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  }
}

export default new OllamaService();
