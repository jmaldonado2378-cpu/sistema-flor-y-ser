import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ModuleKey, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: ModuleKey) => boolean;
  users: User[];
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Administrador General',
    email: 'admin@floryser.com',
    role: 'ADMIN',
    allowedModules: [
      'dashboard', 'customers', 'stock', 'article_families',
      'merchandise_receipt', 'fractioning', 'new_sale', 'kanban_orders',
      'suppliers', 'checking_accounts', 'finance', 'settings', 'marketing', 'users'
    ],
    avatarInitials: 'AD',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-seller-1',
    name: 'María Clara Fernández (Vendedora)',
    email: 'vendedor@floryser.com',
    role: 'SELLER',
    allowedModules: ['new_sale', 'kanban_orders', 'customers', 'stock', 'fractioning'],
    avatarInitials: 'MC',
    active: true,
    createdAt: new Date().toISOString()
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('floryser_users_v2');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('floryser_current_user_v2');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0]; // Inicia con el Admin por defecto si no hay sesión
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('floryser_jwt_token') || 'token-demo-floryser-2026';
  });

  useEffect(() => {
    localStorage.setItem('floryser_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('floryser_current_user_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('floryser_current_user_v2');
    }
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Buscar usuario por email
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active);
    
    // Para entornos demo/producción: validar credenciales o accesos demo
    if (foundUser) {
      setCurrentUser(foundUser);
      const demoToken = `jwt-token-${foundUser.id}-${Date.now()}`;
      setToken(demoToken);
      localStorage.setItem('floryser_jwt_token', demoToken);
      return true;
    }

    // Si intenta con "admin" o "vendedor" como alias rápido
    if (email === 'admin' || email === 'admin@floryser.com') {
      setCurrentUser(users[0]);
      return true;
    }
    if (email === 'vendedor' || email === 'vendedor@floryser.com') {
      setCurrentUser(users[1] || users[0]);
      return true;
    }

    return false;
  };

  const logout = () => {
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

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
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
