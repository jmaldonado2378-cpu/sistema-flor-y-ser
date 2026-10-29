import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, ShoppingBag, CheckCircle2, AlertCircle, Pencil, UserCheck, CreditCard } from 'lucide-react';
import { useCustomers, useSales, useCreateOrder, useUpdateOrderDetails } from '../hooks';
import { useFinalProducts } from '../hooks/useInventory';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/ui/Modal';
import { Customer } from '../api/customers';
import { Order } from '../api/sales';

interface SalesPageProps {
  onTabChange?: (tab: string) => void;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'EFECTIVO', label: '💵 Efectivo' },
  { value: 'MERCADO_PAGO', label: '💳 Mercado Pago' },
  { value: 'TRANSFERENCIA', label: '🏦 Transferencia Bancaria' },
  { value: 'TARJETA_DEBITO', label: '💳 Tarjeta Débito' },
  { value: 'TARJETA_CREDITO', label: '💳 Tarjeta Crédito' },
  { value: 'CUENTA_CORRIENTE', label: '📒 Cuenta Corriente (Fiado)' },
];

export const formatPaymentMethodLabel = (method?: string): string => {
  if (!method) return '💵 Efectivo';
  const clean = method.trim().toUpperCase();
  const found = PAYMENT_METHOD_OPTIONS.find(
    o => o.value === clean || o.label.toUpperCase().includes(clean)
  );
  if (found) return found.label;
  if (clean.includes('MERCADO')) return '💳 Mercado Pago';
  if (clean.includes('TRANSF')) return '🏦 Transferencia Bancaria';
  if (clean.includes('CUENTA') || clean.includes('FIADO') || clean.includes('CREDIT')) return '📒 Cuenta Corriente';
  if (clean.includes('DEBIT')) return '💳 Tarjeta Débito';
  if (clean.includes('EFECTIVO') || clean.includes('CASH')) return '💵 Efectivo';
  return method;
};

export const normalizePaymentMethodCode = (method?: string): string => {
  if (!method) return 'EFECTIVO';
  const clean = method.trim().toUpperCase();
  if (clean.includes('MERCADO')) return 'MERCADO_PAGO';
  if (clean.includes('TRANSF')) return 'TRANSFERENCIA';
  if (clean.includes('CUENTA') || clean.includes('FIADO')) return 'CUENTA_CORRIENTE';
  if (clean.includes('DEBIT')) return 'TARJETA_DEBITO';
  if (clean.includes('TARJETA') || clean.includes('CREDITO')) return 'TARJETA_CREDITO';
  return 'EFECTIVO';
};

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Seleccione un producto'),
  productName: z.string().min(1, 'Nombre de producto requerido'),
  quantity: z.number().min(1, 'Mínimo 1 unidad'),
  unitPrice: z.number().min(0, 'El precio debe ser >= 0')
});

const saleSchema = z.object({
  customerId: z.string().min(1, 'Seleccione un cliente'),
  channel: z.string().optional(),
  sellerId: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'Agregue al menos un producto al pedido'),
  discount: z.number().min(0).optional(),
  shippingFee: z.number().min(0).optional(),
  paymentMethod: z.string().min(1, 'Seleccione método de pago')
});

type SaleFormValues = z.infer<typeof saleSchema>;

