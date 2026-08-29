import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ModuleKey, UserRole } from '../types/auth';
import { getAuditLogs } from '../api/client';
import { 
  Users, UserPlus, Shield, CheckCircle, XCircle, Trash2, Key, Edit, Eye, EyeOff, Copy, Check, RefreshCw, Activity, Image as ImageIcon
} from 'lucide-react';

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
  { key: 'kanban_tasks', label: 'Kanban de Tareas Operativas', group: 'Operaciones' },
  { key: 'settings', label: 'Configuración del Sistema', group: 'Sistema' }
];

export const UserManagement: React.FC = () => {
  const { users, createUser, updateUser, deleteUser, user: currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SELLER');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(['new_sale', 'kanban_orders', 'kanban_tasks', 'customers', 'stock']);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [active, setActive] = useState(true);

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState('');

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', borderRadius: '12px' }}>
        <h2>Acceso Restringido</h2>
        <p>Solo el Administrador del sistema tiene permisos para gestionar usuarios y sus accesos.</p>
      </div>
    );
  }

  const auditLogs = getAuditLogs();

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('vendedor123');
    setRole('SELLER');
    setSelectedModules(['new_sale', 'kanban_orders', 'kanban_tasks', 'customers', 'stock']);
    setAvatarUrl('');
    setActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword(u.password || '123456');
    setRole(u.role);
    setSelectedModules(u.allowedModules || []);
    setAvatarUrl(u.avatarUrl || '');
    setActive(u.active);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

    const userData = {
      name,
      email,
      password,
      role,
      allowedModules: role === 'ADMIN' ? MODULE_LABELS.map(m => m.key) : selectedModules,
      avatarInitials: initials,
      avatarUrl: avatarUrl || undefined,
      active
    };

    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      createUser(userData);
    }

    setShowModal(false);
  };

  const toggleModuleForUser = (user: User, moduleKey: ModuleKey) => {
    if (user.role === 'ADMIN') return;
    const exists = user.allowedModules.includes(moduleKey);
    const updated = exists
      ? user.allowedModules.filter(m => m !== moduleKey)
      : [...user.allowedModules, moduleKey];
    
    updateUser(user.id, { allowedModules: updated });
  };

  const toggleVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = (id: string, pass?: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAuditLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(auditFilter.toLowerCase()) ||
    log.action.toLowerCase().includes(auditFilter.toLowerCase()) ||
    log.module.toLowerCase().includes(auditFilter.toLowerCase()) ||
    log.details.toLowerCase().includes(auditFilter.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0', fontFamily: "'Libre Caslon Text', serif" }}>
            Gestión de Usuarios, Permisos y Auditoría
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Administra credenciales de vendedores, asigna permisos independientes y consulta el historial de actividad
          </p>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={handleOpenCreateModal}
            style={{
              backgroundColor: '#2E5339', color: '#FFFFFF', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <UserPlus size={18} />
            Nuevo Vendedor / Usuario
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'users' ? '#2E5339' : '#F1F5F9', color: activeTab === 'users' ? '#FFFFFF' : '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Users size={16} />
          Usuarios y Permisos ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'audit' ? '#2E5339' : '#F1F5F9', color: activeTab === 'audit' ? '#FFFFFF' : '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Activity size={16} />
          Registro de Auditoría ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {users.map(u => {
            const isPassVisible = visiblePasswords[u.id] || false;
            const defaultPass = u.email.toLowerCase() === 'jmaldonado2378@gmail.com' ? 'admin123' : 'LaJefa3012';
            const userPassword = u.password || defaultPass;
            return (
              <div key={u.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', flexDirection: 'column', opacity: u.active ? 1 : 0.65, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2E5339' }} />
                    ) : (
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: u.role === 'ADMIN' ? '#18261E' : '#D97706', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>{u.avatarInitials}</div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{u.name}</h3>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{u.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => handleOpenEditModal(u)} title="Editar usuario" style={{ border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}><Edit size={15} /></button>
                    {u.id !== currentUser.id && <button onClick={() => deleteUser(u.id)} title="Eliminar usuario" style={{ border: 'none', background: '#FEE2E2', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#DC2626' }}><Trash2 size={15} /></button>}
                  </div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Clave: {isPassVisible ? userPassword : '••••••••'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => toggleVisibility(u.id)} title={isPassVisible ? 'Ocultar clave' : 'Mostrar clave'} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '2px' }}>{isPassVisible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                    <button onClick={() => copyPassword(u.id, userPassword)} title="Copiar clave" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '2px' }}>{copiedId === u.id ? <Check size={15} color="#166534" /> : <Copy size={15} />}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <input type="text" placeholder="Buscar..." value={auditFilter} onChange={e => setAuditFilter(e.target.value)} style={{ width: '100%', marginBottom: '16px', padding: '8px' }} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Usuario</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Acción</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '8px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '8px' }}>{log.userName}</td>
                  <td style={{ padding: '8px' }}>{log.action}</td>
                  <td style={{ padding: '8px' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '20px', width: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>{editingUser ? 'Editar' : 'Crear'} Usuario</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label>Foto de perfil</label>
              <input type="file" accept="image/*" onChange={handleAvatarFileChange} />
              <input type="text" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="text" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}>
                <option value="SELLER">Vendedor</option>
                <option value="ADMIN">Administrador</option>
              </select>
              {role === 'SELLER' && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px' }}>
                  {MODULE_LABELS.map(m => (
                    <label key={m.key} style={{ display: 'block', fontSize: '12px' }}>
                      <input type="checkbox" checked={selectedModules.includes(m.key)} onChange={() => setSelectedModules(prev => prev.includes(m.key) ? prev.filter(i => i !== m.key) : [...prev, m.key])} />
                      {m.label}
                    </label>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
