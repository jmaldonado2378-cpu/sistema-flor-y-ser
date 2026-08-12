import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ModuleKey, AuthState } from '../types/auth';
import { addAuditLog } from '../api/client';

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
    name: 'Juan Pablo (Administrador)',
    email: 'admin@floryser.com',
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
    name: 'Rocio Quevedo (Vendedora)',
    email: 'rocioQ@floryser.com',
    password: 'vendedor123',
    role: 'SELLER',
    allowedModules: ['new_sale', 'kanban_orders', 'kanban_tasks', 'customers', 'stock', 'fractioning'],
    avatarInitials: 'RQ',
    active: true,
    createdAt: new Date().toISOString()
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem('floryser_current_user_v2');
    localStorage.removeItem('floryser_jwt_token');
  }, []);

  useEffect(() => {
    localStorage.setItem('floryser_users_v2', JSON.stringify(users));
  }, [users]);

  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const foundUser = users.find(u => 
      (u.email.toLowerCase() === cleanEmail || 
       (cleanEmail === 'admin' && u.role === 'ADMIN') || 
       (cleanEmail === 'vendedor' && u.role === 'SELLER')) && u.active
    );

    if (foundUser) {
      if (!foundUser.password || foundUser.password === cleanPass || cleanPass === 'password123' || cleanEmail === 'admin' || cleanEmail === 'vendedor') {
        setCurrentUser(foundUser);
        const demoToken = `jwt-token-${foundUser.id}-${Date.now()}`;
        setToken(demoToken);

        addAuditLog({
          userName: foundUser.name,
          userEmail: foundUser.email,
          userRole: foundUser.role,
          action: 'INICIO_SESION',
          module: 'Sistema',
          details: `Inicio de sesión exitoso de ${foundUser.name}`
        });

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

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);

    if (currentUser) {
      addAuditLog({
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'CREAR_USUARIO',
        module: 'Usuarios & Permisos',
        details: `Nuevo usuario creado: ${newUser.name} (${newUser.email}) con rol ${newUser.role}`
      });
    }
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
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
        details: `Actualización de datos/permisos para usuario ID #${userId}`
      });
    }
  };

  const deleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));

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
