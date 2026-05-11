import dotenv from 'dotenv';
import { z } from 'zod';

// Cargar .env
dotenv.config();

// Schema de validación para variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_URL: z.string().url(),

  // Base de datos SQLite
  DB_PATH: z.string().default('./data/brahamsbot.db'),

  // JWT
  JWT_SECRET: z.string().min(32),

  // Groq
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),

  // WhatsApp
  WHATSAPP_ENABLED: z.string().transform(val => val === 'true').default('true'),
  WHATSAPP_SESSION_PATH: z.string().default('./whatsapp-sessions'),

  // Telegram
  TELEGRAM_ENABLED: z.string().transform(val => val === 'true').default('true'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // WebSocket
  WS_CORS_ORIGIN: z.string(),

  // Logs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Frontend
  FRONTEND_URL: z.string().url(),
});

// Validar y exportar variables de entorno
export const env = envSchema.parse(process.env);

export default env;
