import pool from '../config/database';

const migrations = [
  // Tabla de negocios
  `
  CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    knowledge_base TEXT NOT NULL,
    ai_personality VARCHAR(100) DEFAULT 'amigable y profesional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // Tabla de conversaciones
  `
  CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'webchat')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'transferred', 'closed')),
    assigned_to UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, customer_phone, channel)
  );
  `,

  // Tabla de mensajes
  `
  CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'bot', 'agent')),
    sender_id UUID,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'document')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // Tabla de sesiones de WhatsApp
  `
  CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number VARCHAR(50),
    qr_code TEXT,
    status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected')),
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // Tabla de bots de Telegram
  `
  CREATE TABLE IF NOT EXISTS telegram_bots (
    business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    bot_token VARCHAR(255) NOT NULL,
    bot_username VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // Índices para optimizar queries
  `
  CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
  `,

  // Trigger para actualizar updated_at automáticamente
  `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';
  `,

  `
  DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
  CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `,

  `
  DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
  CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `,
];

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Iniciando migraciones...\n');

    await client.query('BEGIN');

    for (let i = 0; i < migrations.length; i++) {
      console.log(`⚙️  Ejecutando migración ${i + 1}/${migrations.length}...`);
      await client.query(migrations[i]);
    }

    await client.query('COMMIT');

    console.log('\n✅ Migraciones completadas exitosamente');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migraciones:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations;
