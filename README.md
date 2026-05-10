# 🤖 BrahamsBot

**Sistema Multi-Canal de Atención al Cliente con IA**

Automatiza la atención al cliente en WhatsApp, Telegram y más, usando Inteligencia Artificial que aprende de tu negocio.

---

## 🚀 Características

- ✅ **Multi-Canal**: WhatsApp, Telegram, Web Chat
- 🤖 **IA Conversacional**: Respuestas automáticas con Groq (Llama 3.1)
- 📊 **Dashboard**: Panel de control para configurar y monitorear
- 🔄 **Handoff**: Transferencia a agente humano cuando sea necesario
- 📈 **Analytics**: Métricas de conversaciones y satisfacción
- 🎨 **Personalizable**: Configura el tono y conocimiento por negocio

---

## 🛠️ Stack Tecnológico

### Backend
- Node.js 24 + TypeScript
- Express.js
- PostgreSQL
- Baileys (WhatsApp Web API)
- Telegraf (Telegram Bot)
- Groq API (IA gratuita)
- Socket.io (tiempo real)

### Frontend
- React 19 + Vite
- TypeScript
- Tailwind CSS + shadcn/ui
- Socket.io Client

---

## 📁 Estructura del Proyecto

```
BrahamsBot/
├── backend/          # API y lógica de negocio
├── frontend/         # Dashboard web
├── docs/             # Documentación
└── docker-compose.yml
```

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 24+
- PostgreSQL 15+
- Cuenta Groq (API gratuita)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/BrahamsCode/BrahamsBot.git
cd BrahamsBot

# Instalar dependencias
npm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Iniciar base de datos (Docker)
docker-compose up -d postgres

# Migrar base de datos
npm run db:migrate

# Iniciar modo desarrollo
npm run dev
```

El backend estará en `http://localhost:3000` y el frontend en `http://localhost:5173`

---

## 📖 Documentación

- [Guía de Instalación](./docs/instalacion.md)
- [Configuración de WhatsApp](./docs/whatsapp-setup.md)
- [Configuración de Telegram](./docs/telegram-setup.md)
- [API Reference](./docs/api.md)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, revisa [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.

---

## 📝 Licencia

MIT License - ver [LICENSE](./LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Antony Brahams Paredes Paulino**
- GitHub: [@BrahamsCode](https://github.com/BrahamsCode)
- Email: brahamscompany@gmail.com
- Portfolio: [brahams.store](https://brahams.store)

---

## 🌟 Casos de Uso

- 🏪 Tiendas online (respuestas sobre productos, precios, stock)
- 🍕 Restaurantes (toma de pedidos automatizada)
- 🏨 Hoteles (reservas y consultas)
- 💼 Servicios profesionales (agendamiento de citas)
- 🎓 Educación (información de cursos y matrículas)

---

**Desarrollado con ❤️ por BrahamsCompany 2026**
