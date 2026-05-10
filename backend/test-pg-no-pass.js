const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'brahamsbot',
  // Sin password para probar trust
  database: 'brahamsbot_db',
});

pool.query('SELECT NOW() as ahora, current_user as usuario', (err, res) => {
  if (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
  console.log('✅ Conexión exitosa!');
  console.log('   Usuario:', res.rows[0].usuario);
  console.log('   Hora:', res.rows[0].ahora);
  pool.end();
});