export const SalesPage: React.FC<SalesPageProps> = () => {
  const { user: currentUser, users: systemUsers } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const activeSellers = (systemUsers || []).filter(u => u.active !== false);

  const { data: customerResult } = useCustomers();
  const { data: salesResult, isLoading: loadingOrders, refetch: refetchSales } = useSales();
  const { data: finalProducts } = useFinalProducts();
  const createOrder = useCreateOrder();
  const updateOrderDetails = useUpdateOrderDetails();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado del Modal de Edición de Venta (para el Administrador)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editSellerId, setEditSellerId] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('EFECTIVO');
  const [editChannel, setEditChannel] = useState<string>('LOCAL');
  const [editNotes, setEditNotes] = useState<string>('');

  const customers: Customer[] = customerResult?.data || [];

  const recentOrders: Order[] = Array.isArray(salesResult) 
    ? salesResult 
    : (salesResult?.data || (salesResult as any)?.orders || []);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: '',
      channel: 'LOCAL',
      sellerId: currentUser?.id || '',
      items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
      discount: 0,
      shippingFee: 0,
      paymentMethod: 'EFECTIVO'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items') || [];
  const watchDiscount = watch('discount') || 0;
  const watchShipping = watch('shippingFee') || 0;

  const subtotal = watchItems.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0);
  const total = Math.max(0, subtotal - watchDiscount + watchShipping);

  const onSubmit = (data: SaleFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const selectedCust = customers.find(c => c.id === data.customerId);
    const customerName = selectedCust ? `${selectedCust.firstName} ${selectedCust.lastName}` : 'Cliente Registrado';

    const targetSellerId = isAdmin ? (data.sellerId || currentUser?.id) : currentUser?.id;
    const matchedSeller = activeSellers.find(u => u.id === targetSellerId);
    const targetSellerName = matchedSeller ? matchedSeller.name : (currentUser?.name || 'Vendedora');

    createOrder.mutate({
      customerId: data.customerId,
      customerName,
      channel: data.channel || 'LOCAL',
      sellerId: targetSellerId,
      sellerName: targetSellerName,
      items: data.items,
      totalAmount: total,
      paymentMethod: data.paymentMethod,
    }, {
      onSuccess: () => {
        setSuccessMsg(`✅ Venta registrada exitosamente para ${customerName} (${formatPaymentMethodLabel(data.paymentMethod)} • Vendedora: ${targetSellerName}).`);
        refetchSales();
        reset({
          customerId: '',
          channel: 'LOCAL',
          sellerId: currentUser?.id || '',
          items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
          discount: 0,
          shippingFee: 0,
          paymentMethod: 'EFECTIVO'
        });
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al procesar la venta. Verifique los datos ingresados.');
      }
    });
  };

  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditSellerId(order.sellerId || currentUser?.id || '');
    setEditPaymentMethod(normalizePaymentMethodCode(order.paymentMethod));
    setEditChannel(order.channel || 'LOCAL');
    setEditNotes(order.notes || '');
  };

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    const matchedSeller = activeSellers.find(u => u.id === editSellerId);
    const sellerName = matchedSeller ? matchedSeller.name : (editingOrder.sellerName || '');

    updateOrderDetails.mutate(
      {
        id: editingOrder.id,
        data: {
          sellerId: editSellerId,
          sellerName,
          paymentMethod: editPaymentMethod,
          channel: editChannel,
          notes: editNotes
        }
      },
      {
        onSuccess: () => {
          setSuccessMsg(`✅ Venta actualizada: Vendedora asignada a ${sellerName || 'Sin asignar'} y medio de pago ${formatPaymentMethodLabel(editPaymentMethod)}.`);
          setEditingOrder(null);
          refetchSales();
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'Error al actualizar la venta.');
        }
      }
    );
  };

  const formatCurrency = (amount?: number) => {
    return (amount || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  const catalogProducts = (finalProducts && finalProducts.length > 0) 
    ? finalProducts.map(fp => ({ id: fp.id, name: fp.name, price: fp.price }))
    : [
        { id: 'p1', name: 'Almendras Nonpareil 1kg', price: 8500 },
        { id: 'p2', name: 'Nuez Mariposa 500g', price: 6200 },
        { id: 'p3', name: 'Mix Frutos Secos 1kg', price: 9000 },
        { id: 'p4', name: 'Mantequilla de Maní 500g', price: 3200 },
      ];

  return (
    <div className="page-container">
      <header className="page-header mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Nueva Venta / Registro de Pedido</h1>
          <p className="text-sm text-text-muted mt-1">Punto de venta mostrador, asignación de puntos e impresión de ticket</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-col gap-4">
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-800 text-sm rounded flex items-center gap-2">
                <CheckCircle2 size={18} /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 text-terracotta text-sm rounded flex items-center gap-2">
                <AlertCircle size={18} /> {errorMsg}
              </div>
            )}

            <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Cliente CRM *</label>
                <select className={`input ${errors.customerId ? 'has-error' : ''}`} {...register('customerId')}>
                  <option value="">Seleccione un cliente...</option>
                  {customers.map((c: Customer) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phoneWhatsapp})</option>
                  ))}
                </select>
                {errors.customerId && <span className="field-error">{errors.customerId.message}</span>}
              </div>

              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Canal de Venta</label>
                <select className="input" {...register('channel')}>
                  <option value="LOCAL">🏪 Local / Mostrador</option>
                  <option value="WHATSAPP">📱 WhatsApp</option>
                  <option value="ONLINE_STORE">🌐 Tienda Online</option>
                  <option value="INSTAGRAM">📷 Instagram</option>
                </select>
              </div>

              {isAdmin && (
                <div className="form-field">
                  <label className="text-sm font-semibold text-primary-sage mb-1 flex items-center gap-1">
                    <UserCheck size={14} /> Vendedora Asignada (Admin)
                  </label>
                  <select className="input font-medium" {...register('sellerId')}>
                    {activeSellers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'ADMIN' ? 'Admin' : 'Vendedora'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Ítems del Pedido *</label>
              
              <div className="flex flex-col gap-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-bg-linen rounded border">
                    <div className="col-span-7">
                      <select 
                        className="input text-xs"
                        {...register(`items.${index}.productId` as const, {
                          onChange: (e) => {
                            const val = e.target.value;
                            const product = catalogProducts.find(p => p.id === val);
                            if (product) {
                              setValue(`items.${index}.productId`, product.id, { shouldValidate: true });
                              setValue(`items.${index}.productName`, product.name, { shouldValidate: true });
                              setValue(`items.${index}.unitPrice`, product.price, { shouldValidate: true });
                            } else {
                              setValue(`items.${index}.productId`, '', { shouldValidate: true });
                              setValue(`items.${index}.productName`, '', { shouldValidate: true });
                              setValue(`items.${index}.unitPrice`, 0, { shouldValidate: true });
                            }
                          }
                        })}
                      >
                        <option value="">Seleccionar producto del catálogo...</option>
                        {catalogProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input 
                        type="number" 
                        className="input text-xs"
                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        min="1"
                        placeholder="Cant."
                      />
                    </div>

                    <div className="col-span-2 text-right font-semibold text-xs text-text-dark">
                      {formatCurrency((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0))}
                    </div>

                    <div className="col-span-1 text-center">
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        className="btn btn-secondary btn-sm text-terracotta"
                        title="Eliminar ítem"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                type="button" 
                onClick={() => append({ productId: '', productName: '', quantity: 1, unitPrice: 0 })}
                className="btn btn-secondary btn-sm mt-3 self-start flex items-center gap-1 text-xs"
              >
                <Plus size={15} /> Agregar Ítem
              </button>

              {errors.items && (
                <span className="field-error text-terracotta text-sm block mt-2">
                  {errors.items.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-4">
              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Descuento ($)</label>
                <input type="number" className="input" {...register('discount', { valueAsNumber: true })} min="0" />
              </div>
              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Costo Envío ($)</label>
                <input type="number" className="input" {...register('shippingFee', { valueAsNumber: true })} min="0" />
              </div>
              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 flex items-center gap-1">
                  <CreditCard size={14} /> Método de Pago *
                </label>
                <select className="input font-semibold" {...register('paymentMethod')}>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-bg-linen rounded-lg flex justify-between items-center mt-3 border">
              <div>
                <div className="text-xs text-text-muted">Subtotal: {formatCurrency(subtotal)}</div>
                <div className="text-2xl font-bold text-primary-sage">Total Venta: {formatCurrency(total)}</div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={createOrder.isPending || watchItems.length === 0}>
                {createOrder.isPending ? 'Procesando Venta...' : '✅ Confirmar Venta'}
              </button>
            </div>
          </form>
        </div>

        <div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-text-dark flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary-sage" /> Ventas Recientes
            </h3>
            
            {loadingOrders ? (
              <div className="py-8 text-center text-text-muted">Cargando ventas recientes...</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentOrders.slice(0, 12).map((order: Order) => {
                  const cust = customers.find((c: Customer) => c.id === order.customerId);
                  const custName = order.customerName || (cust ? `${cust.firstName} ${cust.lastName}` : 'Cliente Registrado');
                  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') : '-';
                  const sellerObj = activeSellers.find(u => u.id === order.sellerId);
                  const sellerLabel = order.sellerName || sellerObj?.name || 'Sin vendedora asignada';

                  return (
                    <div key={order.id} className="p-3 border rounded-lg bg-bg-linen flex flex-col gap-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-semibold text-sm text-text-dark block">{custName}</span>
                          {order.orderNumber && (
                            <span className="text-[10px] text-text-muted font-mono">{order.orderNumber}</span>
                          )}
                        </div>
                        <span className="font-bold text-sm text-primary-sage">{formatCurrency(order.totalAmount)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-text-muted flex-wrap gap-1">
                        <span className="badge gray text-[11px] font-semibold">
                          {formatPaymentMethodLabel(order.paymentMethod)}
                        </span>
                        <span>{dateStr}</span>
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-gray-200/80 text-xs">
                        <span className="text-text-dark flex items-center gap-1 truncate" title={sellerLabel}>
                          <UserCheck size={12} className="text-primary-sage flex-shrink-0" />
                          <span className="truncate">{sellerLabel}</span>
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditOrder(order)}
                            className="btn btn-secondary btn-sm text-[11px] py-0.5 px-2 flex items-center gap-1"
                            title="Modificar vendedora asignada, medio de pago o canal"
                          >
                            <Pencil size={11} /> Editar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {recentOrders.length === 0 && (
                  <div className="py-6 text-center text-sm text-text-muted">No hay ventas registradas aún</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Administrador: Modificar Vendedora, Medio de Pago y Canal de una Venta ya cargada */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title="✏️ Modificar Venta y Asignación de Vendedora"
        maxWidth="520px"
      >
        {editingOrder && (
          <form onSubmit={handleSaveEditOrder} className="flex flex-col gap-4">
            <div className="p-3 bg-bg-linen rounded border text-xs flex justify-between items-center">
              <div>
                <div className="font-bold text-text-dark text-sm">
                  {editingOrder.orderNumber || `Pedido #${editingOrder.id.slice(0, 6)}`}
                </div>
                <div className="text-text-muted">
                  Cliente: <strong>{editingOrder.customerName || 'Cliente Registrado'}</strong>
                </div>
              </div>
              <div className="text-right">
                <div className="text-text-muted">Total Venta</div>
                <div className="text-base font-bold text-primary-sage">{formatCurrency(editingOrder.totalAmount)}</div>
              </div>
            </div>

            <div className="form-field">
              <label className="text-xs font-bold text-text-dark mb-1 block">
                👩‍💼 Vendedora Asignada (Recalcula su comisión automáticamente) *
              </label>
              <select
                className="input font-semibold"
                value={editSellerId}
                onChange={(e) => setEditSellerId(e.target.value)}
              >
                <option value="">-- Sin vendedora asignada --</option>
                {activeSellers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'ADMIN' ? 'Administrador' : 'Vendedora'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="form-field">
                <label className="text-xs font-bold text-text-dark mb-1 block">
                  💳 Método de Pago *
                </label>
                <select
                  className="input font-semibold"
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                >
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="text-xs font-bold text-text-dark mb-1 block">
                  🏪 Canal de Venta
                </label>
                <select
                  className="input"
                  value={editChannel}
                  onChange={(e) => setEditChannel(e.target.value)}
                >
                  <option value="LOCAL">🏪 Local / Mostrador</option>
                  <option value="WHATSAPP">📱 WhatsApp</option>
                  <option value="ONLINE_STORE">🌐 Tienda Online</option>
                  <option value="INSTAGRAM">📷 Instagram</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="text-xs font-semibold text-text-dark mb-1 block">Notas / Observaciones</label>
              <textarea
                rows={2}
                className="input text-xs"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notas adicionales del pedido..."
              />
            </div>

            <div className="form-actions flex justify-end gap-2 border-t pt-3">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingOrder(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={updateOrderDetails.isPending}>
                {updateOrderDetails.isPending ? 'Guardando...' : '💾 Guardar Cambios en la Venta'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
