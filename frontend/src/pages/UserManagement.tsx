import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ModuleKey, UserRole } from '../types/auth';
import { getAuditLogs, syncAndFetchAuditLogs, AuditLog } from '../api/client';
import {
  Users, UserPlus, Shield, CheckCircle, XCircle, Trash2, Key, Edit,
  Eye, EyeOff, Copy, Check, RefreshCw, Activity, Clock, Lock, Sparkles, Search, Filter
} from 'lucide-react';

const MODULE_LABELS: { key: ModuleKey; label: string; group: string; shortLabel: string }[] = [
  { key: 'dashboard', label: 'Dashboard Principal & Indicadores', shortLabel: 'Dashboard', group: 'Principal' },
  { key: 'customers', label: 'Maestro de Clientes CRM', shortLabel: 'CRM Clientes', group: 'Comercial' },
  { key: 'new_sale', label: 'Nueva Venta / Punto de Venta', shortLabel: 'Nueva Venta', group: 'Comercial' },
  { key: 'kanban_orders', label: 'Kanban y Estado de Pedidos', shortLabel: 'Kanban Pedidos', group: 'Comercial' },
  { key: 'suppliers', label: 'Proveedores & Cuentas por Pagar', shortLabel: 'Proveedores', group: 'Comercial' },
  { key: 'stock', label: 'Stock, Productos & Etiquetas', shortLabel: 'Stock & Productos', group: 'Inventario' },
  { key: 'article_families', label: 'Familias y Subfamilias de Artículos', shortLabel: 'Familias', group: 'Inventario' },
  { key: 'merchandise_receipt', label: 'Recepción de Mercadería (Compras)', shortLabel: 'Compras / Recepción', group: 'Inventario' },
  { key: 'fractioning', label: 'Módulo de Fraccionado y Lotes', shortLabel: 'Fraccionado', group: 'Inventario' },
  { key: 'checking_accounts', label: 'Cuentas Corrientes de Clientes', shortLabel: 'Cta Cte Clientes', group: 'Finanzas' },
  { key: 'finance', label: 'Gastos, Precios & Costos y Comisiones', shortLabel: 'Finanzas & Precios', group: 'Finanzas' },
  { key: 'kanban_tasks', label: 'Kanban de Tareas Operativas', shortLabel: 'Kanban Tareas', group: 'Operaciones' },
  { key: 'marketing', label: 'WhatsApp Marketing & Campañas', shortLabel: 'Marketing', group: 'Marketing' },
  { key: 'users', label: 'Usuarios, Permisos y Auditoría', shortLabel: 'Usuarios', group: 'Sistema' },
  { key: 'settings', label: 'Configuración del Sistema', shortLabel: 'Configuración', group: 'Sistema' }
];

const PROTECTED_EMAILS = new Set([
  'jmaldonado2378@gmail.com',
  'memimaldonado05@gmail.com'
]);

const PRESET_SALES: ModuleKey[] = ['dashboard', 'customers', 'new_sale', 'kanban_orders', 'stock', 'checking_accounts'];
const PRESET_OPERATIONS: ModuleKey[] = ['stock', 'article_families', 'merchandise_receipt', 'fractioning', 'kanban_tasks', 'kanban_orders'];

