import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import env from './config/env';
import db from './config/database';
// import whatsappService from './services/whatsapp/whatsapp.service'; // Comentado temporalmente
import telegramService from './services/telegram/telegram.service';
import metricsRoutes from './routes/metrics.routes';
import conversationsRoutes from './routes/conversations.routes';

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
// RUTAS
// ============================================

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🤖 BrahamsBot API está funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de métricas
app.use('/api/metrics', metricsRoutes);

// Rutas de conversaciones
app.use('/api/conversations', conversationsRoutes);

app.get('/health', (req, res) => {
  try {
    // Verificar conexión a base de datos
    db.prepare('SELECT 1').get();

    res.json({
      status: 'healthy',
      database: 'connected (SQLite)',
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
// RUTAS DE WHATSAPP (COMENTADAS TEMPORALMENTE)
// ============================================

/* WhatsApp temporalmente deshabilitado - usar Telegram
app.post('/api/whatsapp/init/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { phoneNumber } = req.body;

    // Obtener datos del negocio de la BD
    const businessQuery = db.prepare('SELECT * FROM businesses WHERE id = ?');
    const business = businessQuery.get(businessId) as any;

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado',
      });
    }

    // Si se proporciona número, usar pairing code
    if (phoneNumber) {
      const pairingCode = await whatsappService.initSessionWithPairing(
        businessId,
        business,
        phoneNumber
      );

      res.json({
        success: true,
        pairingCode,
        message: pairingCode === 'already_connected'
          ? 'Ya estás conectado'
          : `Ingresa este código en WhatsApp: ${pairingCode}`,
      });
    } else {
      // Método legacy con QR
      const qrCode = await whatsappService.initSession(businessId, business);

      res.json({
        success: true,
        qrCode,
        message: qrCode
          ? 'Escanea el código QR con WhatsApp'
          : 'Sesión iniciada exitosamente',
      });
    }
  } catch (error) {
    console.error('Error al iniciar sesión de WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión de WhatsApp',
    });
  }
});

// Obtener código de emparejamiento
app.get('/api/whatsapp/pairing-code/:businessId', (req, res) => {
  const { businessId } = req.params;
  const pairingCode = whatsappService.getPairingCode(businessId);

  if (pairingCode) {
    res.json({ success: true, pairingCode });
  } else {
    res.status(404).json({
      success: false,
      message: 'No hay código de emparejamiento disponible',
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
*/

// ============================================
// RUTAS DE TELEGRAM
// ============================================

// Iniciar bot de Telegram
app.post('/api/telegram/init/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token de Telegram requerido',
      });
    }

    await telegramService.initBot(businessId, token);

    const botInfo = await telegramService.getBotInfo(businessId);

    res.json({
      success: true,
      message: 'Bot de Telegram iniciado',
      bot: botInfo,
    });
  } catch (error) {
    console.error('Error al iniciar bot de Telegram:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar bot de Telegram',
    });
  }
});

// Obtener estado del bot
app.get('/api/telegram/status/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const status = telegramService.getBotStatus(businessId);
    const botInfo = await telegramService.getBotInfo(businessId);

    res.json({
      success: true,
      status,
      bot: botInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado del bot',
    });
  }
});

// Detener bot
app.delete('/api/telegram/bot/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    await telegramService.stopBot(businessId);

    res.json({
      success: true,
      message: 'Bot detenido',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al detener bot',
    });
  }
});

// ============================================
// WEBSOCKET EVENTS
// ============================================

// Configurar Socket.IO en el servicio de Telegram
telegramService.setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`✓ Cliente conectado al WebSocket: ${socket.id}`);

  // El cliente se une a una sala por businessId
  socket.on('join_business', (businessId) => {
    socket.join(`business_${businessId}`);
    console.log(`Cliente ${socket.id} se unió a business_${businessId}`);
  });

  socket.on('disconnect', () => {
    console.log(`✗ Cliente desconectado: ${socket.id}`);
  });
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

const startServer = () => {
  try {
    // Verificar conexión a base de datos
    db.prepare('SELECT 1').get();
    console.log('✓ Base de datos SQLite conectada');

    // Iniciar servidor
    httpServer.listen(env.PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║                                        ║
║       🤖 BrahamsBot API v1.0.0        ║
║                                        ║
║   Servidor: http://localhost:${env.PORT}   ║
║   Entorno: ${env.NODE_ENV.padEnd(26)}║
║   DB: SQLite                           ║
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
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  db.close();
  process.exit(0);
});

// Iniciar servidor
startServer();
