import db from '../config/database';

const businessId = '5d2fa964-2d7b-4249-ab41-b8091f913f41';

const knowledgeBase = `BrahamsCompany es una empresa de desarrollo de software fundada por Antony Brahams Paredes Paulino.

SERVICIOS:
- Desarrollo de Software (Web, Mobile, Backend)
- Mentoría para desarrolladores junior/mid-level
- Consultoría tecnológica
- Desarrollo de sistemas POS para restaurantes/salones
- Automatización con IA y bots

STACK TECNOLÓGICO:
- Backend: PHP, Laravel, Node.js, PostgreSQL
- Frontend: React, Vite, Tailwind CSS
- Mobile: Flutter
- IA: Integración con APIs como Groq, Ollama
- Herramientas: Docker, Git, n8n

PROYECTOS DESTACADOS:
- NeoTech POS: Sistema POS japonés para restaurantes
- Psiconet: Sistema clínico de psicología (app.psiconet.pe)
- TanaFlow: App de video + ecommerce estilo TikTok Shop
- BrahamsBot: Sistema multi-canal de atención con IA

CONTACTO:
- Email: brahamscompany@gmail.com
- GitHub: @BrahamsCode (100+ repos)
- Portfolio: brahams.store
- Ubicación: Lima, Perú

FILOSOFÍA:
- Soluciones eficientes y escalables
- Código limpio y bien documentado
- Enfoque práctico en resolver problemas reales
- Mentoría para desarrolladores en crecimiento

¿Necesitas desarrollo de software, mentoría técnica o consultoría? Estoy aquí para ayudarte.`;

console.log('🔄 Actualizando negocio a BrahamsCompany...\n');

db.prepare(`
  UPDATE businesses
  SET name = ?,
      description = ?,
      industry = ?,
      phone = ?,
      email = ?,
      website = ?,
      knowledge_base = ?,
      ai_personality = ?,
      updated_at = datetime('now')
  WHERE id = ?
`).run(
  'BrahamsCompany',
  'Desarrollo de Software, Mentoría Técnica y Consultoría Tecnológica',
  'tecnologia',
  '+51 999 999 999',
  'brahamscompany@gmail.com',
  'https://brahams.store',
  knowledgeBase,
  'profesional, técnico, amigable y directo. Enfocado en soluciones prácticas.',
  businessId
);

const updated = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId) as any;

console.log('✅ Negocio actualizado exitosamente:\n');
console.log('   📛 Nombre:', updated.name);
console.log('   📧 Email:', updated.email);
console.log('   🌐 Website:', updated.website);
console.log('   🏢 Industria:', updated.industry);
console.log('   📝 Descripción:', updated.description);
console.log('\n🤖 El bot ahora responderá como BrahamsCompany');
console.log('💡 Reinicia el servidor para aplicar los cambios');

process.exit(0);
