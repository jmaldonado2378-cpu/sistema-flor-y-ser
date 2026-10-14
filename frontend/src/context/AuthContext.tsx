import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ModuleKey, AuthState } from '../types/auth';
import { addAuditLog } from '../api/client';

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

const DEFAULT_INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Juan Pablo (Administrador)',
    email: 'jmaldonado2378@gmail.com',
    password: 'admin123',
    role: 'ADMIN',
    allowedModules: [
      'dashboard', 'customers', 'stock', 'article_families',
      'merchandise_receipt', 'fractioning', 'new_sale', 'kanban_orders', 'kanban_tasks',
      'suppliers', 'checking_accounts', 'finance', 'settings', 'marketing', 'users'
    ],
    avatarInitials: 'JP',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-seller-1',
    name: 'Emilia Maldonado Hernandez',
    email: 'memimaldonado05@gmail.com',
    password: 'LaJefa3012',
    role: 'SELLER',
    allowedModules: ['dashboard', 'customers', 'stock', 'new_sale', 'kanban_orders', 'fractioning'],
    avatarInitials: 'EH',
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error al cargar usuarios guardados:', e);
      }
    }
    return DEFAULT_INITIAL_USERS;
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
          // Fusionar preservando contraseñas conocidas localmente para comodidad del admin
          setUsers(prev => {
            const passMap = new Map<string, string>();
            prev.forEach(u => {
              if (u.password) passMap.set(u.email.toLowerCase(), u.password);
            });
            const merged = apiUsers.map(u => ({
              ...u,
              password: passMap.get(u.email.toLowerCase()) || u.password
            }));
            localStorage.setItem('floryser_users_v2', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn('No se pudo sincronizar la lista de usuarios desde MySQL:', e);
    }
  };

  // Restaurar sesión desde localStorage al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem('floryser_jwt_token');
    const savedUser = localStorage.getItem('floryser_current_user_v2');

    // Si el token guardado es el demo local obsoleto, limpiarlo para forzar sesión real JWT
    if (savedToken && savedToken.startsWith('jwt-local-')) {
      console.warn('🧹 Token demo obsoleto detectado. Purgando para solicitar autenticación real en la nube...');
      localStorage.removeItem('floryser_jwt_token');
      localStorage.removeItem('floryser_current_user_v2');
      setCurrentUser(null);
      setToken(null);
      return;
    }

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setToken(savedToken);
        fetchUsers(savedToken);
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
      // Autenticación real contra el backend API de Hostinger
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });

      if (response.ok) {
        const data = await response.json();
        const user: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          allowedModules: data.user.allowedModules || [],
          avatarInitials: data.user.avatarInitials || data.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          active: data.user.active,
          createdAt: data.user.createdAt || new Date().toISOString(),
        };

        setCurrentUser(user);
        setToken(data.token);

        // Persistir sesión oficial con JWT
        localStorage.setItem('floryser_jwt_token', data.token);
        localStorage.setItem('floryser_current_user_v2', JSON.stringify(user));

        addAuditLog({
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          action: 'INICIO_SESION',
          module: 'Sistema',
          details: `Inicio de sesión exitoso de ${user.name}`
        });

        // Cargar inmediatamente la lista de usuarios actualizada desde la base de datos
        fetchUsers(data.token);

        return true;
      }

      // Si las credenciales fueron rechazadas por el servidor
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
    if (currentUser.role === 'ADMIN') return true;
    return currentUser.allowedModules.includes(module);
  };

  /**
   * Crea un usuario guardándolo directamente en MySQL de Hostinger
   */
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
        const data = await response.json();
        const newUser: User = {
          ...userData,
          id: data.data?.id || `usr-${Date.now()}`,
          createdAt: data.data?.createdAt || new Date().toISOString(),
        };

        setUsers(prev => {
          const filtered = prev.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase());
          const updated = [...filtered, newUser];
          localStorage.setItem('floryser_users_v2', JSON.stringify(updated));
          return updated;
        });

        if (currentUser) {
          addAuditLog({
            userName: currentUser.name,
            userEmail: currentUser.email,
            userRole: currentUser.role,
            action: 'CREAR_USUARIO',
            module: 'Usuarios & Permisos',
            details: `Nuevo usuario creado en MySQL: ${userData.name} (${userData.email}) con rol ${userData.role}`
          });
        }

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

  /**
   * Actualiza un usuario en la base de datos de Hostinger
   */
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
        setUsers(prev => {
          const updated = prev.map(u => u.id === userId ? { ...u, ...updates } : u);
          localStorage.setItem('floryser_users_v2', JSON.stringify(updated));
          return updated;
        });

        if (currentUser && currentUser.id === userId) {
          setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
        }

        if (currentUser) {
          addAuditLog({
            userName: currentUser.name,
            userEmail: currentUser.email,
            userRole: currentUser.role,
            action: 'ACTUALIZAR_USUARIO',
            module: 'Usuarios & Permisos',
            details: `Actualización de usuario ID #${userId} guardada en MySQL`
          });
        }

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
   * Elimina / desactiva un usuario en la base de datos
   */
  const deleteUser = async (userId: string): Promise<UserMutationResult> => {
    if (!token || token.startsWith('jwt-local-')) {
      return {
        success: false,
        error: 'Sesión expirada o no autorizada.'
      };
    }

    try {
      const targetUser = users.find(u => u.id === userId);
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

        if (currentUser) {
          addAuditLog({
            userName: currentUser.name,
            userEmail: currentUser.email,
            userRole: currentUser.role,
            action: 'ELIMINAR_USUARIO',
            module: 'Usuarios & Permisos',
            details: `Eliminación de usuario ${targetUser?.name || userId} en MySQL`
          });
        }

        if (currentUser && currentUser.id === userId) {
          logout();
        }

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
   * Sincroniza usuarios creados localmente que aún no estén en MySQL de Hostinger
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
      const dbEmails = new Set(dbUsers.map(u => u.email.toLowerCase()));

      let synced = 0;
      let failed = 0;

      for (const localUser of users) {
        if (!dbEmails.has(localUser.email.toLowerCase())) {
          const createRes = await fetch(`${API_BASE}/auth/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: localUser.name,
              email: localUser.email,
              password: localUser.password || 'vendedor123',
              role: localUser.role,
              allowedModules: localUser.allowedModules,
              avatarInitials: localUser.avatarInitials
            })
          });

          if (createRes.ok) {
            synced++;
          } else {
            failed++;
          }
        }
      }

      await fetchUsers(token);
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
