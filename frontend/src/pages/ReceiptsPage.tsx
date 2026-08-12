import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Eye, FileText, Calendar, Building, PackageCheck } from 'lucide-react';
import { useMerchandiseReceipts, useCreateMerchandiseReceipt } from '../hooks/useReceipts';
import { useSuppliers } from '../hooks/useSuppliers';
import { useRawMaterials } from '../hooks/useInventory';
import { Modal } from '../components/ui/Modal';
import { MerchandiseReceipt } from '../api/receipts';

const receiptItemSchema = z.object({
  productId: z.string().optional(),
  itemName: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(0.01, 'Debe ser > 0'),
  unitOfMeasure: z.string().optional(),
  unitCost: z.number().min(0, 'Debe ser >= 0'),
});

const receiptSchema = z.object({
  receiptNumber: z.string().optional(),
  supplierId: z.string().min(1, 'Seleccione un proveedor'),
  receiptType: z.string().optional(),
  receptionDate: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, 'Debe agregar al menos un ítem'),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

export const ReceiptsPage: React.FC<{ onTabChange?: (tab: string) => void }> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<MerchandiseReceipt | null>(null);
  
  const { data: receipts, isLoading, isError, refetch } = useMerchandiseReceipts();
  const { data: suppliers } = useSuppliers();
  const { data: rawMaterials } = useRawMaterials();
  const createReceipt = useCreateMerchandiseReceipt();

  const { register, control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptNumber: '',
      supplierId: '',
      receiptType: 'FACTURA',
      receptionDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ productId: '', itemName: '', quantity: 1, unitOfMeasure: 'KG', unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items') || [];
  const calculatedTotal = watchItems.reduce(
    (sum, item) => sum + ((item?.quantity || 0) * (item?.unitCost || 0)), 
    0
  );

  const formatCurrency = (val?: number) => {
    return (val || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  const handleOpenModal = () => {
    reset({
      receiptNumber: `FC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100000 + Math.random() * 900000)}`,
      supplierId: suppliers && suppliers.length > 0 ? suppliers[0].id : '',
      receiptType: 'FACTURA',
      receptionDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ productId: '', itemName: '', quantity: 10, unitOfMeasure: 'KG', unitCost: 0 }],
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: ReceiptFormValues) => {
    const payload = {
      ...data,
      totalAmount: calculatedTotal,
      totalCost: calculatedTotal,
    };

    createReceipt.mutate(payload, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const supplierList = Array.isArray(suppliers) ? suppliers : [];

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Recepción de Mercadería & Insumos</h1>
          <p className="text-sm text-text-muted mt-1">Ingreso de comprobantes de compras, actualización automática de stock y costos</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenModal}>
          <Plus size={16} />
          Nueva Recepción
        </button>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Historial de Recepciones y Comprobantes</h2>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-text-muted">Cargando recepciones de mercadería...</div>
        ) : isError ? (
          <div className="py-8 text-center text-terracotta">
            Error al consultar recepciones.{' '}
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>N° Comprobante</th>
                  <th>Proveedor</th>
                  <th>Fecha Ingreso</th>
                  <th>Tipo</th>
                  <th>Ítems Ingresados</th>
                  <th className="text-right">Monto Total</th>
                  <th>Estado Pago</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(receipts) && receipts.map((receipt: MerchandiseReceipt) => {
                  const dateStr = receipt.receptionDate || receipt.receiptDate || receipt.issueDate || receipt.createdAt;
                  const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString('es-AR') : '-';
                  const total = receipt.totalAmount || receipt.totalCost || 0;
                  const supplierName = receipt.supplierName || supplierList.find(s => s.id === receipt.supplierId)?.name || 'Proveedor Registrado';

                  return (
                    <tr key={receipt.id}>
                      <td className="font-semibold text-primary-sage">{receipt.receiptNumber || `REC-${receipt.id.slice(0, 6)}`}</td>
                      <td className="font-medium">{supplierName}</td>
                      <td>{dateFormatted}</td>
                      <td><span className="badge gray">{receipt.receiptType || 'FACTURA'}</span></td>
                      <td>{receipt.items?.length || 0} ítems</td>
                      <td className="text-right font-semibold">{formatCurrency(total)}</td>
                      <td>
                        <span className={`badge ${receipt.paymentStatus === 'PAID' ? 'green' : 'gray'}`}>
                          {receipt.paymentStatus === 'PAID' ? 'ABONADO' : 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button 
                          type="button"
                          onClick={() => setViewingReceipt(receipt)}
                          title="Ver Detalle de Recepción"
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
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          <Eye size={16} style={{ color: '#2E5339', strokeWidth: 2.2 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!receipts || receipts.length === 0) && (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-text-muted">
                      No se encontraron recepciones de mercadería registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Recepción */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="📦 Ingreso / Recepción de Mercadería" maxWidth="680px">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Proveedor Maestro *</label>
              <select {...register('supplierId')} className={errors.supplierId ? 'has-error' : ''}>
                <option value="">Seleccione un proveedor...</option>
                {supplierList.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name || s.businessName}</option>
                ))}
              </select>
              {errors.supplierId && <span className="field-error">{errors.supplierId.message}</span>}
            </div>

            <div className="form-field">
              <label>N° Comprobante / Factura</label>
              <input {...register('receiptNumber')} placeholder="Ej: FC-A-0001-00045892" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Tipo de Comprobante</label>
              <select {...register('receiptType')}>
                <option value="FACTURA">Factura de Compra</option>
                <option value="REMITO">Remito de Recepción</option>
                <option value="NOTA_DEBITO">Nota de Débito</option>
              </select>
            </div>

            <div className="form-field">
              <label>Fecha de Recepción *</label>
              <input type="date" {...register('receptionDate')} />
            </div>
          </div>

          {/* Tabla dinámica de Ítems */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm">Ítems Recibidos (Insumos / Productos)</h3>
              <button
                type="button"
                className="btn btn-sm btn-secondary flex items-center gap-1"
                onClick={() => append({ productId: '', itemName: '', quantity: 1, unitOfMeasure: 'KG', unitCost: 0 })}
              >
                <Plus size={14} /> Agregar Ítem
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-bg-linen rounded">
                  <div className="col-span-5">
                    <label className="text-xs text-text-muted mb-1 block">Insumo / Producto</label>
                    <select
                      {...register(`items.${index}.productId` as const)}
                      onChange={(e) => {
                        const selectedRm = rawMaterials?.find(rm => rm.id === e.target.value);
                        if (selectedRm) {
                          setValue(`items.${index}.productId`, selectedRm.id);
                          setValue(`items.${index}.itemName`, selectedRm.name);
                          setValue(`items.${index}.unitOfMeasure`, selectedRm.unit);
                          setValue(`items.${index}.unitCost`, selectedRm.costPerUnit || 0);
                        }
                      }}
                    >
                      <option value="">Seleccionar insumo del catálogo...</option>
                      {rawMaterials?.map(rm => (
                        <option key={rm.id} value={rm.id}>{rm.name} ({rm.code})</option>
                      ))}
                    </select>
                    <input
                      {...register(`items.${index}.itemName` as const)}
                      placeholder="O escribir nombre personalizado..."
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-text-muted mb-1 block">Cantidad</label>
                    <input
                      type="number"
                      step="any"
                      {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                      placeholder="Cant."
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-text-muted mb-1 block">Unidad</label>
                    <select {...register(`items.${index}.unitOfMeasure` as const)}>
                      <option value="KG">KG</option>
                      <option value="GR">GR</option>
                      <option value="LTS">LTS</option>
                      <option value="UN">UN</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-text-muted mb-1 block">Costo Unit. ($)</label>
                    <input
                      type="number"
                      step="any"
                      {...register(`items.${index}.unitCost` as const, { valueAsNumber: true })}
                      placeholder="Costo $"
                    />
                  </div>

                  <div className="col-span-1 text-center mt-4">
                    <button
                      type="button"
                      className="btn btn-sm text-terracotta"
                      onClick={() => remove(index)}
                      title="Eliminar ítem"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {errors.items && (
              <span className="field-error text-terracotta text-sm block mt-2">
                {errors.items.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label>Notas / Observaciones del Remito</label>
            <textarea {...register('notes')} placeholder="Estado del paquete, lote del proveedor, etc..." rows={2}></textarea>
          </div>

          <div className="p-3 bg-linen rounded flex justify-between items-center mt-2 border">
            <div className="text-sm font-semibold text-text-dark">Total Calculado Comprobante:</div>
            <div className="text-xl font-bold text-primary-sage">{formatCurrency(calculatedTotal)}</div>
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={createReceipt.isPending}>
              {createReceipt.isPending ? 'Guardando...' : 'Confirmar Recepción'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle de Recepción */}
      <Modal isOpen={!!viewingReceipt} onClose={() => setViewingReceipt(null)} title="📄 Detalle de Comprobante de Recepción" maxWidth="620px">
        {viewingReceipt && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-text-dark">{viewingReceipt.receiptNumber || 'Comprobante de Recepción'}</h2>
                <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                  <Building size={14} /> <span>{viewingReceipt.supplierName || 'Proveedor'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-muted">Monto Total</div>
                <div className="text-xl font-bold text-primary-sage">
                  {formatCurrency(viewingReceipt.totalAmount || viewingReceipt.totalCost)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary-sage" /> 
                <span>Fecha Ingreso: {new Date(viewingReceipt.receptionDate || viewingReceipt.receiptDate || viewingReceipt.createdAt || '').toLocaleDateString('es-AR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary-sage" /> 
                <span>Tipo: {viewingReceipt.receiptType || 'FACTURA'}</span>
              </div>
            </div>

            <div className="border-t pt-3">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <PackageCheck size={16} className="text-primary-sage" /> Detalle de Ítems Recibidos:
              </h4>
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Ítem / Insumo</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-right">Costo Unit.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(viewingReceipt.items) && viewingReceipt.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="font-medium">{item.itemName}</td>
                      <td className="text-center">{item.quantity} {item.unitOfMeasure || 'KG'}</td>
                      <td className="text-right">{formatCurrency(item.unitCost)}</td>
                      <td className="text-right font-semibold">{formatCurrency(item.subtotal || item.quantity * item.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewingReceipt.notes && (
              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-1">Notas Observaciones:</h4>
                <p className="text-sm text-text-dark bg-bg-linen p-3 rounded">{viewingReceipt.notes}</p>
              </div>
            )}

            <div className="border-t pt-3 flex justify-end">
              <button className="btn btn-secondary" onClick={() => setViewingReceipt(null)}>Cerrar Detalle</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
