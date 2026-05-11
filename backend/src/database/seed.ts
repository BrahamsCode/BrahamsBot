import db from '../config/database';
import { randomUUID } from 'crypto';

function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de datos SQLite...\n');

    db.exec('BEGIN TRANSACTION');

    // Generar ID para el negocio
    const businessId = randomUUID();

    // Insertar negocio de ejemplo
    const insertBusiness = db.prepare(`
      INSERT OR IGNORE INTO businesses (
        id,
        name,
        description,
        industry,
        phone,
        email,
        knowledge_base,
        ai_personality
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const businessResult = insertBusiness.run(
      businessId,
      'Cafetería El Buen Café',
      'Cafetería especializada en café de especialidad y postres artesanales',
      'restaurante',
      '+51 987 654 321',
      'contacto@elbuencafe.pe',
      `Somos una cafetería ubicada en Lima, Perú. Ofrecemos:
      - Café de especialidad (latte, cappuccino, americano, espresso)
      - Postres artesanales (cheesecake, torta de chocolate, pie de limón)
      - Desayunos (tostadas, croissants, yogurt con granola)
      - Horario: Lunes a Viernes 7am-8pm, Sábados 8am-9pm, Domingos 9am-6pm
      - Delivery disponible dentro de 5km
      - Precios: Café desde S/ 8, Postres desde S/ 12
      - Aceptamos pagos en efectivo y tarjeta`,
      'amigable, cálido y acogedor'
    );

    if (businessResult.changes > 0) {
      console.log(`✓ Negocio de ejemplo creado con ID: ${businessId}`);

      // Generar ID para la conversación
      const conversationId = randomUUID();

      // Insertar conversación de ejemplo
      const insertConversation = db.prepare(`
        INSERT OR IGNORE INTO conversations (
          id,
          business_id,
          customer_phone,
          customer_name,
          channel,
          status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const conversationResult = insertConversation.run(
        conversationId,
        businessId,
        '+51999888777',
        'Juan Pérez',
        'whatsapp',
        'active'
      );

      if (conversationResult.changes > 0) {
        // Insertar mensajes de ejemplo
        const insertMessage = db.prepare(`
          INSERT INTO messages (id, conversation_id, sender_type, content, message_type)
          VALUES (?, ?, ?, ?, ?)
        `);

        const messages = [
          ['Hola, tienen delivery?', 'customer'],
          ['Hola Juan! 😊 Sí, tenemos servicio de delivery dentro de 5km. ¿En qué zona te encuentras?', 'bot'],
          ['Estoy en Miraflores', 'customer'],
          ['¡Perfecto! Miraflores está dentro de nuestra zona de delivery. ¿Qué te gustaría ordenar? Tenemos cafés desde S/ 8 y postres desde S/ 12.', 'bot'],
        ];

        messages.forEach(([content, senderType]) => {
          insertMessage.run(randomUUID(), conversationId, senderType, content, 'text');
        });

        console.log(`✓ Conversación y mensajes de ejemplo creados`);
      }
    }

    db.exec('COMMIT');

    console.log('\n✅ Seed completado exitosamente');
    console.log('\n📊 Datos de prueba:');
    console.log('   - Negocio: Cafetería El Buen Café');
    console.log('   - Canal: WhatsApp');
    console.log('   - Conversación demo con mensajes');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedDatabase();
  process.exit(0);
}

export default seedDatabase;
