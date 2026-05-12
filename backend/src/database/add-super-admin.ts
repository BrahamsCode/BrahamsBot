import db from '../config/database';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function addSuperAdminSupport() {
  console.log('🔧 Agregando soporte para Super Admin...\n');

  try {
    // 1. Agregar columna 'role' a la tabla users si no existe
    console.log('1. Agregando columna "role" a users...');
    try {
      db.prepare(`
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'business_owner'
      `).run();
      console.log('   ✓ Columna "role" agregada');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('   ℹ Columna "role" ya existe');
      } else {
        throw error;
      }
    }

    // 1.5. Modificar constraint de business_users para permitir 'super_admin'
    console.log('\n1.5. Actualizando constraint de business_users...');
    try {
      // SQLite no permite ALTER TABLE para modificar constraints, necesitamos recrear la tabla
      db.prepare('BEGIN TRANSACTION').run();

      // Crear tabla temporal con el nuevo constraint
      db.prepare(`
        CREATE TABLE business_users_new (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'agent', 'super_admin')),
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(user_id, business_id)
        )
      `).run();

      // Copiar datos existentes
      db.prepare(`
        INSERT INTO business_users_new (id, user_id, business_id, role, created_at)
        SELECT id, user_id, business_id, role, created_at FROM business_users
      `).run();

      // Eliminar tabla vieja y renombrar
      db.prepare('DROP TABLE business_users').run();
      db.prepare('ALTER TABLE business_users_new RENAME TO business_users').run();

      db.prepare('COMMIT').run();
      console.log('   ✓ Constraint actualizado');
    } catch (error: any) {
      db.prepare('ROLLBACK').run();
      console.log('   ⚠ Error actualizando constraint:', error.message);
    }

    // 2. Actualizar usuarios existentes a 'business_owner'
    console.log('\n2. Actualizando usuarios existentes...');
    db.prepare(`
      UPDATE users SET role = 'business_owner' WHERE role IS NULL OR role = ''
    `).run();
    console.log('   ✓ Usuarios actualizados');

    // 3. Crear Super Admin si no existe
    console.log('\n3. Creando Super Admin...');
    const existingSuperAdmin = db.prepare(
      "SELECT id FROM users WHERE email = 'admin@brahamsbot.com'"
    ).get();

    if (existingSuperAdmin) {
      console.log('   ℹ Super Admin ya existe');
    } else {
      const superAdminId = randomUUID();
      const passwordHash = await bcrypt.hash('brahams2026', 10);

      db.prepare(`
        INSERT INTO users (id, email, password, name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        superAdminId,
        'admin@brahamsbot.com',
        passwordHash,
        'Brahams - Super Admin',
        'super_admin'
      );

      console.log('   ✓ Super Admin creado:');
      console.log('      Email: admin@brahamsbot.com');
      console.log('      Password: brahams2026');
      console.log('      ID:', superAdminId);
    }

    // 4. Dar acceso al Super Admin a todos los negocios existentes
    console.log('\n4. Dando acceso a todos los negocios...');
    const superAdmin = db.prepare(
      "SELECT id FROM users WHERE email = 'admin@brahamsbot.com'"
    ).get() as { id: string };

    const businesses = db.prepare('SELECT id FROM businesses').all() as { id: string }[];

    let addedCount = 0;
    for (const business of businesses) {
      const existing = db.prepare(`
        SELECT id FROM business_users
        WHERE user_id = ? AND business_id = ?
      `).get(superAdmin.id, business.id);

      if (!existing) {
        db.prepare(`
          INSERT INTO business_users (id, user_id, business_id, role)
          VALUES (?, ?, ?, ?)
        `).run(randomUUID(), superAdmin.id, business.id, 'super_admin');
        addedCount++;
      }
    }
    console.log(`   ✓ Acceso otorgado a ${addedCount} negocios`);

    // 5. Mostrar resumen
    console.log('\n📊 RESUMEN:');
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const businessCount = db.prepare('SELECT COUNT(*) as count FROM businesses').get() as { count: number };
    const superAdminBusinesses = db.prepare(`
      SELECT COUNT(*) as count FROM business_users
      WHERE user_id = ?
    `).get(superAdmin.id) as { count: number };

    console.log(`   Usuarios totales: ${userCount.count}`);
    console.log(`   Negocios totales: ${businessCount.count}`);
    console.log(`   Negocios accesibles por Super Admin: ${superAdminBusinesses.count}`);

    console.log('\n✅ Super Admin configurado correctamente\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  CREDENCIALES DE SUPER ADMIN:');
    console.log('  Email:    admin@brahamsbot.com');
    console.log('  Password: brahams2026');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar
addSuperAdminSupport()
  .then(() => {
    console.log('✓ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
