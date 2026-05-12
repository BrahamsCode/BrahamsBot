# 🚀 Plan de Implementación - MVP SaaS Multi-Tenant

## 📋 Objetivo de la Fase 1

Convertir BrahamsBot en un producto SaaS donde:
- ✅ Usuarios se registran con email/password
- ✅ Cada usuario crea sus negocios
- ✅ Cada negocio configura su bot de Telegram
- ✅ Cada usuario ve SOLO sus conversaciones
- ✅ Sistema 100% multi-tenant y seguro

**Tiempo estimado:** 2-3 semanas
**Resultado:** Producto vendible mínimo

---

## 🏗️ Arquitectura Nueva

### Base de Datos

```sql
-- TABLA: users (Nuevos usuarios de la plataforma)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- hash bcrypt
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- TABLA: business_users (Relación usuario-negocio)
CREATE TABLE business_users (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'agent')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, business_id)
);

-- TABLA: sessions (Para manejar JWT)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- businesses (Ya existe, agregar campos)
ALTER TABLE businesses ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE businesses ADD COLUMN is_active INTEGER DEFAULT 1;

-- telegram_bots (Ya existe, agregar status)
ALTER TABLE telegram_bots ADD COLUMN is_active INTEGER DEFAULT 1;
```

### Flujo de Datos

```
Usuario → Login → JWT Token
  ↓
Dashboard (con token)
  ↓
Ver negocios del usuario (filtrado por user_id)
  ↓
Seleccionar negocio
  ↓
Ver conversaciones (filtrado por business_id)
  ↓
Responder mensajes
```

---

## 📁 Estructura de Archivos Nueva

```
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.middleware.ts          ← Verificar JWT
│   │   └── businessAccess.middleware.ts ← Verificar acceso al negocio
│   ├── routes/
│   │   ├── auth.routes.ts               ← /register, /login, /logout
│   │   ├── user.routes.ts               ← /me, /update-profile
│   │   ├── business.routes.ts           ← /businesses, /businesses/:id
│   │   └── ... (existentes)
│   ├── services/
│   │   ├── auth.service.ts              ← Login, register, JWT
│   │   ├── user.service.ts
│   │   └── ... (existentes)
│   └── types/
│       └── auth.types.ts                ← User, Session, JWT payload

frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx              ← Estado global de autenticación
│   ├── pages/
│   │   ├── Login.tsx                    ← Página de login
│   │   ├── Register.tsx                 ← Página de registro
│   │   ├── BusinessList.tsx             ← Lista de negocios del usuario
│   │   ├── BusinessSettings.tsx         ← Configurar negocio
│   │   └── ... (existentes)
│   ├── components/
│   │   ├── ProtectedRoute.tsx           ← HOC para rutas protegidas
│   │   ├── BusinessSelector.tsx         ← Selector de negocio en header
│   │   └── ... (existentes)
│   └── services/
│       ├── auth.service.ts              ← API calls de auth
│       └── api.service.ts               ← Cliente HTTP con JWT
```

---

## 🔧 Implementación Paso a Paso

### PASO 1: Backend - Autenticación

#### 1.1 Migración de BD

```typescript
// backend/src/database/migrations/add-auth-tables.ts
import db from '../config/database';

export function migrateAuthTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_users (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'owner',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, business_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
  `);

  console.log('✓ Tablas de autenticación creadas');
}
```

#### 1.2 Servicio de Autenticación

```typescript
// backend/src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import db from '../config/database';
import env from '../config/env';

interface User {
  id: string;
  email: string;
  name: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

class AuthService {
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    // Verificar si el email ya existe
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    
    if (existingUser) {
      throw new Error('Email ya está registrado');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Crear usuario
    const userId = randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, password, name)
      VALUES (?, ?, ?, ?)
    `).run(userId, data.email, passwordHash, data.name);

    // Crear primer negocio automáticamente
    const businessId = randomUUID();
    db.prepare(`
      INSERT INTO businesses (id, name, description, industry, knowledge_base, ai_personality, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      businessId,
      `${data.name}'s Business`,
      'Negocio creado automáticamente',
      'general',
      'Completa tu base de conocimiento aquí...',
      'amigable y profesional',
      userId
    );

