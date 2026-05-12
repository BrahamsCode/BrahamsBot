import db from '../config/database';

export function migrateAuthTables() {
  console.log('🔄 Iniciando migración de tablas de autenticación...\n');

  db.exec('BEGIN TRANSACTION');

  try {
    // Tabla de usuarios
    console.log('⚙️  Creando tabla users...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Tabla de relación usuario-negocio
    console.log('⚙️  Creando tabla business_users...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS business_users (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'agent')),
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, business_id)
      )
    `);

    // Tabla de sesiones
    console.log('⚙️  Creando tabla sessions...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Índices para optimización
    console.log('⚙️  Creando índices...');
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id);
    `);

    // Trigger para actualizar updated_at en users
    console.log('⚙️  Creando triggers...');
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_users_updated_at
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    db.exec('COMMIT');

    console.log('\n✅ Migración completada exitosamente');
    console.log('\nTablas creadas:');
    console.log('   - users (usuarios de la plataforma)');
    console.log('   - business_users (relación usuario-negocio)');
    console.log('   - sessions (tokens JWT)');
    console.log('\nÍndices creados: 5');
    console.log('Triggers creados: 1');

  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  migrateAuthTables();
  process.exit(0);
}

export default migrateAuthTables;
