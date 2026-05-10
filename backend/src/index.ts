import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import env from './config/env';
import pool from './config/database';
import whatsappService from './services/whatsapp/whatsapp.service';

// Crear aplicación Express
const app = express();
const httpServer = createServer(app);

// Configurar Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.WS_CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// ============================================
// MIDDLEWARES
// ============================================

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// RUTAS DE HEALTH CHECK
// ============================================

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🤖 BrahamsBot API está funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos
    await pool.query('SELECT 1');

    res.json({
      status: 'healthy',
      database: 'connected',
      whatsapp: env.WHATSAPP_ENABLED ? 'enabled' : 'disabled',
      telegram: env.TELEGRAM_ENABLED ? 'enabled' : 'disabled',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});

// ============================================
// RUTAS DE WHATSAPP
// ============================================

// Iniciar sesión de WhatsApp para un negocio
app.post('/api/whatsapp/init/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;

    // TODO: Obtener datos del negocio de la BD
    const business = {
      id: businessId,
      name: 'Negocio Demo',
      description: 'Un negocio de ejemplo',
      industry: 'retail',
      knowledge_base: 'Vendemos productos de tecnología.',
      ai_personality: 'amigable y profesional',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const qrCode = await whatsappService.initSession(businessId, business);

    res.json({
      success: true,
      qrCode,
      message: qrCode
        ? 'Escanea el código QR con WhatsApp'
        : 'Sesión iniciada exitosamente',
    });
  } catch (error) {
    console.error('Error al iniciar sesión de WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión de WhatsApp',
    });
  }
});

// Obtener QR code
app.get('/api/whatsapp/qr/:businessId', (req, res) => {
  const { businessId } = req.params;
  const qrCode = whatsappService.getQRCode(businessId);

  if (qrCode) {
    res.json({ success: true, qrCode });
  } else {
    res.status(404).json({
      success: false,
      message: 'No hay QR disponible',
    });
  }
});

// Obtener estado de sesión
app.get('/api/whatsapp/status/:businessId', (req, res) => {
  const { businessId } = req.params;
  const status = whatsappService.getSessionStatus(businessId);

  res.json({
    success: true,
    status,
  });
});

// Cerrar sesión
app.delete('/api/whatsapp/session/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    await whatsappService.closeSession(businessId);

    res.json({
      success: true,
      message: 'Sesión cerrada',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión',
    });
  }
});

// ============================================
// WEBSOCKET EVENTS
// ============================================

io.on('connection', (socket) => {
  console.log(`✓ Cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`✗ Cliente desconectado: ${socket.id}`);
  });

  // TODO: Implementar eventos de tiempo real
  // - new_message: Nuevo mensaje recibido
  // - conversation_update: Actualización de conversación
  // - whatsapp_status: Cambio de estado de WhatsApp
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error global:', err);

  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
  try {
    // Verificar conexión a base de datos
    await pool.query('SELECT 1');
    console.log('✓ Base de datos conectada');

    // Iniciar servidor
    httpServer.listen(env.PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║                                        ║
║       🤖 BrahamsBot API v1.0.0        ║
║                                        ║
║   Servidor: http://localhost:${env.PORT}   ║
║   Entorno: ${env.NODE_ENV.padEnd(26)}║
║   WhatsApp: ${env.WHATSAPP_ENABLED ? 'Habilitado'.padEnd(22) : 'Deshabilitado'.padEnd(22)}║
║   Telegram: ${env.TELEGRAM_ENABLED ? 'Habilitado'.padEnd(22) : 'Deshabilitado'.padEnd(22)}║
║                                        ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejar señales de cierre
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido, cerrando servidor...');
  await pool.end();
  process.exit(0);
});

// Iniciar servidor
startServer();
