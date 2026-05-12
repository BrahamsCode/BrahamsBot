const Database = require('better-sqlite3');
const db = new Database('data/brahamsbot.db');

const schema = db.prepare(`
  SELECT sql FROM sqlite_master
  WHERE type='table' AND name='business_users'
`).get();

console.log(schema.sql);
db.close();
