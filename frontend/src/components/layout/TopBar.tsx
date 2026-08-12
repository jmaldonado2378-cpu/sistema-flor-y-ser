import React, { useState } from 'react';
import { Search, Shield, Bell, HelpCircle, LogOut, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onOpenUsers?: () => void;
  onTabChange?: (tab: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenUsers, onTabChange }) => {
  const { user, logout, hasPermission } = useAuth();
  const userName = user?.name || 'María Clara';
  const userAvatar = user?.avatarInitials || 'MC';
  const userRole = user?.role === 'ADMIN' ? 'Administrador' : 'Vendedora';

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notifications = [
    { id: '1', title: 'Alerta de Stock Mínimo', text: 'Semillas de Chía (MP-CHIA-01) llegó al límite de 8 KG.', type: 'warning' },
    { id: '2', title: 'Tarea Kanban Pendiente', text: 'Fraccionar Lentejas Turcas 500g asignada a tu usuario.', type: 'info' },
    { id: '3', title: 'Cobro Registrado', text: 'María Clara Fernández abonó $17.500 en mostrador.', type: 'success' }
  ];

  return (
    <header className="top-header-bar" style={{ position: 'relative' }}>
      {/* Búsqueda Global */}
      <div className="top-search-pill" style={{ position: 'relative' }}>
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Buscar clientes, productos, lotes o transacciones..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(e.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (searchQuery.trim().length > 0) setShowSearchResults(true);
          }}
        />

        {showSearchResults && (
          <div style={{
            position: 'absolute',
            top: '42px',
            left: 0,
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
            border: '1px solid #E2E8F0',
            zIndex: 9999,
            padding: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Resultados Rápidos</span>
              <button onClick={() => setShowSearchResults(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button 
                onClick={() => { if (onTabChange) onTabChange('tab-stock'); setShowSearchResults(false); }}
                style={{ padding: '8px', border: 'none', backgroundColor: '#F8FAFC', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '13px' }}
              >
                📦 <strong>Productos / Stock:</strong> Buscar "{searchQuery}" en catálogo
              </button>
              <button 
                onClick={() => { if (onTabChange) onTabChange('tab-crm'); setShowSearchResults(false); }}
                style={{ padding: '8px', border: 'none', backgroundColor: '#F8FAFC', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '13px' }}
              >
                👤 <strong>Clientes CRM:</strong> Filtrar por "{searchQuery}"
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="header-actions">
        {hasPermission('users') && (
          <button 
            className="btn btn-secondary btn-sm" 
            title="Gestión de Usuarios & Permisos"
            onClick={() => {
              if (onOpenUsers) onOpenUsers();
              else if (onTabChange) onTabChange('tab-users');
            }}
          >
            <Shield size={16} color="#2E5339" />
          </button>
        )}

        {/* Botón Notificaciones */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            title="Notificaciones del Sistema"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <Bell size={16} />
            <span style={{
              position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%'
            }} />
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '40px',
              right: 0,
              width: '320px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              border: '1px solid #E2E8F0',
              zIndex: 9999,
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Notificaciones ({notifications.length})</h4>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '8px', backgroundColor: n.type === 'warning' ? '#FEFCE8' : n.type === 'success' ? '#F0FDF4' : '#F0F9FF' }}>
                    {n.type === 'warning' ? <AlertTriangle size={16} color="#D97706" /> : n.type === 'success' ? <CheckCircle2 size={16} color="#16A34A" /> : <Info size={16} color="#0284C7" />}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>{n.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{n.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botón Ayuda & Soporte */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            title="Ayuda & Soporte Técnico"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle size={16} />
          </button>

          {showHelp && (
            <div style={{
              position: 'absolute',
              top: '40px',
              right: 0,
              width: '340px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              border: '1px solid #E2E8F0',
              zIndex: 9999,
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Centro de Ayuda & Soporte</h4>
                <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
              </div>

              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0 }}>🌿 <strong>Punto de Venta:</strong> Registre ventas en mostrador, aplique descuentos y gestione el ticket.</p>
                <p style={{ margin: 0 }}>📦 <strong>Materia Prima & Familias:</strong> Asigne la familia correspondiente a cada insumo o granel.</p>
                <p style={{ margin: 0 }}>🔒 <strong>Permisos:</strong> Configure el acceso a Kanban de Tareas por cada usuario vendedor.</p>
                <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '6px', fontSize: '11px', marginTop: '6px' }}>
                  📞 <strong>Soporte Técnico:</strong> soporte@floryser.com.ar | WhatsApp: +54 9 11 5543-9821
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Usuario en TopBar: Mantiene solo iniciales en texto (Foto reservada a Sidebar) */}
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
