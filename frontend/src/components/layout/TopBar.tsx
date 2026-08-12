import React from 'react';
import { Search, Shield, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onOpenUsers?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenUsers }) => {
  const { user, logout, hasPermission } = useAuth();
  const userName = user?.name || 'María Clara';
  const userAvatar = user?.avatarInitials || 'MC';
  const userRole = user?.role === 'ADMIN' ? 'Administrador' : 'Vendedora';

  return (
    <header className="top-header-bar">
      <div className="top-search-pill">
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Buscar clientes, productos, lotes o transacciones..." 
        />
      </div>
      
      <div className="header-actions">
        {hasPermission('users') && (
          <button 
            className="btn btn-secondary btn-sm" 
            title="Gestión de Usuarios & Permisos"
            onClick={onOpenUsers}
          >
            <Shield size={16} color="#2E5339" />
          </button>
        )}
        <button className="btn btn-secondary btn-sm" title="Notificaciones">
          <Bell size={16} />
        </button>
        <button className="btn btn-secondary btn-sm" title="Ayuda & Soporte">
          <HelpCircle size={16} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
          <div 
            className="customer-avatar" 
            style={{ 
              width: '32px', 
              height: '32px', 
              fontSize: '12px',
              backgroundColor: user?.role === 'ADMIN' ? '#18261E' : '#D97706',
              color: '#FFFFFF',
              fontWeight: 700
            }}
          >
            {userAvatar}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{userName}</span>
            <span style={{ fontSize: '10px', color: user?.role === 'ADMIN' ? '#166534' : '#92400E', fontWeight: 700 }}>
              {userRole}
            </span>
          </div>

          <button
            onClick={logout}
            title="Cerrar Sesión"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#EF4444',
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
