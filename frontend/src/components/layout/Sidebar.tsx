import React, { useEffect } from 'react';
import { 
  Menu, Leaf, LayoutDashboard, Users, Package, Download, Scale, 
  ShoppingCart, Kanban, Truck, Wallet, Building2, Receipt, Calculator, 
  CheckSquare, Printer, Settings, FolderTree, Shield, LogOut
} from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../context/AuthContext';
import { ModuleKey } from '../../types/auth';

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

type NavItem = { id: string; label: string; icon: React.ElementType; moduleKey: ModuleKey };
type NavSection = { title: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'tab-dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleKey: 'dashboard' },
      { id: 'tab-crm', label: 'CRM Clientes', icon: Users, moduleKey: 'customers' }
    ]
  },
  {
    title: 'INVENTARIO',
    items: [
      { id: 'tab-stock', label: 'Stock & Productos', icon: Package, moduleKey: 'stock' },
      { id: 'tab-families', label: 'Familias Artículos', icon: FolderTree, moduleKey: 'article_families' },
      { id: 'tab-receipts', label: 'Recepción Mercadería', icon: Download, moduleKey: 'merchandise_receipt' },
      { id: 'tab-fractional', label: 'Fraccionado', icon: Scale, moduleKey: 'fractioning' }
    ]
  },
  {
    title: 'COMERCIAL',
    items: [
      { id: 'tab-sales', label: 'Nueva Venta', icon: ShoppingCart, moduleKey: 'new_sale' },
      { id: 'tab-orders', label: 'Kanban Pedidos', icon: Kanban, moduleKey: 'kanban_orders' },
      { id: 'tab-suppliers', label: 'Proveedores', icon: Truck, moduleKey: 'suppliers' }
    ]
  },
  {
    title: 'FINANZAS',
    items: [
      { id: 'tab-cc-clients', label: 'Cta Cte Clientes', icon: Wallet, moduleKey: 'checking_accounts' },
      { id: 'tab-cc-suppliers', label: 'Cta Cte Proveedores', icon: Building2, moduleKey: 'suppliers' },
      { id: 'tab-expenses', label: 'Gastos', icon: Receipt, moduleKey: 'finance' },
      { id: 'tab-pricing', label: 'Precios & Costos', icon: Calculator, moduleKey: 'finance' }
    ]
  },
  {
    title: 'OPERACIONES',
    items: [
      { id: 'tab-tasks', label: 'Kanban Tareas', icon: CheckSquare, moduleKey: 'kanban_tasks' },
      { id: 'tab-labels', label: 'Etiquetas', icon: Printer, moduleKey: 'stock' }
    ]
  },
  {
    title: 'SISTEMA',
    items: [
      { id: 'tab-users', label: 'Usuarios & Permisos', icon: Shield, moduleKey: 'users' },
      { id: 'tab-settings', label: 'Configuración', icon: Settings, moduleKey: 'settings' }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, collapsed, onToggleCollapse }) => {
  const { data: settings, refetch } = useSettings();
  const { user, logout, hasPermission } = useAuth();

  useEffect(() => {
    const handleSettingsUpdate = () => {
      refetch();
    };
    window.addEventListener('floryser_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('floryser_settings_updated', handleSettingsUpdate);
  }, [refetch]);

  const logoUrl = settings?.businessInfo?.logoUrl;
  const businessName = settings?.businessInfo?.name || 'Flor y Ser';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-header">
        <div className="brand-logo flex items-center justify-center" style={{ height: '36px', maxWidth: '36px', flexShrink: 0, padding: '2px' }}>
          <img 
            src={logoUrl || "/favicon.svg"} 
            alt="Logo Marca" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/favicon.svg";
            }} 
          />
        </div>
        {!collapsed && (
          <div className="brand-title text-ellipsis overflow-hidden whitespace-nowrap" title={businessName}>
            {businessName.length > 16 ? `${businessName.substring(0, 15)}...` : businessName}
          </div>
        )}
        <button 
          onClick={onToggleCollapse} 
          aria-label="Alternar menú"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 'auto' }}
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="sidebar-content">
        {navSections.map((section, idx) => {
          const allowedItems = section.items.filter(item => hasPermission(item.moduleKey));
          if (allowedItems.length === 0) return null;

          return (
            <div key={idx} className="nav-section">
              {!collapsed && <h3 className="nav-section-title">{section.title}</h3>}
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onTabChange(item.id)}
                    data-tab={item.id}
                    title={collapsed ? item.label : undefined}
                    style={{ width: '100%', border: 'none', cursor: 'pointer', background: isActive ? 'var(--primary-light)' : 'transparent' }}
                  >
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Pie de Sidebar */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {hasPermission('new_sale') && (
          <button 
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => onTabChange('tab-sales')}
          >
            <ShoppingCart size={16} />
            {!collapsed && <span>+ Nueva Venta</span>}
          </button>
        )}

        {user && (
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            padding: collapsed ? '8px' : '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #E2E8F0'
          }}>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid #2E5339',
                      flexShrink: 0
                    }} 
                  />
                ) : (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: user.role === 'ADMIN' ? '#18261E' : '#D97706',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '11px',
                    flexShrink: 0
                  }}>
                    {user.avatarInitials}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '10px', color: user.role === 'ADMIN' ? '#166534' : '#92400E', fontWeight: 600 }}>
                    {user.role === 'ADMIN' ? 'Administrador' : 'Vendedora'}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              title="Cerrar Sesión"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#EF4444',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
