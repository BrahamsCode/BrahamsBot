# 📱 Configuración de WhatsApp

## ✅ Pasos Completados

1. ✅ Backend funcionando con SQLite
2. ✅ Frontend conectado con datos reales
3. ✅ Negocio "BrahamsCompany" creado en la base de datos
4. ✅ Servicio de WhatsApp configurado

## 🔑 Paso 1: Obtener API Key de Groq (REQUERIDO)

Para que la IA funcione, necesitas una API key de Groq:

1. Ve a https://console.groq.com
2. Crea una cuenta (es gratis)
3. Genera una API key
4. Copia la key

Edita `backend/.env` y reemplaza:
```env
GROQ_API_KEY=gsk_temp_key_for_migrations_will_replace_later_123456789
```

Por tu key real:
```env
GROQ_API_KEY=gsk_tu_key_real_aqui
```

## 📱 Paso 2: Conectar WhatsApp

### Opción A: Desde el Frontend (Recomendado)

1. Asegúrate de que el backend esté corriendo:
   ```bash
   cd backend
   npm run dev
   ```

2. Asegúrate de que el frontend esté corriendo:
   ```bash
   cd frontend
   npm run dev
   ```

3. Abre el navegador en http://localhost:5173

4. Haz clic en "Conectar WhatsApp"

5. Escanea el código QR con WhatsApp en tu celular:
   - WhatsApp → Menú (⋮) → Dispositivos vinculados → Vincular dispositivo

### Opción B: Desde la API directamente

```bash
# Iniciar sesión
curl -X POST http://localhost:3000/api/whatsapp/init/78a50948-e45b-47cc-914b-d11800138c72

# Ver código QR (si no se conecta automáticamente)
curl http://localhost:3000/api/whatsapp/qr/78a50948-e45b-47cc-914b-d11800138c72

# Ver estado de conexión
curl http://localhost:3000/api/whatsapp/status/78a50948-e45b-47cc-914b-d11800138c72
```

## 🧪 Paso 3: Probar el Bot

1. Envía un mensaje de WhatsApp desde otro número al número conectado

2. El bot debería responder automáticamente usando IA

3. Ejemplos de mensajes para probar:
   - "Hola, qué servicios ofrecen?"
   - "Cuánto cuesta desarrollar una app?"
   - "Necesito ayuda con un proyecto web"
   - "Trabajan con Flutter?"

## 📊 Paso 4: Ver Métricas en el Dashboard

1. Ve al dashboard: http://localhost:5173

2. Verás las métricas actualizarse en tiempo real:
   - Conversaciones hoy
   - Automatización IA (%)
   - Clientes activos
   - Satisfacción

## 🔧 Troubleshooting

### El QR no aparece
- Verifica que el backend esté corriendo
- Revisa los logs del backend
- Intenta cerrar sesión y volver a iniciar

### El bot no responde
- Verifica que la API key de Groq sea válida
- Revisa los logs del backend para ver errores
- Asegúrate de que el mensaje se está guardando en la BD

### Error de conexión a la API
- Verifica que el backend esté en http://localhost:3000
- Verifica que el frontend esté en http://localhost:5173
- Revisa el archivo `frontend/.env`

## 📝 Notas Importantes

- **Sessiones persistentes**: Las sesiones de WhatsApp se guardan en `backend/whatsapp-sessions/`
- **Base de datos**: Los mensajes se guardan en `backend/data/brahamsbot.db`
- **Logs**: Revisa la consola del backend para ver mensajes entrantes/salientes

## 🎯 Próximos Pasos

Una vez que WhatsApp esté conectado y funcionando:

1. Personaliza el knowledge_base de tu negocio
2. Ajusta la personalidad de la IA
3. Agrega más negocios si lo necesitas
4. Implementa el panel de conversaciones en vivo
5. Agrega analytics más detallados

## 🆔 Tu Business ID

```
78a50948-e45b-47cc-914b-d11800138c72
```

Usa este ID para todas las operaciones de WhatsApp de BrahamsCompany.

---

**Desarrollado por BrahamsCompany** 🚀
