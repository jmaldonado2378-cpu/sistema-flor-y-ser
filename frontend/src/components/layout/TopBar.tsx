import React from 'react';
import { Search, Shield, Bell, HelpCircle } from 'lucide-react';

interface TopBarProps {
  userName: string;
  userAvatar?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ userName, userAvatar = 'MC' }) => {
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
        <button className="btn btn-secondary btn-sm" title="Seguridad & Usuarios">
          <Shield size={16} />
        </button>
        <button className="btn btn-secondary btn-sm" title="Notificaciones">
          <Bell size={16} />
        </button>
        <button className="btn btn-secondary btn-sm" title="Ayuda & Soporte">
          <HelpCircle size={16} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
          <div className="customer-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
            {userAvatar}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{userName}</span>
        </div>
      </div>
    </header>
  );
};
