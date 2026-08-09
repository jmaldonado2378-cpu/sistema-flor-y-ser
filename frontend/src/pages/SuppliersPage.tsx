import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import { useSuppliers, useCreateSupplier } from '../hooks/useSuppliers';
import { Modal } from '../components/ui/Modal';

const supplierSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  contactName: z.string(),
  email: z.string().email('Email inválido'),
  phone: z.string(),
  taxId: z.string(),
});

export const SuppliersPage: React.FC<{ onTabChange?: (tab: string) => void }> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: suppliers, isLoading, isError } = useSuppliers();
  const createSupplier = useCreateSupplier();

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

  const onSubmit = (data: any) => {
    createSupplier.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Proveedores</h1>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Listado de Proveedores</h2>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
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
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>CUIT/RUT</th>
              </tr>
            </thead>
            <tbody>
              {suppliers?.map((supplier: any) => (
                <tr key={supplier.id}>
                  <td className="font-medium">{supplier.name || supplier.businessName}</td>
                  <td>{supplier.contactName}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.taxId}</td>
                </tr>
              ))}
              {(!suppliers || suppliers.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-text-muted">
                    No hay proveedores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Proveedor">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">Nombre</label>
            <input {...register('name')} />
            {formState.errors.name && (
              <span className="field-error text-terracotta text-sm">
                {formState.errors.name.message?.toString()}
              </span>
            )}
          </div>
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">Contacto</label>
            <input {...register('contactName')} />
          </div>
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">Email</label>
            <input type="email" {...register('email')} />
          </div>
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">Teléfono</label>
            <input {...register('phone')} />
          </div>
          <div className="form-field flex flex-col gap-2">
            <label className="font-medium">CUIT/RUT</label>
            <input {...register('taxId')} />
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
