import db from '../config/database';
import { randomUUID } from 'crypto';

interface BusinessData {
  name: string;
  description?: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  knowledge_base: string;
  ai_personality?: string;
}

function addBusiness(data: BusinessData): string {
  try {
    const businessId = randomUUID();

    const insertBusiness = db.prepare(`
      INSERT INTO businesses (
        id,
        name,
        description,
        industry,
        phone,
        email,
        website,
        knowledge_base,
        ai_personality
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBusiness.run(
      businessId,
      data.name,
      data.description || null,
      data.industry || null,
      data.phone || null,
      data.email || null,
      data.website || null,
      data.knowledge_base,
      data.ai_personality || 'amigable y profesional'
    );

    console.log(`✅ Negocio creado exitosamente!`);
    console.log(`📋 ID: ${businessId}`);
    console.log(`🏢 Nombre: ${data.name}`);
    console.log(`\n💡 Usa este ID para conectar WhatsApp:`);
    console.log(`   POST http://localhost:3000/api/whatsapp/init/${businessId}`);

    return businessId;
  } catch (error) {
    console.error('❌ Error creando negocio:', error);
    throw error;
  }
}

// Ejemplo de uso
if (require.main === module) {
  // Puedes modificar estos datos o pasar argumentos por CLI
  const businessData: BusinessData = {
    name: 'BrahamsCompany',
    description: 'Consultoría y desarrollo de software a medida',
    industry: 'tecnología',
    phone: '+51 999 999 999',
    email: 'brahamscompany@gmail.com',
    website: 'https://brahams.store',
    knowledge_base: `
BrahamsCompany - Desarrollo de Software a Medida

Servicios:
- Desarrollo de aplicaciones web (React, Laravel, Node.js)
- Desarrollo de aplicaciones móviles (Flutter)
- Sistemas POS para restaurantes y negocios
- Automatización con IA
- Integración de WhatsApp Business
- Mentoría para desarrolladores

Especialidades:
- Full Stack Development (PHP, JavaScript, TypeScript)
- Bases de datos (PostgreSQL, MySQL, SQLite)
- Cloud deployment (Railway, Vercel, AWS)

Contacto:
- Email: brahamscompany@gmail.com
- Ubicación: Lima, Perú
- Horario: Lunes a Viernes 9am-6pm
    `.trim(),
    ai_personality: 'profesional, técnico pero amigable, enfocado en soluciones',
  };

  const businessId = addBusiness(businessData);
  process.exit(0);
}

export default addBusiness;
