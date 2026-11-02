import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ModuleKey, AuthState } from '../types/auth';
import { addAuditLog, syncAndFetchAuditLogs } from '../api/client';

export interface UserMutationResult {
  success: boolean;
  error?: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: ModuleKey) => boolean;
  users: User[];
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<UserMutationResult>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<UserMutationResult>;
  deleteUser: (userId: string) => Promise<UserMutationResult>;
  syncPendingUsers: () => Promise<{ synced: number; failed: number }>;
  fetchUsers: (activeToken?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api/v1';

const ALL_MODULES: ModuleKey[] = [
  'dashboard', 'customers', 'stock', 'article_families',
  'merchandise_receipt', 'fractioning', 'new_sale', 'kanban_orders', 'kanban_tasks',
  'suppliers', 'checking_accounts', 'finance', 'settings', 'marketing', 'users'
];

const PROTECTED_ADMIN_EMAILS = new Set([
  'jmaldonado2378@gmail.com',
  'memimaldonado05@gmail.com'
]);

const KNOWN_OFFICIAL_PASSWORDS: Record<string, string> = {
  'jmaldonado2378@gmail.com': 'admin123',
  'memimaldonado05@gmail.com': 'LaJefa3012',
  'roquevedo23@gmail.com': 'Laflormaspura',
  'dantesaulommxxii@gmail.com': 'Lasmiradasperdidas'
};

function purgeLegacyLocalDataCaches() {
  const legacyKeys = [
    'floryser_customers_v2',
    'customers',
    'floryser_sales_orders',
    'floryser_sales_orders_v2',
    'floryser_raw_materials_v2',
    'floryser_final_products_v2',
    'floryser_packaging_v2',
    'floryser_families_v3',
    'floryser_tasks_v2',
    'floryser_expenses_v2',
    'floryser_suppliers_v2',
    'floryser_receipts_v2',
    'floryser_checking_account_movements_v2'
  ];
  legacyKeys.forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });
}

function normalizeUserObject(u: User): User {
  const emailLower = (u.email || '').trim().toLowerCase();
  const isProt = Boolean(u.isProtected || PROTECTED_ADMIN_EMAILS.has(emailLower));
  const effectiveRole = isProt ? 'ADMIN' : u.role;
  const effectiveModules = effectiveRole === 'ADMIN' ? ALL_MODULES : (u.allowedModules || []);
  const cleanPass = (u.password && u.password !== '123456') ? u.password : undefined;
  return {
    ...u,
    email: emailLower || u.email,
    role: effectiveRole,
    isProtected: isProt,
    active: isProt ? true : u.active,
    allowedModules: effectiveModules,
    password: cleanPass || KNOWN_OFFICIAL_PASSWORDS[emailLower]
  };
}

