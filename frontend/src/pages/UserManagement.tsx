import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ModuleKey, UserRole } from '../types/auth';
import { Users, UserPlus, Shield, CheckCircle, XCircle, Trash2, Key } from 'lucide-react';

const MODULE_LABELS: { key: ModuleKey; label: string; group: string }[] = [
  { key: 'new_sale', label: 'Nueva Venta / Punto de Venta', group: 'Comercial' },
  { key: 'kanban_orders', label: 'Kanban y Estado de Pedidos', group: 'Comercial' },
  { key: 'customers', label: 'Maestro de Clientes CRM', group: 'Comercial' },
  { key: 'stock', label: 'Stock & Catálogo de Productos', group: 'Inventario' },
  { key: 'article_families', label: 'Familias de Artículos', group: 'Inventario' },
  { key: 'merchandise_receipt', label: 'Recepción de Mercadería', group: 'Inventario' },
  { key: 'fractioning', label: 'Módulo de Fraccionado', group: 'Inventario' },
  { key: 'suppliers', label: 'Proveedores & Cuentas por Pagar', group: 'Comercial' },
  { key: 'checking_accounts', label: 'Cuentas Corrientes Clientes', group: 'Finanzas' },
  { key: 'finance', label: 'Finanzas, Gastos y Margen de Costos', group: 'Finanzas' },
  { key: 'marketing', label: 'WhatsApp Marketing & Campañas', group: 'Marketing' },
  { key: 'settings', label: 'Configuración del Sistema', group: 'Sistema' }
];

export const UserManagement: React.FC = () => {
  const { users, createUser, updateUser, deleteUser, user: currentUser } = useAuth();
  const [showNewModal, setShowNewModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('SELLER');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(['new_sale', 'kanban_orders', 'customers', 'stock']);

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', borderRadius: '12px' }}>
        <h2>Acceso Restringido</h2>
        <p>Solo el Administrador del sistema tiene permisos para gestionar usuarios y sus accesos.</p>
      </div>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

    createUser({
      name,
      email,
      role,
      allowedModules: role === 'ADMIN' ? MODULE_LABELS.map(m => m.key) : selectedModules,
      avatarInitials: initials,
      active: true
    });

    setName('');
    setEmail('');
    setRole('SELLER');
    setShowNewModal(false);
  };

  const toggleModuleForUser = (user: User, moduleKey: ModuleKey) => {
    if (user.role === 'ADMIN') return; // Admin siempre tiene acceso total
    const exists = user.allowedModules.includes(moduleKey);
    const updated = exists
      ? user.allowedModules.filter(m => m !== moduleKey)
      : [...user.allowedModules, moduleKey];
    
    updateUser(user.id, { allowedModules: updated });
  };

  return (
    <div style={{ padding: '24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0', fontFamily: "'Libre Caslon Text', serif" }}>
            Gestión de Usuarios y Permisos de Acceso
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Configura qué vendedores tienen acceso a cada sección del sistema Flor y Ser
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          style={{
            backgroundColor: '#2E5339',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UserPlus size={18} />
          Nuevo Vendedor / Usuario
        </button>
      </div>

      {/* Lista de Usuarios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {users.map(u => (
          <div
            key={u.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {/* Info de Perfil */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: u.role === 'ADMIN' ? '#18261E' : '#D97706',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '16px'
                  }}>
                    {u.avatarInitials}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>{u.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{u.email}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: u.role === 'ADMIN' ? '#DCFCE7' : '#FEF3C7',
                    color: u.role === 'ADMIN' ? '#166534' : '#92400E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Shield size={12} />
                    {u.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </span>

                  {u.id !== currentUser.id && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      title="Eliminar Usuario"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Matriz de Permisos */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                  Permisos de Módulos
                </h4>

                {u.role === 'ADMIN' ? (
                  <p style={{ fontSize: '13px', color: '#166534', backgroundColor: '#F0FDF4', padding: '10px 14px', borderRadius: '8px', margin: 0 }}>
                    ✨ El Administrador tiene acceso irrestricto a todos los módulos y ajustes del sistema.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {MODULE_LABELS.map(mod => {
                      const isAllowed = u.allowedModules.includes(mod.key);
                      return (
                        <button
                          key={mod.key}
                          onClick={() => toggleModuleForUser(u, mod.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${isAllowed ? '#BBF7D0' : '#E2E8F0'}`,
                            backgroundColor: isAllowed ? '#F0FDF4' : '#F8FAFC',
                            color: isAllowed ? '#166534' : '#64748B',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          {isAllowed ? <CheckCircle size={14} color="#16A34A" /> : <XCircle size={14} color="#94A3B8" />}
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {mod.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Usuario */}
      {showNewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 16px 0', fontFamily: "'Libre Caslon Text', serif" }}>
              Crear Nuevo Vendedor / Usuario
            </h2>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Nombre Completo</label>
                <input
                  type="text"
                  placeholder="ej: Sofía Martínez"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="sofia@floryser.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Rol en el Sistema</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                >
                  <option value="SELLER">Vendedor (Acceso limitado por permisos)</option>
                  <option value="ADMIN">Administrador (Acceso Total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2E5339', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
