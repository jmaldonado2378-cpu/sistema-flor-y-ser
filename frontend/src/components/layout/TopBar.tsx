import React, { useState } from 'react';
import { Search, Shield, Bell, HelpCircle, CheckCircle2, AlertTriangle, Info, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRawMaterials, useFinalProducts } from '../../hooks/useInventory';
import { useKanbanBoard } from '../../hooks/useTasks';

interface TopBarProps {
  onOpenUsers?: () => void;
  onTabChange?: (tab: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenUsers, onTabChange }) => {
  const { hasPermission } = useAuth();
  const { data: rawMaterials } = useRawMaterials();
  const { data: finalProducts } = useFinalProducts();
  const { data: boardData } = useKanbanBoard();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Notificaciones dinámicas basadas en datos reales del sistema
  const dynamicNotifications: { id: string; title: string; text: string; type: 'warning' | 'info' | 'success'; tab: string }[] = [];

  // 1. Alertas de stock mínimo
  if (Array.isArray(rawMaterials)) {
    rawMaterials.filter(m => m.currentStock <= m.minStock).slice(0, 2).forEach(m => {
      dynamicNotifications.push({
        id: `raw-${m.id}`,
        title: 'Alerta de Stock Mínimo',
        text: `${m.name} (${m.code}) en ${m.currentStock} ${m.unit}`,
        type: 'warning',
        tab: 'tab-stock'
      });
    });
  }

  if (Array.isArray(finalProducts)) {
    finalProducts.filter(p => p.currentStock <= p.minStock).slice(0, 2).forEach(p => {
      dynamicNotifications.push({
        id: `prod-${p.id}`,
        title: 'Bajo Stock de Producto',
        text: `${p.name} tiene ${p.currentStock} unidades disponibles`,
        type: 'warning',
        tab: 'tab-stock'
      });
    });
  }

  // 2. Alertas de tareas pendientes
  const tasksList: any[] = Array.isArray(boardData) 
    ? boardData 
    : (boardData ? [...(boardData.todo || []), ...(boardData.inProgress || [])] : []);

  if (Array.isArray(tasksList)) {
    tasksList.filter((t: any) => t.status !== 'COMPLETED').slice(0, 2).forEach((t: any) => {
      dynamicNotifications.push({
        id: `task-${t.id || t.title}`,
        title: 'Tarea Kanban Pendiente',
        text: `${t.title} (${t.priority || 'Normal'})`,
        type: 'info',
        tab: 'tab-tasks'
      });
    });
  }

  // Fallback si no hay notificaciones críticas
  if (dynamicNotifications.length === 0) {
    dynamicNotifications.push({
      id: 'system-ok',
      title: 'Sistema Operativo',
      text: 'Todos los niveles de stock y tareas están al día',
      type: 'success',
      tab: 'tab-dashboard'
    });
  }

  const handleNotificationClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    setShowNotifications(false);
  };

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
            {dynamicNotifications.some(n => n.type === 'warning') && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%'
              }} />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '40px',
              right: 0,
              width: '330px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              border: '1px solid #E2E8F0',
              zIndex: 9999,
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Notificaciones ({dynamicNotifications.length})</h4>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dynamicNotifications.map(n => {
                  const bgColor = n.type === 'warning' ? '#FEF3C7' : n.type === 'success' ? '#DCFCE7' : '#E0F2FE';
                  const borderColor = n.type === 'warning' ? '#FCD34D' : n.type === 'success' ? '#86EFAC' : '#BAE6FD';
                  const iconColor = n.type === 'warning' ? '#B45309' : n.type === 'success' ? '#15803D' : '#0284C7';
                  const textColor = n.type === 'warning' ? '#78350F' : n.type === 'success' ? '#14532D' : '#0C4A6E';

                  return (
                    <button 
                      key={n.id} 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNotificationClick(n.tab);
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px', 
                        padding: '10px 12px', 
                        borderRadius: '8px', 
                        backgroundColor: bgColor,
                        border: `1px solid ${borderColor}`,
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {n.type === 'warning' ? <AlertTriangle size={18} color={iconColor} /> : n.type === 'success' ? <CheckCircle2 size={18} color={iconColor} /> : <Info size={18} color={iconColor} />}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: textColor }}>{n.text}</div>
                        </div>
                      </div>
                      <ChevronRight size={16} color={iconColor} />
                    </button>
                  );
                })}
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
      </div>
    </header>
  );
};
