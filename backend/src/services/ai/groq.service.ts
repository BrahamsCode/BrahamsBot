import Groq from 'groq-sdk';
import env from '../../config/env';
import type { GroqMessage, Business } from '../../types';

class GroqService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: env.GROQ_API_KEY,
    });
  }

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

      // Preparar los mensajes para Groq
      const messages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ];

      // Llamar a Groq API
      const chatCompletion = await this.client.chat.completions.create({
        messages,
        model: env.GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false,
      });

      const response = chatCompletion.choices[0]?.message?.content ||
        'Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?';

      return response;
    } catch (error) {
      console.error('Error en GroqService.generateResponse:', error);
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
- Mantén las respuestas concisas y útiles
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
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Analiza el sentimiento del siguiente mensaje y responde solo con: positive, neutral o negative',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        model: env.GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 10,
      });

      const sentiment = completion.choices[0]?.message?.content?.trim().toLowerCase() as
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

export default new GroqService();