    // Vincular usuario con negocio
    db.prepare(`
      INSERT INTO business_users (id, user_id, business_id, role)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), userId, businessId, 'owner');

    // Generar JWT
    const token = this.generateToken(userId);

    const user: User = {
      id: userId,
      email: data.email,
      name: data.name,
    };

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Buscar usuario
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!userRow) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, userRow.password);

    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    // Generar JWT
    const token = this.generateToken(userRow.id);

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
    };

    return { user, token };
  }

  private generateToken(userId: string): string {
    const payload = { userId };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

    // Guardar sesión
    const sessionId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, userId, token, expiresAt.toISOString());

    return token;
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };

      // Verificar que la sesión existe
      const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")').get(token);

      if (!session) {
        return null;
      }

      // Obtener usuario
      const userRow = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(payload.userId) as any;

      if (!userRow) {
        return null;
      }

      return {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
      };
    } catch (error) {
      return null;
    }
  }

  async logout(token: string): Promise<void> {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}

export default new AuthService();
```

#### 1.3 Middleware de Autenticación

```typescript
// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    const user = await authService.verifyToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Error de autenticación',
    });
  }
}

// Middleware para verificar acceso a un negocio
export function businessAccessMiddleware(req: Request, res: Response, next: NextFunction) {
  const { businessId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado',
    });
  }

  // Verificar que el usuario tenga acceso al negocio
  const access = db.prepare(`
    SELECT 1 FROM business_users 
    WHERE user_id = ? AND business_id = ?
  `).get(userId, businessId);

  if (!access) {
    return res.status(403).json({
      success: false,
      error: 'No tienes acceso a este negocio',
    });
  }

  next();
}
```

#### 1.4 Rutas de Autenticación

```typescript
// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import authService from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password y name son requeridos',
      });
    }

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y password son requeridos',
      });
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (token) {
      await authService.logout(token);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

export default router;
```

---

### PASO 2: Frontend - Autenticación

#### 2.1 Context de Autenticación

```typescript
// frontend/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar token del localStorage
    const savedToken = localStorage.getItem('token');
    
    if (savedToken) {
      // Verificar token con el backend
      fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.data);
            setToken(savedToken);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    setUser(data.data.user);
    setToken(data.data.token);
    localStorage.setItem('token', data.data.token);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    setUser(data.data.user);
    setToken(data.data.token);
    localStorage.setItem('token', data.data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### 2.2 Páginas de Login y Registro

```tsx
// frontend/src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-2">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Accede a tu cuenta de BrahamsBot
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Regístrate aquí
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ⏱️ Timeline de Implementación

### Semana 1: Backend
- Día 1-2: Migración BD + Auth Service
- Día 3-4: Rutas de auth + Middlewares
- Día 5: Proteger rutas existentes
- Día 6-7: Testing y ajustes

### Semana 2: Frontend
- Día 1-2: AuthContext + Login/Register
- Día 3-4: ProtectedRoutes + Business selector
- Día 5: Actualizar componentes existentes
- Día 6-7: Testing y pulido

### Semana 3: Integración
- Día 1-3: Testing end-to-end
- Día 4-5: Landing page simple
- Día 6-7: Documentación y deploy

---

## ✅ Checklist de Lanzamiento

### Backend:
- [ ] Autenticación funciona
- [ ] JWT expira correctamente
- [ ] Rutas protegidas con middleware
- [ ] Filtrado por user_id en todas las queries
- [ ] Logs de seguridad

### Frontend:
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Logout funciona
- [ ] Rutas protegidas redirigen a /login
- [ ] Token persiste en localStorage
- [ ] Token se envía en todas las requests

### Seguridad:
- [ ] Contraseñas hasheadas con bcrypt
- [ ] JWT_SECRET en .env
- [ ] CORS configurado correctamente
- [ ] Rate limiting en /login y /register
- [ ] Validación de inputs

### UX:
- [ ] Mensajes de error claros
- [ ] Loading states
- [ ] Redirect después de login
- [ ] Token refresh automático

---

**¿Empezamos con la implementación?** 🚀

Puedo empezar por:
1. Crear la migración de BD
2. Implementar el auth service
3. Crear las rutas de auth
4. Agregar el middleware

¿Por cuál empiezo?
