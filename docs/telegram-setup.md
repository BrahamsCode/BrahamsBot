# 📱 Configuración de Telegram Bot

Guía paso a paso para conectar BrahamsBot con Telegram.

---

## 📋 Requisitos Previos

- Cuenta de Telegram
- Acceso al bot [@BotFather](https://t.me/BotFather)

---

## 🚀 Crear un Bot de Telegram

### 1. Abrir BotFather

1. Abre Telegram
2. Busca **@BotFather** (es el bot oficial de Telegram para crear bots)
3. Inicia una conversación con `/start`

### 2. Crear el Bot

1. Envía el comando `/newbot`
2. BotFather te pedirá el **nombre** de tu bot:
   ```
   Ejemplo: Mi Cafetería Bot
   ```

3. Luego te pedirá el **username** (debe terminar en "bot"):
   ```
   Ejemplo: micafeteriabot o mi_cafeteria_bot
   ```

### 3. Obtener el Token

Una vez creado, BotFather te dará un **token** similar a:

```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
```

⚠️ **IMPORTANTE**: Este token es secreto, no lo compartas públicamente.

### 4. Configurar el Token en BrahamsBot

Abre el archivo `backend/.env` y configura:

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=TU_TOKEN_AQUI
```

### 5. Reiniciar el Servidor

```bash
# Si está corriendo, detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

El bot se inicializará automáticamente y verás en los logs:

```
🤖 Auto-inicializando bot de Telegram...
✓ Bot de Telegram iniciado automáticamente para: [Nombre de tu negocio]
```

---

## ✅ Probar el Bot

1. Busca tu bot en Telegram usando el username que creaste
2. Envía `/start`
3. Envía cualquier mensaje (por ejemplo: "Hola")
4. El bot debería responder automáticamente con IA

---

## 🎨 Personalizar el Bot (Opcional)

### Cambiar la foto del bot

```
/setuserpic → Envía una imagen
```

### Cambiar la descripción

```
/setdescription → Escribe la descripción
```

### Agregar comandos al menú

```
/setcommands → Ejemplo:
start - Iniciar conversación
help - Ayuda
```

---

## 🔍 Verificar el Estado

Puedes verificar el estado del bot desde la API:

```bash
curl http://localhost:3000/api/telegram/status/BUSINESS_ID
```

---

## 📊 Monitorear Conversaciones

Todas las conversaciones de Telegram aparecerán en:

- **Dashboard**: [http://localhost:5174/inbox](http://localhost:5174/inbox)
- Canal mostrado como: `telegram`

---

## ❓ Solución de Problemas

### El bot no responde

1. ✅ Verifica que `TELEGRAM_ENABLED=true` en el `.env`
2. ✅ Verifica que el token sea correcto
3. ✅ Revisa los logs del backend para errores
4. ✅ Reinicia el servidor

### Error "Polling error"

- El token puede estar incorrecto
- Otro proceso puede estar usando el mismo bot
- Verifica la conexión a internet

### El bot solo responde a /start

- Esto ya está corregido en la última versión
- Asegúrate de tener el código actualizado

---

## 🔐 Seguridad

- ❌ **NUNCA** compartas tu token públicamente
- ❌ **NO** subas el archivo `.env` a GitHub
- ✅ Usa variables de entorno en producción
- ✅ Regenera el token si se filtra (con `/revoke` en BotFather)

---

## 📚 Referencias

- [Documentación oficial de Telegram Bots](https://core.telegram.org/bots)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)

---

**Desarrollado con ❤️ por BrahamsCompany 2026**