const DEFAULT_INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Juan Pablo (Administrador)',
    email: 'jmaldonado2378@gmail.com',
    password: 'admin123',
    role: 'ADMIN',
    isProtected: true,
    allowedModules: ALL_MODULES,
    avatarInitials: 'JP',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-seller-1',
    name: 'María Emilia Maldonado',
    email: 'memimaldonado05@gmail.com',
    password: 'LaJefa3012',
    role: 'ADMIN',
    isProtected: true,
    allowedModules: ALL_MODULES,
    avatarInitials: 'ME',
    active: true,
    createdAt: new Date().toISOString()
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('floryser_users_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeUserObject);
        }
      } catch (e) {
        console.error('Error al cargar usuarios guardados:', e);
      }
    }
    return DEFAULT_INITIAL_USERS.map(normalizeUserObject);
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const fetchUsers = async (activeToken?: string | null) => {
    const currentToken = activeToken !== undefined ? activeToken : token;
    if (!currentToken || currentToken.startsWith('jwt-local-')) return;

    try {
      const response = await fetch(`${API_BASE}/auth/users`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (response.status === 401) {
        console.warn('⚠️ Token de sesión expirado en el servidor');
        localStorage.removeItem('floryser_jwt_token');
        localStorage.removeItem('floryser_current_user_v2');
        setCurrentUser(null);
        setToken(null);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        const apiUsers: User[] = result.data || result;
        if (Array.isArray(apiUsers) && apiUsers.length > 0) {
          const normalizedServerUsers = apiUsers.map(apiUser => {
            const emailKey = (apiUser.email || '').trim().toLowerCase();
            const cleanServerPass = (apiUser.password && apiUser.password !== '123456') ? apiUser.password : undefined;
            return normalizeUserObject({
              ...apiUser,
              password: cleanServerPass || KNOWN_OFFICIAL_PASSWORDS[emailKey]
            });
          });

          setUsers(normalizedServerUsers);
          localStorage.setItem('floryser_users_v2', JSON.stringify(normalizedServerUsers));

          // Sincronizar también el usuario con sesión activa para que ambos Administradores vean exactamente los mismos módulos
          setCurrentUser(prevCurr => {
            if (!prevCurr) return prevCurr;
            const currEmail = (prevCurr.email || '').trim().toLowerCase();
            const matchedFromDb = normalizedServerUsers.find(
              u => u.id === prevCurr.id || (u.email || '').trim().toLowerCase() === currEmail
            );
            const updatedCurr = normalizeUserObject(matchedFromDb ? { ...prevCurr, ...matchedFromDb } : prevCurr);
            localStorage.setItem('floryser_current_user_v2', JSON.stringify(updatedCurr));
            return updatedCurr;
          });
        }
      }
    } catch (e) {
      console.warn('No se pudo sincronizar la lista de usuarios desde MySQL:', e);
    }
  };

  // Restaurar sesión desde localStorage al cargar y purgar cachés locales obsoletos
  useEffect(() => {
    purgeLegacyLocalDataCaches();

    const savedToken = localStorage.getItem('floryser_jwt_token');
    const savedUser = localStorage.getItem('floryser_current_user_v2');

    if (savedToken && savedToken.startsWith('jwt-local-')) {
      localStorage.removeItem('floryser_jwt_token');
      localStorage.removeItem('floryser_current_user_v2');
      setCurrentUser(null);
      setToken(null);
      return;
    }

    if (savedToken && savedUser) {
      try {
        const rawUser = JSON.parse(savedUser);
        const user = normalizeUserObject(rawUser);
        setCurrentUser(user);
        setToken(savedToken);
        localStorage.setItem('floryser_current_user_v2', JSON.stringify(user));
        fetchUsers(savedToken);
        syncAndFetchAuditLogs();
      } catch (e) {
        localStorage.removeItem('floryser_jwt_token');
        localStorage.removeItem('floryser_current_user_v2');
      }
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('floryser_users_v2', JSON.stringify(users));
    }
  }, [users]);

  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });

      if (response.ok) {
        purgeLegacyLocalDataCaches();
        const data = await response.json();
        const user: User = normalizeUserObject({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isProtected: data.user.isProtected,
          allowedModules: data.user.allowedModules || [],
          avatarInitials: data.user.avatarInitials || data.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          avatarUrl: data.user.avatarUrl,
          active: data.user.active,
          lastLoginAt: data.user.lastLoginAt || new Date().toISOString(),
          createdAt: data.user.createdAt || new Date().toISOString(),
        });

        setCurrentUser(user);
        setToken(data.token);

        localStorage.setItem('floryser_jwt_token', data.token);
        localStorage.setItem('floryser_current_user_v2', JSON.stringify(user));

        fetchUsers(data.token);
        syncAndFetchAuditLogs();

        return true;
      }

      return false;
    } catch (err) {
      console.error('Error de conexión en login:', err);
      return false;
    }
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog({
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'CIERRE_SESION',
        module: 'Sistema',
        details: `Cierre de sesión de ${currentUser.name}`
      });
    }
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('floryser_jwt_token');
    localStorage.removeItem('floryser_current_user_v2');
  };

  const hasPermission = (module: ModuleKey): boolean => {
    if (!currentUser) return false;
    const emailLower = (currentUser.email || '').trim().toLowerCase();
    if (currentUser.role === 'ADMIN' || PROTECTED_ADMIN_EMAILS.has(emailLower)) return true;
    return currentUser.allowedModules.includes(module);
  };

  const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<UserMutationResult> => {
    if (!token || token.startsWith('jwt-local-')) {
      return {
        success: false,
        error: 'Tu sesión no está conectada a la nube. Por favor, cierra sesión y vuelve a ingresar como Administrador con tu clave oficial.'
      };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await fetchUsers(token);
        await syncAndFetchAuditLogs();
        return { success: true };
      } else {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errJson.error || errJson.message || `Error del servidor (${response.status})`
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error de conexión con el servidor al crear usuario'
      };
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<UserMutationResult> => {
    if (!token || token.startsWith('jwt-local-')) {
      return {
        success: false,
        error: 'Sesión expirada o no autorizada. Reingresa como Administrador.'
      };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const json = await response.json().catch(() => ({}));
        const updatedServerUser: User | undefined = json.data;

        setUsers(prev => {
          const updated = prev.map(u => {
            if (u.id === userId) {
              return {
                ...u,
                ...updates,
                ...(updatedServerUser || {}),
                password: updates.password || updatedServerUser?.password || u.password
              };
            }
            return u;
          });
          localStorage.setItem('floryser_users_v2', JSON.stringify(updated));
          return updated;
        });

        if (currentUser && currentUser.id === userId) {
          const updatedMe = { ...currentUser, ...updates, ...(updatedServerUser || {}) };
          setCurrentUser(updatedMe);
          localStorage.setItem('floryser_current_user_v2', JSON.stringify(updatedMe));
        }

        await syncAndFetchAuditLogs();
        return { success: true };
      } else {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errJson.error || `Error ${response.status}`
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al conectar con el servidor'
      };
    }
  };

  const deleteUser = async (userId: string): Promise<UserMutationResult> => {
    if (!token || token.startsWith('jwt-local-')) {
      return {
        success: false,
        error: 'Sesión expirada o no autorizada.'
      };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers(prev => {
          const updated = prev.filter(u => u.id !== userId);
          localStorage.setItem('floryser_users_v2', JSON.stringify(updated));
          return updated;
        });

        await syncAndFetchAuditLogs();
        return { success: true };
      } else {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errJson.error || `Error ${response.status}`
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al conectar con el servidor'
      };
    }
  };

  /**
   * Sincroniza usuarios y contraseñas locales con MySQL y unifica la Auditoría
   */
  const syncPendingUsers = async (): Promise<{ synced: number; failed: number }> => {
    if (!token || token.startsWith('jwt-local-')) {
      return { synced: 0, failed: 0 };
    }

    try {
      const resp = await fetch(`${API_BASE}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) return { synced: 0, failed: 0 };

      const json = await resp.json();
      const dbUsers: User[] = json.data || [];
      const dbByEmail = new Map<string, User>();
      dbUsers.forEach(u => dbByEmail.set(u.email.toLowerCase(), u));

      let synced = 0;
      let failed = 0;

      for (const localUser of users) {
        const emailLower = localUser.email.toLowerCase();
        const existingDb = dbByEmail.get(emailLower);

        if (!existingDb) {
          const officialPass = KNOWN_OFFICIAL_PASSWORDS[emailLower];
          const cleanLocalPass = (localUser.password && localUser.password !== '123456') ? localUser.password : undefined;
          const createRes = await fetch(`${API_BASE}/auth/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: localUser.name,
              email: emailLower,
              password: cleanLocalPass || officialPass || 'vendedor123',
              role: PROTECTED_ADMIN_EMAILS.has(emailLower) ? 'ADMIN' : localUser.role,
              allowedModules: PROTECTED_ADMIN_EMAILS.has(emailLower) ? ALL_MODULES : localUser.allowedModules,
              avatarInitials: localUser.avatarInitials,
              avatarUrl: localUser.avatarUrl,
              active: PROTECTED_ADMIN_EMAILS.has(emailLower) ? true : localUser.active
            })
          });

          if (createRes.ok) synced++;
          else failed++;
        } else if (!existingDb.password && KNOWN_OFFICIAL_PASSWORDS[emailLower]) {
          // Solo si MySQL aún no tenía visible_password para un usuario oficial conocido, restaurar su clave oficial
          const updateRes = await fetch(`${API_BASE}/auth/users/${existingDb.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              password: KNOWN_OFFICIAL_PASSWORDS[emailLower]
            })
          });
          if (updateRes.ok) synced++;
        }
      }

      await fetchUsers(token);
      await syncAndFetchAuditLogs();
      return { synced, failed };
    } catch {
      return { synced: 0, failed: 0 };
    }
  };

  return (
    <AuthContext.Provider value={{
      user: currentUser,
      token,
      isAuthenticated: !!currentUser,
      login,
      logout,
      hasPermission,
      users,
      createUser,
      updateUser,
      deleteUser,
      syncPendingUsers,
      fetchUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
