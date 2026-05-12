const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/brahamsbot.db');
const db = new Database(dbPath);

console.log('=== USUARIOS ===');
const users = db.prepare('SELECT * FROM users').all();
console.table(users.map(u => ({ id: u.id, email: u.email, name: u.name, created_at: u.created_at })));

console.log('\n=== NEGOCIOS ===');
const businesses = db.prepare('SELECT * FROM businesses').all();
console.table(businesses.map(b => ({ id: b.id, name: b.name, industry: b.industry, created_at: b.created_at })));

console.log('\n=== CONVERSACIONES ===');
const conversations = db.prepare(`
  SELECT c.*, b.name as business_name
  FROM conversations c
  LEFT JOIN businesses b ON c.business_id = b.id
  ORDER BY c.updated_at DESC
`).all();
console.table(conversations.map(c => ({
  id: c.id.substring(0, 8),
  business: c.business_name,
  customer: c.customer_name || c.customer_phone,
  channel: c.channel,
  status: c.status,
  last_message: c.last_message ? c.last_message.substring(0, 50) + '...' : '',
  updated: c.updated_at
})));

console.log('\n=== MENSAJES (últimos 50) ===');
const messages = db.prepare(`
  SELECT m.*, c.customer_name, c.customer_phone, c.channel
  FROM messages m
  LEFT JOIN conversations c ON m.conversation_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 50
`).all();

messages.forEach((msg, index) => {
  console.log(`\n[${index + 1}] ${msg.created_at} | ${msg.channel} | ${msg.customer_name || msg.customer_phone}`);
  console.log(`    ${msg.sender_type === 'customer' ? '👤 Cliente' : msg.sender_type === 'bot' ? '🤖 Bot' : '👨‍💼 Agente'}: ${msg.content}`);
});

console.log('\n=== ESTADÍSTICAS ===');
const stats = db.prepare(`
  SELECT
    COUNT(*) as total_conversations,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
  FROM conversations
`).get();
console.table(stats);

const msgStats = db.prepare(`
  SELECT
    sender_type,
    COUNT(*) as count
  FROM messages
  GROUP BY sender_type
`).all();
console.log('\nMensajes por tipo:');
console.table(msgStats);

db.close();
