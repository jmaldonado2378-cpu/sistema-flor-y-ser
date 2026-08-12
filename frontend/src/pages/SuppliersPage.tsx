import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers';
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
  const { data: suppliers, isLoading, isError } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

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
        <h1 className="text-2xl font-bold text-text-dark">Proveedores</h1>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Listado de Proveedores</h2>
          <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenNew}>
            <Plus size={16} />
            Nuevo Proveedor
          </button>
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
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suppliers?.map((supplier: any) => (
                <tr key={supplier.id}>
                  <td className="font-medium">{supplier.name || supplier.businessName}</td>
                  <td>{supplier.contactName || supplier.contactPerson || '-'}</td>
                  <td>{supplier.email || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td>{supplier.taxId || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
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
                  </td>
                </tr>
              ))}
              {(!suppliers || suppliers.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-text-muted">
                    No hay proveedores registrados
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
