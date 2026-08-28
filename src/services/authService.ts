import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { generateToken, generateRefreshToken, JwtPayload } from '../middleware/auth';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER';
  allowedModules: string[];
  avatarInitials: string;
  active: boolean;
  createdAt: string;
}

interface LoginResult {
  user: UserDTO;
  token: string;
  refreshToken: string;
}

// Usuarios por defecto para fallback en memoria (se usan si la BD no está disponible)
const DEFAULT_USERS = [
  {
    id: 'usr-admin-1',
    name: 'Juan Pablo (Administrador)',
    email: 'jmaldonado2378@gmail.com',
    password_hash: '', // Se hashea al inicializar
    role: 'ADMIN' as const,
    allowed_modules_json: JSON.stringify([
      'dashboard', 'customers', 'stock', 'article_families',
      'merchandise_receipt', 'fractioning', 'new_sale', 'kanban_orders', 'kanban_tasks',
      'suppliers', 'checking_accounts', 'finance', 'settings', 'marketing', 'users'
    ]),
    avatar_initials: 'JP',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'usr-seller-1',
    name: 'Rocio Quevedo (Vendedora)',
    email: 'rocioq@floryser.com',
    password_hash: '',
    role: 'SELLER' as const,
    allowed_modules_json: JSON.stringify(['new_sale', 'kanban_orders', 'kanban_tasks', 'customers', 'stock', 'fractioning']),
    avatar_initials: 'RQ',
    active: true,
    created_at: new Date().toISOString()
  }
];

// Contraseñas por defecto (se hashean al inicializar)
const DEFAULT_PASSWORDS: Record<string, string> = {
  'jmaldonado2378@gmail.com': 'admin123',
  'rocioq@floryser.com': 'vendedor123'
};

export class AuthService {
  private db: any; // MySQLAdapter compatible con pg.Pool interface
  private inMemoryUsers: any[] = [];
  private initialized: boolean = false;

  constructor(db: any) {
    this.db = db;
    this.initializeDefaults();
  }

  /**
   * Inicializa los hashes de contraseñas para los usuarios en memoria
   */
  private async initializeDefaults(): Promise<void> {
    if (this.initialized) return;

    for (const user of DEFAULT_USERS) {
      const defaultPass = DEFAULT_PASSWORDS[user.email] || 'password123';
      user.password_hash = await bcrypt.hash(defaultPass, 10);
    }

    this.inMemoryUsers = [...DEFAULT_USERS];
    this.initialized = true;
  }

  /**
   * Autenticación: valida email + contraseña contra la BD o fallback en memoria
   */
  async login(email: string, password: string): Promise<LoginResult | null> {
    // Asegurar que los defaults están inicializados
    await this.initializeDefaults();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      // Intentar autenticación contra la base de datos
      const result = await this.db.query(
        'SELECT id, name, email, password_hash, role, allowed_modules_json, avatar_initials, active, created_at FROM system_users WHERE LOWER(email) = ? AND active = 1',
        [cleanEmail]
      );

      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        const passwordMatch = await bcrypt.compare(cleanPass, dbUser.password_hash);

        if (passwordMatch) {
          return this.buildLoginResult(dbUser);
        }

        return null; // Contraseña incorrecta
      }

