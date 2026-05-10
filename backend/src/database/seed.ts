import pool from '../config/database';

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed de datos...\n');

    await client.query('BEGIN');

    // Insertar negocio de ejemplo
    const businessResult = await client.query(`
      INSERT INTO businesses (
        name,
        description,
        industry,
        phone,
        email,
        knowledge_base,
        ai_personality
      ) VALUES (
        'Cafetería El Buen Café',
        'Cafetería especializada en café de especialidad y postres artesanales',
        'restaurante',
        '+51 987 654 321',
        'contacto@elbuencafe.pe',
        'Somos una cafetería ubicada en Lima, Perú. Ofrecemos:
        - Café de especialidad (latte, cappuccino, americano, espresso)
        - Postres artesanales (cheesecake, torta de chocolate, pie de limón)
        - Desayunos (tostadas, croissants, yogurt con granola)
        - Horario: Lunes a Viernes 7am-8pm, Sábados 8am-9pm, Domingos 9am-6pm
        - Delivery disponible dentro de 5km
        - Precios: Café desde S/ 8, Postres desde S/ 12
        - Aceptamos pagos en efectivo y tarjeta',
        'amigable, cálido y acogedor'
      )
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);

    const businessId = businessResult.rows[0]?.id;

    if (businessId) {
      console.log(`✓ Negocio de ejemplo creado con ID: ${businessId}`);

      // Insertar conversación de ejemplo
      const conversationResult = await client.query(`
        INSERT INTO conversations (
          business_id,
          customer_phone,
          customer_name,
          channel,
          status
        ) VALUES (
          $1,
          '+51999888777',
          'Juan Pérez',
          'whatsapp',
          'active'
        )
        ON CONFLICT DO NOTHING
        RETURNING id;
      `, [businessId]);

      const conversationId = conversationResult.rows[0]?.id;

      if (conversationId) {
        // Insertar mensajes de ejemplo
        await client.query(`
          INSERT INTO messages (conversation_id, sender_type, content, message_type)
          VALUES
            ($1, 'customer', 'Hola, tienen delivery?', 'text'),
            ($1, 'bot', 'Hola Juan! 😊 Sí, tenemos servicio de delivery dentro de 5km. ¿En qué zona te encuentras?', 'text'),
            ($1, 'customer', 'Estoy en Miraflores', 'text'),
            ($1, 'bot', '¡Perfecto! Miraflores está dentro de nuestra zona de delivery. ¿Qué te gustaría ordenar? Tenemos cafés desde S/ 8 y postres desde S/ 12.', 'text');
        `, [conversationId]);

        console.log(`✓ Conversación y mensajes de ejemplo creados`);
      }
    }

    await client.query('COMMIT');

    console.log('\n✅ Seed completado exitosamente');
    console.log('\n📊 Datos de prueba:');
    console.log('   - Negocio: Cafetería El Buen Café');
    console.log('   - Canal: WhatsApp');
    console.log('   - Conversación demo con mensajes');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDatabase;
