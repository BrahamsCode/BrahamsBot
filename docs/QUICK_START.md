# 🚀 Guía de Inicio Rápido - BrahamsBot

## Requisitos Previos

- Node.js 24+ ([Descargar](https://nodejs.org/))
- Docker Desktop ([Descargar](https://www.docker.com/products/docker-desktop))
- Cuenta Groq API (gratuita) - [Registrarse aquí](https://console.groq.com)

---

## Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/BrahamsCode/BrahamsBot.git
cd BrahamsBot
```

---

## Paso 2: Configurar Base de Datos

Inicia PostgreSQL con Docker:

```bash
docker-compose up -d
```

Verifica que esté corriendo:

```bash
docker ps
```

---

## Paso 3: Configurar Backend

### 3.1 Instalar dependencias

```bash
cd backend
npm install
```

### 3.2 Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` y configura:

```env
# Lo más importante:
GROQ_API_KEY=tu_api_key_de_groq_aqui
```

**Para obtener tu Groq API Key:**
1. Ve a https://console.groq.com
2. Crea una cuenta (gratis)
3. Ve a "API Keys" → "Create API Key"
4. Copia la key y pégala en el `.env`

### 3.3 Migrar base de datos

```bash
npm run migrate
npm run seed
```

### 3.4 Iniciar backend

```bash
npm run dev
```

Deberías ver:

```
╔════════════════════════════════════════╗
║       🤖 BrahamsBot API v1.0.0        ║
║   Servidor: http://localhost:3000      ║
╚════════════════════════════════════════╝
```

---

## Paso 4: Configurar Frontend

Abre una **nueva terminal**:

```bash
cd frontend
npm install
npm run dev
```

El frontend estará en: **http://localhost:5173**

---

## Paso 5: Conectar WhatsApp

1. Abre http://localhost:5173 en tu navegador
2. Haz clic en **"Conectar WhatsApp"**
3. Aparecerá un **código QR**
4. En tu teléfono:
   - Abre WhatsApp
   - Toca Menú (⋮) → **Dispositivos vinculados**
   - Toca **"Vincular un dispositivo"**
   - Escanea el QR en el navegador
5. ¡Listo! Ya estás recibiendo mensajes automatizados

---

## Verificar que Todo Funciona

### Test 1: Backend

```bash
curl http://localhost:3000/health
```

Respuesta esperada:

```json
{
  "status": "healthy",
  "database": "connected",
  "whatsapp": "enabled"
}
```

### Test 2: Frontend

Abre http://localhost:5173 → deberías ver el Dashboard

### Test 3: WhatsApp

- Envía un mensaje al número conectado
- La IA debería responder automáticamente

---

## Personalizar la IA

### Opción 1: Desde la Base de Datos

```sql
UPDATE businesses 
SET knowledge_base = 'Tu nueva información del negocio aquí',
    ai_personality = 'formal y profesional'
WHERE id = 'tu-business-id';
```

### Opción 2: Desde el Código (próximamente)

Panel de administración en el frontend para editar la configuración.

---

## Solución de Problemas

### ❌ Error: "Cannot connect to database"

```bash
# Verifica que Docker esté corriendo
docker ps

# Si no está, inicia PostgreSQL
docker-compose up -d

# Verifica las credenciales en backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USER=brahamsbot
DB_PASSWORD=brahamsbot123
DB_NAME=brahamsbot_db
```

### ❌ Error: "Groq API key not found"

Asegúrate de:
1. Tener la key en `backend/.env`
2. Reiniciar el backend después de agregar la key

### ❌ WhatsApp no conecta

1. Verifica que el backend esté corriendo
2. Intenta cerrar sesión y volver a conectar
3. Revisa los logs del backend para más detalles

---

## Comandos Útiles

```bash
# Ver logs de PostgreSQL
docker logs brahamsbot-postgres

# Detener base de datos
docker-compose down

# Limpiar todo (¡cuidado! borra datos)
docker-compose down -v

# Reiniciar backend en modo desarrollo
cd backend && npm run dev

# Reiniciar frontend en modo desarrollo
cd frontend && npm run dev

# Ver logs del backend con más detalle
# (Los verás en la consola donde ejecutaste npm run dev)
```

---

## Próximos Pasos

- [ ] Configurar Telegram Bot
- [ ] Agregar Web Chat widget
- [ ] Personalizar respuestas de la IA
- [ ] Configurar transferencia a agente humano
- [ ] Ver analíticas de conversaciones

---

## Necesitas Ayuda?

- 📚 **Documentación completa**: [Ver docs/](../docs/)
- 🐛 **Reportar bugs**: [GitHub Issues](https://github.com/BrahamsCode/BrahamsBot/issues)
- 📧 **Contacto**: brahamscompany@gmail.com

---

**¡Listo para automatizar tu atención al cliente! 🚀**
