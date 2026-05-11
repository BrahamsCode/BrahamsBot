import db from '../config/database';

const migrations = [
  // Tabla de negocios
  `
  CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    knowledge_base TEXT NOT NULL,
    ai_personality TEXT DEFAULT 'amigable y profesional',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  `,

  // Tabla de conversaciones
  `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'webchat')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'transferred', 'closed')),
    assigned_to TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(business_id, customer_phone, channel)
  );
  `,

  // Tabla de mensajes
  `
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'bot', 'agent')),
    sender_id TEXT,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'document')),
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  `,

  // Tabla de sesiones de WhatsApp
  `
  CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number TEXT,
    qr_code TEXT,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected')),
    last_seen TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  `,

  // Tabla de bots de Telegram
  `
  CREATE TABLE IF NOT EXISTS telegram_bots (
    business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    bot_token TEXT NOT NULL,
    bot_username TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT DEFAULT (datetime('now'))
  );
  `,

  // Índices para optimizar queries
  `
  CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
  `,

  // Triggers para actualizar updated_at automáticamente (SQLite syntax)
  `
  CREATE TRIGGER IF NOT EXISTS update_businesses_updated_at
  AFTER UPDATE ON businesses
  FOR EACH ROW
  BEGIN
    UPDATE businesses SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
  `,

  `
  CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at
  AFTER UPDATE ON conversations
  FOR EACH ROW
  BEGIN
    UPDATE conversations SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
  `,

  `
  CREATE TRIGGER IF NOT EXISTS update_whatsapp_sessions_updated_at
  AFTER UPDATE ON whatsapp_sessions
  FOR EACH ROW
  BEGIN
    UPDATE whatsapp_sessions SET updated_at = datetime('now') WHERE business_id = NEW.business_id;
  END;
  `,
];

function runMigrations() {
  try {
    console.log('🔄 Iniciando migraciones SQLite...\n');

    // SQLite no necesita transacciones explícitas para DDL
    // pero las usamos por consistencia
    db.exec('BEGIN TRANSACTION');

    for (let i = 0; i < migrations.length; i++) {
      console.log(`⚙️  Ejecutando migración ${i + 1}/${migrations.length}...`);
      db.exec(migrations[i]);
    }

    db.exec('COMMIT');

    console.log('\n✅ Migraciones SQLite completadas exitosamente');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Error en migraciones:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runMigrations();
  process.exit(0);
}

export default runMigrations;
