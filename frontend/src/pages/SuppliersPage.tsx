import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useToggleSupplierStatus } from '../hooks/useSuppliers';
import { Modal } from '../components/ui/Modal';

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  contactName: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  taxId: z.string().optional().or(z.literal('')),
});

export const SuppliersPage: React.FC<{ onTabChange?: (tab: string) => void }> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const { data: suppliers, isLoading, isError } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const toggleSupplierStatus = useToggleSupplierStatus();

  const suppliersList = Array.isArray(suppliers) ? suppliers : [];

  const filteredSuppliers = suppliersList.filter((s: any) => {
    if (!s) return false;
    const isAct = s.isActive !== false;
    if (statusFilter === 'ACTIVE' && !isAct) return false;
    if (statusFilter === 'SUSPENDED' && isAct) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ((s.name || s.businessName || '') + '').toLowerCase().includes(q);
      const matchContact = ((s.contactName || s.contactPerson || '') + '').toLowerCase().includes(q);
      const matchTaxId = ((s.taxId || '') + '').toLowerCase().includes(q);
      const matchEmail = ((s.email || '') + '').toLowerCase().includes(q);
      if (!matchName && !matchContact && !matchTaxId && !matchEmail) return false;
    }
    return true;
  });

  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      taxId: '',
    },
  });

  const handleOpenNew = () => {
    setEditingSupplier(null);
    reset({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      taxId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    reset({
      name: supplier.name || supplier.businessName || '',
      contactName: supplier.contactName || supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      taxId: supplier.taxId || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (supplier: any) => {
    const isAct = supplier.isActive !== false;
    const displayName = supplier.name || supplier.businessName || 'este proveedor';
    const actionText = isAct ? 'suspender / pausar' : 'reactivar';
    if (!window.confirm(`¿Desea ${actionText} al proveedor "${displayName}"?`)) return;
    try {
      await toggleSupplierStatus.mutateAsync({ id: supplier.id, isActive: !isAct });
    } catch (err: any) {
      alert(err.message || 'Error al cambiar el estado del proveedor.');
    }
  };

  const handleDeleteSupplier = async (supplier: any) => {
    const displayName = supplier.name || supplier.businessName || 'este proveedor';
    if (!window.confirm(`¿Está seguro de eliminar definitivamente al proveedor "${displayName}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      const res = await deleteSupplier.mutateAsync(supplier.id);
      if (res && (res.status === 'ERROR' || res.success === false)) {
        alert(res.message || res.error || 'No se pudo eliminar el proveedor.');
      }
    } catch (err: any) {
      alert(err.message || 'No se puede eliminar porque tiene comprobantes contables asociados. Utilice el botón Suspender (⏸️).');
    }
  };

  const onSubmit = (data: any) => {
    if (editingSupplier) {
      updateSupplier.mutate(
        { id: editingSupplier.id, data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingSupplier(null);
            reset();
          },
        }
      );
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Proveedores</h1>
          <p className="text-sm text-text-muted mt-1">Gestión de proveedores de materias primas, empaques y productos de reventa</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Listado de Proveedores</h2>
          <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenNew}>
            <Plus size={16} />
            Nuevo Proveedor
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="no-print bg-bg-linen p-3 rounded mb-4 border flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div style={{ minWidth: '240px' }} className="flex-1">
              <label className="text-xs text-text-muted mb-1 block">Buscar Proveedor</label>
              <input
                type="text"
                placeholder="Buscar por razón social, contacto, email o CUIT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <label className="text-xs text-text-muted mb-1 block">Estado del Proveedor</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-sm font-medium"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">✅ Solo Activos</option>
                <option value="SUSPENDED">⏸️ Solo Suspendidos</option>
              </select>
            </div>
          </div>

          {(searchQuery || statusFilter !== 'ALL') && (
            <div className="flex items-end pt-4">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="no-print flex justify-between items-center text-xs text-text-muted mb-3 px-1">
          <div>
            Mostrando <strong className="text-text-dark">{filteredSuppliers.length}</strong> de {suppliersList.length} proveedores
          </div>
          <div>
            Suspendidos: <strong className="text-amber-600">{suppliersList.filter((s: any) => s?.isActive === false).length}</strong>
          </div>
        </div>

        {isLoading && <div className="py-8 text-center text-text-muted">Cargando...</div>}
        {isError && <div className="py-8 text-center text-terracotta">Error al cargar proveedores</div>}
        {!isLoading && !isError && (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Nombre / Razón Social</th>
                <th>Contacto</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>CUIT/RUT</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier: any) => {
                const isAct = supplier.isActive !== false;
                return (
                  <tr key={supplier.id} className={!isAct ? 'opacity-60 bg-amber-50/20' : ''}>
                    <td className="font-medium">{supplier.name || supplier.businessName}</td>
                    <td>{supplier.contactName || supplier.contactPerson || '-'}</td>
                    <td>{supplier.email || '-'}</td>
                    <td>{supplier.phone || '-'}</td>
                    <td>{supplier.taxId || '-'}</td>
                    <td>
                      {isAct ? (
                        <span className="badge green text-[10px]">Activo</span>
                      ) : (
                        <span className="badge amber text-[10px]">Suspendido</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(supplier)}
                          title="Editar proveedor"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            padding: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Pencil size={15} style={{ color: '#2563EB', strokeWidth: 2.2 }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(supplier)}
                          title={isAct ? 'Suspender / Pausar proveedor' : 'Reactivar proveedor'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            backgroundColor: isAct ? '#FFFFFF' : '#FEF3C7',
                            cursor: 'pointer',
                            padding: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          {isAct ? (
                            <PauseCircle size={15} style={{ color: '#D97706', strokeWidth: 2.2 }} />
                          ) : (
                            <PlayCircle size={15} style={{ color: '#10B981', strokeWidth: 2.2 }} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(supplier)}
                          title="Eliminar proveedor definitivamente"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            padding: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Trash2 size={15} style={{ color: '#DC2626', strokeWidth: 2.2 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-text-muted">
                    No se encontraron proveedores para los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">Nombre / Razón Social *</label>
            <input {...register('name')} placeholder="Ej: Granos del Sur S.A." />
            {formState.errors.name && (
              <span className="field-error text-terracotta text-sm">
                {formState.errors.name.message?.toString()}
              </span>
            )}
          </div>
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">Contacto de Referencia</label>
            <input {...register('contactName')} placeholder="Ej: Roberto Gómez" />
          </div>
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">Email</label>
            <input type="email" {...register('email')} placeholder="ejemplo@proveedor.com" />
            {formState.errors.email && (
              <span className="field-error text-terracotta text-sm">
                {formState.errors.email.message?.toString()}
              </span>
            )}
          </div>
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">Teléfono / WhatsApp</label>
            <input {...register('phone')} placeholder="+54 9 11 3322-1100" />
          </div>
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">CUIT / RUT</label>
            <input {...register('taxId')} placeholder="30-71234567-8" />
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={createSupplier.isPending || updateSupplier.isPending}>
              {createSupplier.isPending || updateSupplier.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
