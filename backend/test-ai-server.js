// Servidor simple para probar la IA sin base de datos
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk').default;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Inicializar Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'gsk_demo_key', // Usar key demo si no existe
});

// Configuración del negocio de prueba
const demoBusiness = {
  name: 'Cafetería Demo',
  description: 'Cafetería de prueba',
  industry: 'restaurante',
  knowledge_base: `Somos una cafetería ubicada en Lima, Perú.

  MENÚ:
  - Café Americano: S/ 8
  - Cappuccino: S/ 10
  - Latte: S/ 10
  - Espresso: S/ 7
  - Cheesecake: S/ 12
  - Torta de Chocolate: S/ 14

  HORARIO:
  - Lunes a Viernes: 7am - 8pm
  - Sábados: 8am - 9pm
  - Domingos: 9am - 6pm

  DELIVERY: Disponible dentro de 5km
  PAGOS: Efectivo y tarjeta`,
  ai_personality: 'amigable, cálido y acogedor',
};

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🤖 Servidor de prueba de IA funcionando',
    groq_configured: !!process.env.GROQ_API_KEY,
  });
});

// Endpoint para probar la IA
app.post('/api/test-ai', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }

    console.log(`\n📩 Mensaje recibido: "${message}"`);

    // Construir prompt del sistema
    const systemPrompt = `Eres un asistente virtual para ${demoBusiness.name}.

INFORMACIÓN DEL NEGOCIO:
${demoBusiness.description}

MENÚ Y PRECIOS:
${demoBusiness.knowledge_base}

PERSONALIDAD: ${demoBusiness.ai_personality}

INSTRUCCIONES:
- Responde de manera ${demoBusiness.ai_personality}
- Sé breve y útil
- Si te preguntan sobre el menú, menciona precios
- Si te preguntan sobre horarios, sé específico`;

    // Llamar a Groq
    console.log('🤖 Generando respuesta con IA...');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile', // Modelo gratuito de Groq
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content ||
      'Lo siento, no pude generar una respuesta.';

    console.log(`✅ Respuesta generada: "${aiResponse}"\n`);

    res.json({
      success: true,
      user_message: message,
      ai_response: aiResponse,
      model: 'llama-3.3-70b-versatile',
      tokens_used: {
        prompt: chatCompletion.usage.prompt_tokens,
        completion: chatCompletion.usage.completion_tokens,
        total: chatCompletion.usage.total_tokens,
      },
    });

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Si es error de API key, dar instrucciones
    if (error.message.includes('API key')) {
      return res.status(401).json({
        success: false,
        error: 'Groq API key inválida o no configurada',
        instructions: 'Obtén tu API key gratis en: https://console.groq.com',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🤖 SERVIDOR DE PRUEBA DE IA               ║
║                                              ║
║   Puerto: http://localhost:${PORT}              ║
║   Groq API: ${process.env.GROQ_API_KEY ? '✅ Configurado' : '❌ No configurado'}          ║
║                                              ║
╚══════════════════════════════════════════════╝

Para probar la IA:

  POST http://localhost:3000/api/test-ai
  Body: { "message": "Hola, cuánto cuesta un café?" }

O usa curl:

  curl -X POST http://localhost:3000/api/test-ai \\
    -H "Content-Type: application/json" \\
    -d "{\\"message\\":\\"Hola, tienen delivery?\\"}"

${!process.env.GROQ_API_KEY ? '\n⚠️  IMPORTANTE: Configura GROQ_API_KEY en .env\n   Obtén tu API key gratis en: https://console.groq.com\n' : ''}
`);
});
