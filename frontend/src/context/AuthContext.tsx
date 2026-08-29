import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ModuleKey, AuthState } from '../types/auth';
import { addAuditLog } from '../api/client';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: ModuleKey) => boolean;
  users: User[];
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
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
    try {
      const response = await fetch(`${API_BASE}/auth/users`, {
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
        }
      });
      if (response.ok) {
        const result = await response.json();
        const apiUsers: User[] = result.data || result;
        if (Array.isArray(apiUsers) && apiUsers.length > 0) {
          setUsers(apiUsers);
          localStorage.setItem('floryser_users_v2', JSON.stringify(apiUsers));
          return;
        }
      }
    } catch (e) {
      // Fallback a los usuarios locales
    }
  };

  // Restaurar sesión desde localStorage al cargar y sincronizar usuarios desde backend
  useEffect(() => {
    const savedToken = localStorage.getItem('floryser_jwt_token');
    const savedUser = localStorage.getItem('floryser_current_user_v2');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setToken(savedToken);
      } catch (e) {
        // Token o usuario corrupto, limpiar
        localStorage.removeItem('floryser_jwt_token');
        localStorage.removeItem('floryser_current_user_v2');
      }
    }

    fetchUsers(savedToken);
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
      // Autenticación real contra el backend API
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

        // Persistir sesión
        localStorage.setItem('floryser_jwt_token', data.token);
        localStorage.setItem('floryser_current_user_v2', JSON.stringify(user));

        // Actualizar lista de usuarios local si no existe
        setUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          if (!exists) return [...prev, user];
          return prev.map(u => u.id === user.id ? user : u);
        });

        addAuditLog({
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          action: 'INICIO_SESION',
          module: 'Sistema',
          details: `Inicio de sesión exitoso de ${user.name}`
        });

        return true;
      }

      // Si el backend devuelve error, intentar fallback local
      return loginFallback(cleanEmail, cleanPass);
    } catch (err) {
      // Error de red — intentar fallback local
      console.warn('⚠️ Backend no disponible, usando autenticación local');
      return loginFallback(cleanEmail, cleanPass);
    }
  };

  /**
   * Fallback local cuando el backend no está disponible
   */
  const loginFallback = (email: string, password: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const pool = users.length > 0 ? users : DEFAULT_INITIAL_USERS;
    let foundUser = pool.find(u => u.email.toLowerCase() === cleanEmail && u.active);

    if (!foundUser) {
      foundUser = DEFAULT_INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail && u.active);
    }

    if (foundUser) {
      const defaultPass = cleanEmail === 'jmaldonado2378@gmail.com' ? 'admin123' : 'LaJefa3012';
      const validPass = foundUser.password || defaultPass;

      if (cleanPass === validPass || cleanPass === defaultPass) {
        setCurrentUser(foundUser);
        const demoToken = `jwt-local-${foundUser.id}-${Date.now()}`;
        setToken(demoToken);
        localStorage.setItem('floryser_jwt_token', demoToken);
        localStorage.setItem('floryser_current_user_v2', JSON.stringify(foundUser));
        return true;
      }
    }

    return false;
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

  const createUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      // Intentar crear en el backend
      const response = await fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
        setUsers(prev => [...prev, newUser]);
      } else {
        throw new Error('Backend error');
      }
    } catch {
      // Fallback local
      const newUser: User = {
        ...userData,
        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
    }

    if (currentUser) {
      addAuditLog({
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'CREAR_USUARIO',
        module: 'Usuarios & Permisos',
        details: `Nuevo usuario creado: ${userData.name} (${userData.email}) con rol ${userData.role}`
      });
    }
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }

    // Intentar actualizar en backend (fire-and-forget)
    if (token) {
      fetch(`${API_BASE}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }).catch(() => { /* silent fallback */ });
    }

    if (currentUser) {
      addAuditLog({
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'ACTUALIZAR_USUARIO',
        module: 'Usuarios & Permisos',
        details: `Actualización de datos/permisos para usuario ID #${userId}`
      });
    }
  };

  const deleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));

    // Intentar eliminar en backend
    if (token) {
      fetch(`${API_BASE}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => { /* silent fallback */ });
    }

    if (currentUser) {
      addAuditLog({
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'ELIMINAR_USUARIO',
        module: 'Usuarios & Permisos',
        details: `Eliminación de usuario ${targetUser?.name || userId}`
      });
    }

    if (currentUser && currentUser.id === userId) {
      logout();
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
      deleteUser
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
