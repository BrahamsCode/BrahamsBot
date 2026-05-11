import Database from 'better-sqlite3';
import env from './env';
import path from 'path';

// Crear/conectar a la base de datos SQLite
const dbPath = path.resolve(process.cwd(), env.DB_PATH);
export const db = new Database(dbPath, {
  verbose: env.NODE_ENV === 'development' ? console.log : undefined,
});

// Configurar para mejor rendimiento
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`✓ Conectado a SQLite: ${dbPath}`);

// Función helper para queries SELECT (compatibilidad con PostgreSQL)
export const query = (text: string, params?: any[]) => {
  const start = Date.now();
  const stmt = db.prepare(text);
  const rows = params ? stmt.all(...params) : stmt.all();
  const duration = Date.now() - start;
  console.log('Query ejecutado:', { text, duration, rows: rows.length });
  return { rows, rowCount: rows.length };
};

// Función helper para queries INSERT/UPDATE/DELETE
export const run = (text: string, params?: any[]) => {
  const start = Date.now();
  const stmt = db.prepare(text);
  const result = params ? stmt.run(...params) : stmt.run();
  const duration = Date.now() - start;
  console.log('Query ejecutado:', { text, duration, changes: result.changes });
  return result;
};

// Cerrar conexión al terminar
process.on('beforeExit', () => {
  db.close();
});

export default db;
