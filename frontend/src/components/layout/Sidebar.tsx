import React from 'react';
import { 
  Menu, Leaf, LayoutDashboard, Users, Package, Download, Scale, 
  ShoppingCart, Kanban, Truck, Wallet, Building2, Receipt, Calculator, 
  CheckSquare, Printer, Settings, FolderTree
} from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

type NavItem = { id: string; label: string; icon: React.ElementType };
type NavSection = { title: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'tab-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tab-crm', label: 'CRM Clientes', icon: Users }
    ]
  },
  {
    title: 'INVENTARIO',
    items: [
      { id: 'tab-stock', label: 'Stock & Productos', icon: Package },
      { id: 'tab-families', label: 'Familias Artículos', icon: FolderTree },
      { id: 'tab-receipts', label: 'Recepción Mercadería', icon: Download },
      { id: 'tab-fractional', label: 'Fraccionado', icon: Scale }
    ]
  },
  {
    title: 'COMERCIAL',
    items: [
      { id: 'tab-sales', label: 'Nueva Venta', icon: ShoppingCart },
      { id: 'tab-orders', label: 'Kanban Pedidos', icon: Kanban },
      { id: 'tab-suppliers', label: 'Proveedores', icon: Truck }
    ]
  },
  {
    title: 'FINANZAS',
    items: [
      { id: 'tab-cc-clients', label: 'Cta Cte Clientes', icon: Wallet },
      { id: 'tab-cc-suppliers', label: 'Cta Cte Proveedores', icon: Building2 },
      { id: 'tab-expenses', label: 'Gastos', icon: Receipt },
      { id: 'tab-pricing', label: 'Precios & Costos', icon: Calculator }
    ]
  },
  {
    title: 'OPERACIONES',
    items: [
      { id: 'tab-tasks', label: 'Kanban Tareas', icon: CheckSquare },
      { id: 'tab-labels', label: 'Etiquetas', icon: Printer }
    ]
  },
  {
    title: 'SISTEMA',
    items: [
      { id: 'tab-settings', label: 'Configuración', icon: Settings }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, collapsed, onToggleCollapse }) => {
  const { data: settings } = useSettings();
  const logoUrl = settings?.businessInfo?.logoUrl;
  const businessName = settings?.businessInfo?.name || 'Flor y Ser';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-header">
        <div className="brand-logo flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
          ) : (
            <Leaf size={20} />
          )}
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
        {navSections.map((section, idx) => (
          <div key={idx} className="nav-section">
            {!collapsed && <h3 className="nav-section-title">{section.title}</h3>}
            {section.items.map((item) => {
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
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        <button 
          className="btn btn-primary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => onTabChange('tab-sales')}
        >
          <ShoppingCart size={16} />
          {!collapsed && <span>+ Nueva Venta</span>}
        </button>
      </div>
    </aside>
  );
};
