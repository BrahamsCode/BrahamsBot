// Servidor completo con Ollama (IA local, sin base de datos)
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Estado en memoria (sin base de datos)
const conversaciones = [];
let sessionStatus = 'disconnected'; // disconnected, connecting, connected

// Configuración del negocio demo
const demoBusiness = {
  id: 'demo-business',
  name: 'Cafetería El Buen Café',
  description: 'Cafetería especializada en café de especialidad',
  industry: 'restaurante',
  phone: '+51 987 654 321',
  email: 'contacto@elbuencafe.pe',
  knowledge_base: `Somos una cafetería ubicada en Lima, Perú.

MENÚ Y PRECIOS:
☕ CAFÉS:
  - Americano: S/ 8
  - Cappuccino: S/ 10
  - Latte: S/ 10
  - Espresso: S/ 7
  - Mocha: S/ 12

🍰 POSTRES:
  - Cheesecake: S/ 12
  - Torta de Chocolate: S/ 14
  - Pie de Limón: S/ 10
  - Brownie: S/ 8

🥐 DESAYUNOS:
  - Tostadas francesas: S/ 15
  - Croissant: S/ 6
  - Yogurt con granola: S/ 12

⏰ HORARIO:
  - Lunes a Viernes: 7:00 AM - 8:00 PM
  - Sábados: 8:00 AM - 9:00 PM
  - Domingos: 9:00 AM - 6:00 PM

🚚 DELIVERY: Disponible dentro de 5km
💳 PAGOS: Efectivo, tarjeta, Yape, Plin`,
  ai_personality: 'amigable, cálido y acogedor',
};

// Función para llamar a Ollama
async function llamarOllama(mensaje, historial = []) {
  try {
    const systemPrompt = `Eres un asistente virtual para ${demoBusiness.name}.

${demoBusiness.knowledge_base}

PERSONALIDAD: ${demoBusiness.ai_personality}

INSTRUCCIONES:
- Responde de manera ${demoBusiness.ai_personality}
- Sé breve (máximo 3 líneas)
- Menciona precios cuando pregunten por productos
- Si preguntan por horarios, sé específico
- Si detectas "hablar con persona" o "agente humano", responde: "Te contacto con un agente humano enseguida"`;

    const mensajes = [
      { role: 'system', content: systemPrompt },
      ...historial,
      { role: 'user', content: mensaje },
    ];

    // Llamar a Ollama API local
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'llama3.2',
      messages: mensajes,
      stream: false,
    }, {
      timeout: 30000, // 30 segundos timeout
    });

    return response.data.message.content;
  } catch (error) {
    console.error('❌ Error con Ollama:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return 'Error: Ollama no está corriendo. Ejecuta: ollama serve';
    }

    if (error.message.includes('model')) {
      return 'Error: Modelo no descargado. Ejecuta: ollama pull llama3.2';
    }

    return `Disculpa, tuve un problema técnico. Error: ${error.message}`;
  }
}

// ============================================
// RUTAS DE LA API
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🤖 BrahamsBot API (Ollama) funcionando',
    version: '1.0.0-ollama',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req, res) => {
  let ollamaStatus = 'unknown';

  try {
    await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
    ollamaStatus = 'running';
  } catch {
    ollamaStatus = 'not_running';
  }

  res.json({
    status: 'healthy',
    database: 'memory (sin PostgreSQL)',
    ollama: ollamaStatus,
    whatsapp: sessionStatus,
    timestamp: new Date().toISOString(),
  });
});

// Probar IA con Ollama
app.post('/api/test-ai', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un mensaje'
      });
    }

    console.log(`\n📩 Usuario: ${message}`);

    const respuesta = await llamarOllama(message);

    console.log(`🤖 IA: ${respuesta}\n`);

    res.json({
      success: true,
      user_message: message,
      ai_response: respuesta,
      model: 'llama3.2 (Ollama local)',
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Simular conexión de WhatsApp
app.post('/api/whatsapp/init/:businessId', async (req, res) => {
  try {
    sessionStatus = 'connecting';

    // Simular QR code
    const fakeQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    setTimeout(() => {
      sessionStatus = 'connected';
      console.log('✅ WhatsApp "conectado" (simulado)');
    }, 3000);

    res.json({
      success: true,
      qrCode: fakeQR,
      message: 'QR generado (simulado para demo)',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Estado de WhatsApp
app.get('/api/whatsapp/status/:businessId', (req, res) => {
  res.json({
    success: true,
    status: sessionStatus,
  });
});

// Cerrar sesión WhatsApp
app.delete('/api/whatsapp/session/:businessId', (req, res) => {
  sessionStatus = 'disconnected';
  res.json({
    success: true,
    message: 'Sesión cerrada',
  });
});

// Enviar mensaje de prueba (simula que llega un mensaje de WhatsApp)
app.post('/api/test-whatsapp-message', async (req, res) => {
  try {
    const { mensaje } = req.body;

    if (!mensaje) {
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }

    console.log(`\n📱 WhatsApp recibido: "${mensaje}"`);

    // Generar respuesta con IA
    const respuesta = await llamarOllama(mensaje);

    console.log(`🤖 Respuesta enviada: "${respuesta}"\n`);

    // Guardar conversación en memoria
    conversaciones.push({
      timestamp: new Date(),
      user_message: mensaje,
      ai_response: respuesta,
    });

    res.json({
      success: true,
      mensaje_recibido: mensaje,
      respuesta_enviada: respuesta,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Ver conversaciones
app.get('/api/conversaciones', (req, res) => {
  res.json({
    success: true,
    total: conversaciones.length,
    conversaciones: conversaciones.slice(-10), // Últimas 10
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║        🤖 BrahamsBot - Servidor Ollama          ║
║                                                  ║
║   Puerto: http://localhost:${PORT}                  ║
║   Modelo IA: Llama 3.2 (Local)                  ║
║   Base de datos: Memoria (sin PostgreSQL)       ║
║                                                  ║
╚══════════════════════════════════════════════════╝
`);

  // Verificar Ollama
  try {
    await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
    console.log('✅ Ollama detectado y funcionando\n');
  } catch {
    console.log('⚠️  Ollama NO detectado');
    console.log('   Pasos:');
    console.log('   1. Abre otra terminal');
    console.log('   2. Ejecuta: ollama serve');
    console.log('   3. Ejecuta: ollama pull llama3.2\n');
  }

  console.log('📚 Endpoints disponibles:');
  console.log('   GET  /              → Info del servidor');
  console.log('   GET  /health        → Estado del sistema');
  console.log('   POST /api/test-ai   → Probar IA');
  console.log('   POST /api/test-whatsapp-message → Simular mensaje WhatsApp');
  console.log('   GET  /api/conversaciones → Ver historial\n');

  console.log('💡 Prueba rápida:');
  console.log('   curl -X POST http://localhost:3000/api/test-ai \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d "{\\"message\\":\\"Hola, cuánto cuesta un café?\\"}"\n');
});