      // Si no se encontró en BD, intentar fallback en memoria
      return this.loginInMemory(cleanEmail, cleanPass);
    } catch (err) {
      // Error de BD — usar fallback en memoria
      console.warn('⚠️ Base de datos no disponible para auth, usando fallback en memoria');
      return this.loginInMemory(cleanEmail, cleanPass);
    }
  }

  /**
   * Fallback: autenticación en memoria
   */
  private async loginInMemory(email: string, password: string): Promise<LoginResult | null> {
    const user = this.inMemoryUsers.find(
      u => u.email.toLowerCase() === email && u.active
    );

    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return null;

    return this.buildLoginResult(user);
  }

  /**
   * Construye el resultado de login con tokens JWT
   */
  private buildLoginResult(dbUser: any): LoginResult {
    const allowedModules = typeof dbUser.allowed_modules_json === 'string'
      ? JSON.parse(dbUser.allowed_modules_json)
      : dbUser.allowed_modules_json || [];

    const userDTO: UserDTO = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      allowedModules: allowedModules,
      avatarInitials: dbUser.avatar_initials || dbUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      active: Boolean(dbUser.active),
      createdAt: dbUser.created_at?.toISOString?.() || dbUser.created_at || new Date().toISOString()
    };

    const jwtPayload: JwtPayload = {
      userId: userDTO.id,
      email: userDTO.email,
      role: userDTO.role,
      name: userDTO.name
    };

    return {
      user: userDTO,
      token: generateToken(jwtPayload),
      refreshToken: generateRefreshToken(jwtPayload)
    };
  }

  /**
   * Registra un nuevo usuario en la base de datos
   */
  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'SELLER';
    allowedModules: string[];
    avatarInitials?: string;
  }): Promise<UserDTO> {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const initials = data.avatarInitials || data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const modulesJson = JSON.stringify(data.allowedModules);

    try {
      await this.db.query(
        `INSERT INTO system_users (id, name, email, password_hash, role, allowed_modules_json, avatar_initials, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
        [id, data.name, data.email.toLowerCase(), passwordHash, data.role, modulesJson, initials]
      );

      return {
        id,
        name: data.name,
        email: data.email.toLowerCase(),
        role: data.role,
        allowedModules: data.allowedModules,
        avatarInitials: initials,
        active: true,
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      // Fallback: crear en memoria
      const newUser = {
        id,
        name: data.name,
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        role: data.role,
        allowed_modules_json: modulesJson,
        avatar_initials: initials,
        active: true,
        created_at: new Date().toISOString()
      };
      this.inMemoryUsers.push(newUser);

      return {
        id,
        name: data.name,
        email: data.email.toLowerCase(),
        role: data.role,
        allowedModules: data.allowedModules,
        avatarInitials: initials,
        active: true,
        createdAt: newUser.created_at
      };
    }
  }

  /**
   * Lista todos los usuarios (sin password_hash)
   */
  async getAllUsers(): Promise<UserDTO[]> {
    try {
      const result = await this.db.query(
        'SELECT id, name, email, role, allowed_modules_json, avatar_initials, active, created_at FROM system_users ORDER BY created_at'
      );
      return result.rows.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        allowedModules: typeof u.allowed_modules_json === 'string' ? JSON.parse(u.allowed_modules_json) : u.allowed_modules_json || [],
        avatarInitials: u.avatar_initials,
        active: Boolean(u.active),
        createdAt: u.created_at?.toISOString?.() || u.created_at
      }));
    } catch (err) {
      return this.inMemoryUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        allowedModules: typeof u.allowed_modules_json === 'string' ? JSON.parse(u.allowed_modules_json) : u.allowed_modules_json || [],
        avatarInitials: u.avatar_initials,
        active: Boolean(u.active),
        createdAt: u.created_at
      }));
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUser(userId: string, updates: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'ADMIN' | 'SELLER';
    allowedModules?: string[];
    avatarInitials?: string;
    active?: boolean;
  }): Promise<UserDTO | null> {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.name) { setClauses.push('name = ?'); params.push(updates.name); }
    if (updates.email) { setClauses.push('email = ?'); params.push(updates.email.toLowerCase()); }
    if (updates.password) { setClauses.push('password_hash = ?'); params.push(await bcrypt.hash(updates.password, 10)); }
    if (updates.role) { setClauses.push('role = ?'); params.push(updates.role); }
    if (updates.allowedModules) { setClauses.push('allowed_modules_json = ?'); params.push(JSON.stringify(updates.allowedModules)); }
    if (updates.avatarInitials) { setClauses.push('avatar_initials = ?'); params.push(updates.avatarInitials); }
    if (typeof updates.active === 'boolean') { setClauses.push('active = ?'); params.push(updates.active ? 1 : 0); }

    if (setClauses.length === 0) return null;

    params.push(userId);

    try {
      await this.db.query(
        `UPDATE system_users SET ${setClauses.join(', ')} WHERE id = ?`,
        params
      );

      const result = await this.db.query(
        'SELECT id, name, email, role, allowed_modules_json, avatar_initials, active, created_at FROM system_users WHERE id = ?',
        [userId]
      );

      if (result.rows.length === 0) return null;

      const u = result.rows[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        allowedModules: typeof u.allowed_modules_json === 'string' ? JSON.parse(u.allowed_modules_json) : u.allowed_modules_json || [],
        avatarInitials: u.avatar_initials,
        active: Boolean(u.active),
        createdAt: u.created_at?.toISOString?.() || u.created_at
      };
    } catch (err) {
      // Fallback en memoria
      const user = this.inMemoryUsers.find(u => u.id === userId);
      if (!user) return null;
      Object.assign(user, updates);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        allowedModules: typeof user.allowed_modules_json === 'string' ? JSON.parse(user.allowed_modules_json) : [],
        avatarInitials: user.avatar_initials,
        active: Boolean(user.active),
        createdAt: user.created_at
      };
    }
  }

  /**
   * Elimina (desactiva) un usuario
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'UPDATE system_users SET active = 0 WHERE id = ?',
        [userId]
      );
      return result.rowCount > 0;
    } catch (err) {
      const user = this.inMemoryUsers.find(u => u.id === userId);
      if (user) { user.active = false; return true; }
      return false;
    }
  }
}
