const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'brahamsbot',
  password: 'brahamsbot123',
  database: 'brahamsbot_db',
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
  console.log('✅ Conexión exitosa!', res.rows[0]);
  pool.end();
});
