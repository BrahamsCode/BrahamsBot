import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import db from '../config/database';
import env from '../config/env';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

class AuthService {
  /**
   * Registrar un nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResult> {
    // Validar datos
    if (!data.email || !data.password || !data.name) {
      throw new Error('Email, password y name son requeridos');
    }

    if (data.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Verificar si el email ya existe
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);

    if (existingUser) {
      throw new Error('Este email ya está registrado');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Crear usuario
    const userId = randomUUID();

    db.prepare(`
      INSERT INTO users (id, email, password, name)
      VALUES (?, ?, ?, ?)
    `).run(userId, data.email.toLowerCase(), passwordHash, data.name);

    // Crear primer negocio automáticamente
    const businessId = randomUUID();
    const businessName = `${data.name}'s Business`;

    db.prepare(`
      INSERT INTO businesses (id, name, description, industry, knowledge_base, ai_personality)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      businessId,
      businessName,
      'Negocio creado automáticamente. Personaliza esta descripción.',
      'general',
      'Completa tu base de conocimiento aquí. Incluye información sobre tus productos, servicios, horarios, precios, etc.',
      'amigable y profesional'
    );

    // Vincular usuario con negocio
    db.prepare(`
      INSERT INTO business_users (id, user_id, business_id, role)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), userId, businessId, 'owner');

    console.log(`✓ Usuario registrado: ${data.email} con negocio: ${businessName}`);

    // Generar JWT
    const token = this.generateToken(userId);

    const user: User = {
      id: userId,
      email: data.email.toLowerCase(),
      name: data.name,
      role: 'business_owner',
    };

    return { user, token };
  }

  /**
   * Iniciar sesión
   */
  async login(email: string, password: string): Promise<AuthResult> {
    if (!email || !password) {
      throw new Error('Email y password son requeridos');
    }

    // Buscar usuario
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;

    if (!userRow) {
      throw new Error('Email o contraseña incorrectos');
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, userRow.password);

    if (!isValid) {
      throw new Error('Email o contraseña incorrectos');
    }

    console.log(`✓ Login exitoso: ${email}`);

    // Generar JWT
    const token = this.generateToken(userRow.id);

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role || 'business_owner',
    };

    return { user, token };
  }

  /**
   * Generar token JWT
   */
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

  /**
   * Verificar token JWT
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };

      // Verificar que la sesión existe y no ha expirado
      const session = db.prepare(
        "SELECT * FROM sessions WHERE token = ? AND datetime(expires_at) > datetime('now')"
      ).get(token);

      if (!session) {
        console.log('❌ Sesión no encontrada o expirada para token');
        return null;
      }

      // Obtener usuario
      const userRow = db.prepare(
        'SELECT id, email, name, role FROM users WHERE id = ?'
      ).get(payload.userId) as any;

      if (!userRow) {
        console.log('❌ Usuario no encontrado para userId:', payload.userId);
        return null;
      }

      return {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role || 'business_owner',
      };
    } catch (error) {
      console.error('❌ Error al verificar token:', error);
      return null;
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(token: string): Promise<void> {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  /**
   * Limpiar sesiones expiradas
   */
  cleanExpiredSessions(): void {
    const result = db.prepare('DELETE FROM sessions WHERE expires_at < datetime("now")').run();

    if (result.changes > 0) {
      console.log(`✓ ${result.changes} sesiones expiradas eliminadas`);
    }
  }

  /**
   * Obtener negocios del usuario
   */
  getUserBusinesses(userId: string): any[] {
    const businesses = db.prepare(`
      SELECT b.*, bu.role
      FROM businesses b
      INNER JOIN business_users bu ON b.id = bu.business_id
      WHERE bu.user_id = ?
      ORDER BY b.created_at DESC
    `).all(userId);

    return businesses;
  }

  /**
   * Verificar si el usuario tiene acceso a un negocio
   */
  hasAccessToBusiness(userId: string, businessId: string): boolean {
    const access = db.prepare(`
      SELECT 1 FROM business_users
      WHERE user_id = ? AND business_id = ?
    `).get(userId, businessId);

    return !!access;
  }
}

export default new AuthService();