export const UserManagement: React.FC = () => {
  const { users, createUser, updateUser, deleteUser, syncPendingUsers, fetchUsers, user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModalPass, setShowModalPass] = useState(false);
  const [role, setRole] = useState<UserRole>('SELLER');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(PRESET_SALES);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [active, setActive] = useState(true);

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const [auditFilter, setAuditFilter] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sincronizar usuarios y auditoría centralizada al abrir la pantalla
  useEffect(() => {
    fetchUsers();
    syncAndFetchAuditLogs().then(logs => {
      if (Array.isArray(logs)) setAuditLogs(logs);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      syncAndFetchAuditLogs().then(logs => {
        if (Array.isArray(logs)) setAuditLogs(logs);
      });
    }
  }, [activeTab]);

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', borderRadius: '12px' }}>
        <h2>Acceso Restringido</h2>
        <p>Solo los Administradores del sistema tienen permisos para gestionar usuarios, credenciales y auditoría.</p>
      </div>
    );
  }

  const isUserProtected = (u: User) => {
    return Boolean(u.isProtected || PROTECTED_EMAILS.has(u.email.toLowerCase()));
  };

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
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowModalPass(true);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowModalPass(true);
    setRole('SELLER');
    setSelectedModules(PRESET_SALES);
    setAvatarUrl('');
    setActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    // Conservar exactamente su clave real o dejar vacío para no sobrescribir nunca con '123456'
    setPassword(u.password || '');
    setShowModalPass(false);
    setRole(isUserProtected(u) ? 'ADMIN' : u.role);
    setSelectedModules(u.role === 'ADMIN' ? MODULE_LABELS.map(m => m.key) : (u.allowedModules || []));
    setAvatarUrl(u.avatarUrl || '');
    setActive(isUserProtected(u) ? true : u.active);
    setShowModal(true);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncPendingUsers();
      const cloudLogs = await syncAndFetchAuditLogs();
      setAuditLogs(cloudLogs);
      if (res.synced > 0) {
        alert(`🎉 ¡Sincronización Exitosa!\n\nSe actualizaron ${res.synced} perfiles/claves y se unificó el Registro de Auditoría (${cloudLogs.length} eventos) en la base de datos MySQL.`);
      } else {
        alert(`✅ Todos los usuarios, contraseñas y registros de auditoría (${cloudLogs.length} eventos) están 100% sincronizados en MySQL.`);
      }
    } catch (e: any) {
      alert(`Error al sincronizar: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (isUserProtected(u) || u.role === 'ADMIN') {
      alert('Las cuentas de Administrador están protegidas y no pueden ser eliminadas.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${u.name}" (${u.email})?\n\nTip: Si solo deseas suspender temporalmente su acceso sin borrarlo, puedes usar el botón "Pausar" en su tarjeta.`)) {
      return;
    }
    const res = await deleteUser(u.id);
    if (!res.success) {
      alert(`Error al eliminar usuario: ${res.error}`);
    } else {
      const cloudLogs = await syncAndFetchAuditLogs();
      setAuditLogs(cloudLogs);
    }
  };

  const handleToggleActiveStatus = async (u: User) => {
    if (isUserProtected(u)) return;
    const nextActive = !u.active;
    const res = await updateUser(u.id, { active: nextActive });
    if (!res.success) {
      alert(`No se pudo cambiar el estado: ${res.error}`);
    } else {
      const cloudLogs = await syncAndFetchAuditLogs();
      setAuditLogs(cloudLogs);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!editingUser && !password.trim()) {
      alert('Por favor ingresa una contraseña para el nuevo usuario.');
      return;
    }

    const initials = name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';
    const isProt = editingUser ? isUserProtected(editingUser) : PROTECTED_EMAILS.has(email.trim().toLowerCase());
    const finalRole: UserRole = isProt ? 'ADMIN' : role;
    const finalActive = isProt ? true : active;

    const userData: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: finalRole,
      allowedModules: finalRole === 'ADMIN' ? MODULE_LABELS.map(m => m.key) : selectedModules,
      avatarInitials: initials,
      avatarUrl: avatarUrl || undefined,
      active: finalActive
    };

    if (password.trim()) {
      userData.password = password.trim();
    }

    setSaving(true);
    try {
      if (editingUser) {
        const res = await updateUser(editingUser.id, userData);
        if (res.success) {
          const cloudLogs = await syncAndFetchAuditLogs();
          setAuditLogs(cloudLogs);
          setShowModal(false);
        } else {
          alert(`❌ Error al actualizar usuario: ${res.error}`);
        }
      } else {
        const res = await createUser({
          ...userData,
          password: password.trim()
        });
        if (res.success) {
          const cloudLogs = await syncAndFetchAuditLogs();
          setAuditLogs(cloudLogs);
          setShowModal(false);
        } else {
          alert(`❌ No se pudo guardar el usuario en la base de datos:\n\n${res.error}`);
        }
      }
    } finally {
      setSaving(false);
    }
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

  const formatDateShort = (iso?: string | null) => {
    if (!iso) return 'Sin registro reciente';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return 'Sin registro reciente';
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Sin registro reciente';
    }
  };

  const uniqueAuditUsers = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.userName) set.add(l.userName);
    });
    return Array.from(set);
  }, [auditLogs]);

  const uniqueAuditModules = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set);
  }, [auditLogs]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = auditFilter.toLowerCase();
      const matchesText =
        !q ||
        (log.userName || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.module || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q);
      const matchesUser = !auditUserFilter || log.userName === auditUserFilter;
      const matchesMod = !auditModuleFilter || log.module === auditModuleFilter;
      return matchesText && matchesUser && matchesMod;
    });
  }, [auditLogs, auditFilter, auditUserFilter, auditModuleFilter]);

  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof MODULE_LABELS> = {};
    MODULE_LABELS.forEach(m => {
      if (!groups[m.group]) groups[m.group] = [];
      groups[m.group].push(m);
    });
    return groups;
  }, []);

  const adminsCount = users.filter(u => u.role === 'ADMIN').length;
  const sellersCount = users.filter(u => u.role === 'SELLER').length;
  const activeCount = users.filter(u => u.active).length;

  return (
    <div style={{ padding: '24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0', fontFamily: "'Libre Caslon Text', serif" }}>
            Gestión de Usuarios, Permisos y Auditoría
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Credenciales sincronizadas en MySQL, jerarquía protegida de Administradores y registro de actividad unificado en tiempo real
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sincronizar usuarios, contraseñas y registro de auditoría con MySQL"
            style={{
              backgroundColor: '#F8FAFC',
              color: '#2E5339',
              border: '1px solid #CBD5E1',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: syncing ? 0.7 : 1
            }}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando MySQL...' : 'Sincronizar con MySQL'}
          </button>
          <button
            onClick={handleOpenCreateModal}
            style={{
              backgroundColor: '#2E5339',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(46,83,57,0.2)'
            }}
          >
            <UserPlus size={17} />
            Nuevo Vendedor / Usuario
          </button>
        </div>
      </div>

      {/* KPIs Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Equipo Total</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{users.length} usuarios ({activeCount} activos)</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Administradores</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{adminsCount} protegidos</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Vendedores / Operadores</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{sellersCount} asignados</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F5F3FF', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Auditoría en Nube</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{auditLogs.length} eventos MySQL</div>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'users' ? '#2E5339' : '#F1F5F9',
            color: activeTab === 'users' ? '#FFFFFF' : '#475569',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} />
          Usuarios y Permisos ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'audit' ? '#2E5339' : '#F1F5F9',
            color: activeTab === 'audit' ? '#FFFFFF' : '#475569',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Activity size={16} />
          Registro de Auditoría Centralizado ({auditLogs.length})
        </button>
      </div>

      {/* PESTAÑA 1: TARJETAS DE USUARIOS */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
          {users.map(u => {
            const isPassVisible = visiblePasswords[u.id] || false;
            const isProtected = isUserProtected(u);
            const isAdmin = u.role === 'ADMIN';
            const syncedPass = u.password || '';
            const enabledModulesCount = isAdmin ? MODULE_LABELS.length : (u.allowedModules?.length || 0);

            return (
              <div
                key={u.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  border: isAdmin ? '1.5px solid #CBD5E1' : '1px solid #E2E8F0',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  opacity: u.active ? 1 : 0.68,
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                  position: 'relative'
                }}
              >
                {/* Cabecera de Tarjeta */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isAdmin ? '2px solid #18261E' : '2px solid #D97706',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          backgroundColor: isAdmin ? '#18261E' : '#D97706',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '15px',
                          flexShrink: 0
                        }}
                      >
                        {u.avatarInitials}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#0F172A' }}>
                          {u.name.replace(/\s*\(Administrador\)\s*/i, '')}
                        </h3>
                      </div>
                      <p style={{ margin: '2px 0 6px 0', fontSize: '12.5px', color: '#64748B', wordBreak: 'break-all' }}>
                        {u.email}
                      </p>
                      {/* Insignias de Rol y Estado */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {isProtected ? (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FDE68A',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            👑 Admin Principal
                          </span>
                        ) : isAdmin ? (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#E0E7FF',
                            color: '#1E40AF'
                          }}>
                            🛡️ Administrador
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #E2E8F0'
                          }}>
                            👩‍💼 Vendedor / Operador
                          </span>
                        )}

                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: u.active ? '#DCFCE7' : '#FEE2E2',
                          color: u.active ? '#166534' : '#991B1B'
                        }}>
                          {u.active ? '● Activo' : '○ Pausado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      title="Editar datos, clave y permisos"
                      style={{
                        border: '1px solid #CBD5E1',
                        background: '#F8FAFC',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#1E293B',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit size={14} /> Editar
                    </button>
                    {!isProtected && !isAdmin && u.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="Eliminar usuario"
                        style={{
                          border: '1px solid #FECACA',
                          background: '#FEF2F2',
                          padding: '6px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#DC2626',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Caja de Contraseña Sincronizada en MySQL */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <Key size={14} style={{ color: '#64748B', flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', wordBreak: 'break-all' }}>
                      Clave:{' '}
                      {syncedPass ? (
                        <strong style={{ color: '#0F172A', fontFamily: isPassVisible ? 'monospace' : 'inherit', fontSize: isPassVisible ? '13px' : '12.5px' }}>
                          {isPassVisible ? syncedPass : '••••••••'}
                        </strong>
                      ) : (
                        <span style={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 500 }}>
                          (Definir en Editar)
                        </span>
                      )}
                    </span>
                  </div>
                  {syncedPass && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => toggleVisibility(u.id)}
                        title={isPassVisible ? 'Ocultar clave' : 'Mostrar clave'}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#475569', padding: '3px', display: 'flex' }}
                      >
                        {isPassVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => copyPassword(u.id, syncedPass)}
                        title="Copiar clave al portapapeles"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#475569', padding: '3px', display: 'flex' }}
                      >
                        {copiedId === u.id ? <Check size={15} color="#166534" /> : <Copy size={15} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Resumen de Permisos y Última Conexión */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                    <span style={{ fontWeight: 700, color: '#475569' }}>
                      Accesos habilitados ({enabledModulesCount}/{MODULE_LABELS.length})
                    </span>
                    {!isProtected && (
                      <button
                        type="button"
                        onClick={() => handleToggleActiveStatus(u)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: u.active ? '#B45309' : '#166534',
                          padding: 0
                        }}
                      >
                        {u.active ? '⏸️ Pausar acceso' : '▶️ Reactivar acceso'}
                      </button>
                    )}
                  </div>

                  {isAdmin ? (
                    <div style={{ fontSize: '11.5px', color: '#166534', background: '#F0FDF4', padding: '6px 10px', borderRadius: '8px', fontWeight: 600 }}>
                      ✅ Acceso Total de Administración a todos los módulos del sistema
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {MODULE_LABELS.filter(m => u.allowedModules?.includes(m.key)).map(m => (
                        <span
                          key={m.key}
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            fontWeight: 600
                          }}
                        >
                          {m.shortLabel}
                        </span>
                      ))}
                      {(!u.allowedModules || u.allowedModules.length === 0) && (
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Sin módulos asignados</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Últ. ingreso: {formatDateShort(u.lastLoginAt)}
                    </span>
                    {isProtected && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#64748B', fontWeight: 600 }}>
                        <Lock size={11} /> Cuenta Protegida
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PESTAÑA 2: REGISTRO DE AUDITORÍA CENTRALIZADO EN MYSQL */}
      {activeTab === 'audit' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Buscar por acción, detalle, cliente o usuario..."
                value={auditFilter}
                onChange={e => setAuditFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px'
                }}
              />
            </div>

            <select
              value={auditUserFilter}
              onChange={e => setAuditUserFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', minWidth: '180px' }}
            >
              <option value="">👤 Todos los Usuarios</option>
              {uniqueAuditUsers.map(uName => (
                <option key={uName} value={uName}>{uName}</option>
              ))}
            </select>

            <select
              value={auditModuleFilter}
              onChange={e => setAuditModuleFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', minWidth: '170px' }}
            >
              <option value="">📂 Todos los Módulos</option>
              {uniqueAuditModules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={async () => {
                setSyncing(true);
                const logs = await syncAndFetchAuditLogs();
                setAuditLogs(logs);
                setSyncing(false);
              }}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC', color: '#475569' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', width: '18%' }}>Fecha y Hora</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', width: '20%' }}>Usuario</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', width: '16%' }}>Módulo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', width: '16%' }}>Acción</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', width: '30%' }}>Detalle Registrado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.map(log => {
                  const isLogin = log.action.includes('SESION');
                  const isSale = log.action.includes('VENTA');
                  const isUserMod = log.action.includes('USUARIO') || log.action.includes('PERMISOS');
                  const badgeBg = isSale ? '#DCFCE7' : isUserMod ? '#FEF3C7' : isLogin ? '#EFF6FF' : '#F1F5F9';
                  const badgeColor = isSale ? '#166534' : isUserMod ? '#92400E' : isLogin ? '#1E40AF' : '#334155';

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatDateShort(log.timestamp)}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>
                        {log.userName}
                        {log.userEmail && (
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>{log.userEmail}</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{log.module}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: badgeBg,
                          color: badgeColor
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{log.details}</td>
                    </tr>
                  );
                })}
                {filteredAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                      No se encontraron eventos de auditoría con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PROFESIONAL DE ALTA / EDICIÓN DE USUARIO Y PERMISOS */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px 28px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {editingUser ? `✏️ Configurar Usuario: ${editingUser.name}` : '➕ Nuevo Vendedor / Usuario'}
                </h2>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
                  Los cambios se guardan en MySQL y se sincronizan en todos los dispositivos al instante
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SECCIÓN 1: DATOS PERSONALES Y AVATAR */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ flexShrink: 0 }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2E5339' }} />
                  ) : (
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: role === 'ADMIN' ? '#18261E' : '#D97706',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '18px'
                    }}>
                      {name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Foto de Perfil (Opcional)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ fontSize: '12px' }} />
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        style={{ fontSize: '11px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: NOMBRE, EMAIL Y CONTRASEÑA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Rocío Azul Quevedo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Correo Electrónico (Login) *
                  </label>
                  <input
                    type="email"
                    placeholder="usuario@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={editingUser ? isUserProtected(editingUser) : false}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    🔑 Contraseña de Acceso {editingUser ? '(Modifícala solo si deseas cambiarla)' : '*'}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2E5339',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={13} /> Generar clave aleatoria
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type={showModalPass ? 'text' : 'password'}
                    placeholder={editingUser ? 'Dejar sin cambios para mantener la clave actual' : 'Escribe la clave del usuario...'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required={!editingUser}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPass(!showModalPass)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {showModalPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    {showModalPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {/* SECCIÓN 3: ROL Y ESTADO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Rol en el Sistema
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    disabled={editingUser ? isUserProtected(editingUser) : false}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 600 }}
                  >
                    <option value="SELLER">👩‍💼 Vendedor / Operador (Permisos a medida)</option>
                    <option value="ADMIN">🛡️ Administrador (Acceso Total)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Estado de la Cuenta
                  </label>
                  <select
                    value={active ? 'ACTIVE' : 'PAUSED'}
                    onChange={e => setActive(e.target.value === 'ACTIVE')}
                    disabled={editingUser ? isUserProtected(editingUser) : false}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: 600 }}
                  >
                    <option value="ACTIVE">🟢 Activo (Puede iniciar sesión)</option>
                    <option value="PAUSED">🔴 Pausado / Suspendido</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN 4: MATRIZ DE PERMISOS */}
              {role === 'SELLER' ? (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>
                      Módulos Habilitados ({selectedModules.length}/{MODULE_LABELS.length})
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedModules(PRESET_SALES)}
                        style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ⚡ Perfil Ventas
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedModules(PRESET_OPERATIONS)}
                        style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}
                      >
                        📦 Perfil Stock/Armado
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedModules(MODULE_LABELS.map(m => m.key))}
                        style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ✅ Todos
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                    {Object.entries(groupedModules).map(([groupName, mods]) => (
                      <div key={groupName}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                          {groupName}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {mods.map(m => {
                            const checked = selectedModules.includes(m.key);
                            return (
                              <label
                                key={m.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '7px',
                                  fontSize: '12px',
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  border: checked ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                                  backgroundColor: checked ? '#F0FDF4' : '#FFFFFF',
                                  cursor: 'pointer',
                                  fontWeight: checked ? 600 : 500,
                                  color: '#1E293B'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setSelectedModules(prev =>
                                      prev.includes(m.key) ? prev.filter(i => i !== m.key) : [...prev, m.key]
                                    )
                                  }
                                />
                                <span>{m.shortLabel}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', fontSize: '12.5px', color: '#166534', fontWeight: 600 }}>
                  👑 Las cuentas con rol <strong>Administrador</strong> tienen acceso completo a los 15 módulos del sistema.
                </div>
              )}

              {/* BOTONES DE GUARDADO */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2E5339',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Guardando en MySQL...' : '💾 Guardar y Sincronizar en MySQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
