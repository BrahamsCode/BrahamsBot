# 🧪 Prueba Rápida de Telegram Bot

## ⚡ Inicio Rápido (2 minutos)

### 1. Crear el Bot en Telegram

1. Abre Telegram y busca **@BotFather**
2. Envía `/newbot`
3. Dale un nombre (ej: "Test Brahams Bot")
4. Dale un username que termine en "bot" (ej: "testbrahamsbot")
5. **Copia el token** que te da (se ve así: `1234567890:ABCdefGHI...`)

### 2. Configurar el Token

Edita el archivo `backend/.env`:

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=PEGA_TU_TOKEN_AQUI
```

### 3. Reiniciar el Servidor

```bash
# Si está corriendo, presiona Ctrl+C para detenerlo
npm run dev
```

Deberías ver en los logs:

```
🤖 Auto-inicializando bot de Telegram...
✓ Bot de Telegram iniciado automáticamente para: Cafetería El Buen Café
```

### 4. Probar el Bot

1. Busca tu bot en Telegram usando el **@username** que creaste
2. Envía `/start` - El bot te dará la bienvenida
3. Envía cualquier mensaje como **"Hola"** o **"Tienen delivery?"**
4. El bot responderá automáticamente con IA

---

## ✅ Verificar que Funciona

### Desde Telegram:
- ✅ El bot responde a `/start`
- ✅ El bot responde a mensajes normales (sin comandos)
- ✅ Las respuestas son contextuales al negocio

### Desde el Dashboard:
1. Abre [http://localhost:5174/telegram-setup](http://localhost:5174/telegram-setup)
2. Deberías ver "Bot Conectado" con el username y nombre
3. Navega a [http://localhost:5174/inbox](http://localhost:5174/inbox)
4. Deberías ver la conversación con el canal "telegram"

---

## 🔍 Solución de Problemas

### El bot no responde a mensajes normales

**SOLUCIONADO** ✅ - La versión actual ya tiene el fix

El problema era que el bot no se auto-inicializaba. Ahora:
- Se auto-inicializa cuando arrancas el servidor
- Responde tanto a `/start` como a mensajes normales

### Error: "Bot no encontrado"

1. Verifica que el token sea correcto
2. Asegúrate de que `TELEGRAM_ENABLED=true`
3. Revisa los logs del backend para errores

### Error: "Polling error"

- Puede que el token esté mal escrito
- Otro proceso puede estar usando el mismo bot
- Detén el servidor, verifica el token, y reinicia

---

## 📊 Ejemplo de Conversación

```
Usuario: /start
Bot: ¡Hola! 👋 Soy el asistente virtual de Cafetería El Buen Café.

Cafetería especializada en café de especialidad y postres artesanales

¿En qué puedo ayudarte hoy?

Usuario: Tienen delivery?
Bot: ¡Sí! Tenemos servicio de delivery dentro de 5km. Nuestro horario es de...

Usuario: Cuáles son sus precios?
Bot: Nuestros precios son: Café desde S/ 8, Postres desde S/ 12. ¿Te gustaría saber más sobre algún producto específico?
```

---

## 🎨 Personalizar el Bot (Opcional)

### Cambiar foto del bot
```
En BotFather:
/setuserpic → envía una imagen
```

### Cambiar descripción
```
/setdescription → escribe la descripción
```

### Agregar comandos al menú
```
/setcommands → escribe:
start - Iniciar conversación
help - Ver ayuda
menu - Ver menú de productos
```

---

## 📝 Cambios Implementados

### Backend:
- ✅ Auto-inicialización del bot al arrancar el servidor
- ✅ Fix: El bot ahora responde a mensajes normales, no solo a `/start`
- ✅ Endpoint para verificar estado del bot
- ✅ WebSocket para mensajes en tiempo real

### Frontend:
- ✅ Página de configuración de Telegram (`/telegram-setup`)
- ✅ Botón de navegación en Dashboard
- ✅ Botón de "Volver" en la página Inbox
- ✅ Visualización del estado del bot
- ✅ Instrucciones paso a paso

---

## 🚀 Próximos Pasos

Después de probar Telegram, puedes:

1. **Personalizar la IA**: Edita el `knowledge_base` del negocio en la base de datos
2. **Configurar WhatsApp**: Usa `/whatsapp-setup` (requiere pairing code)
3. **Ver Analytics**: Los datos se generan automáticamente
4. **Probar transferencia a humano**: Di "quiero hablar con un humano"

---

**¿Tienes problemas?** Revisa los logs del backend para más detalles.

**Desarrollado con ❤️ por BrahamsCompany 2026**
