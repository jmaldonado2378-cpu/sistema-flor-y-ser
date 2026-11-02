import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Pencil,
  UserCheck,
  CreditCard,
  ClipboardCheck,
  Search,
  RefreshCw,
  XCircle,
  Package,
  History,
  CheckSquare,
  Clock
} from 'lucide-react';
import {
  useCustomers,
  useSales,
  useCreateOrder,
  useUpdateOrderDetails,
  useUpdateOrderFull,
  useDeleteOrder,
  useMerchandiseReceipts
} from '../hooks';
import { useFinalProducts } from '../hooks/useInventory';
import { useStockMovements } from '../hooks/useStockMovements';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/ui/Modal';
import { Customer } from '../api/customers';
import { Order, OrderItem } from '../api/sales';

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
  quantity: z.number().min(0.01, 'Mínimo > 0'),
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

export const SalesPage: React.FC<SalesPageProps> = ({ onTabChange }) => {
  const { user: currentUser, users: systemUsers } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const activeSellers = (systemUsers || []).filter(u => u.active !== false);

  const [activeView, setActiveView] = useState<'pos' | 'registry'>('pos');
  const [registrySubTab, setRegistrySubTab] = useState<'sales' | 'purchases' | 'kardex'>('sales');

  // Filtros del Registro de Ventas y Operaciones
  const [regSearch, setRegSearch] = useState<string>('');
  const [regSellerFilter, setRegSellerFilter] = useState<string>('');
  const [regPaymentFilter, setRegPaymentFilter] = useState<string>('');
  const [regVerifyFilter, setRegVerifyFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'CANCELLED'>('ALL');

  const { data: customerResult } = useCustomers();
  const { data: salesResult, isLoading: loadingOrders, refetch: refetchSales } = useSales();
  const { data: finalProducts } = useFinalProducts();
  const { data: receiptsData, isLoading: loadingReceipts, refetch: refetchReceipts } = useMerchandiseReceipts();
  const { data: movementsResp, isLoading: loadingMovements, refetch: refetchMovements } = useStockMovements();

  const createOrder = useCreateOrder();
  const updateOrderDetails = useUpdateOrderDetails();
  const updateOrderFull = useUpdateOrderFull();
  const deleteOrderMut = useDeleteOrder();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado del Modal de Edición Completa de Venta
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomerId, setEditCustomerId] = useState<string>('');
  const [editSellerId, setEditSellerId] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('EFECTIVO');
  const [editChannel, setEditChannel] = useState<string>('LOCAL');
  const [editStatus, setEditStatus] = useState<string>('RECEIVED');
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editDeliveryFee, setEditDeliveryFee] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editIsVerified, setEditIsVerified] = useState<boolean>(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);

  const customers: Customer[] = customerResult?.data || [];
  const receiptsList: any[] = Array.isArray(receiptsData) ? receiptsData : [];
  const stockMovementsList: any[] = movementsResp?.data || [];

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

  const catalogProducts = (finalProducts && finalProducts.length > 0)
    ? finalProducts.map(fp => ({ id: fp.id, name: fp.name, price: fp.price, code: fp.code }))
    : [
        { id: 'p1', name: 'Almendras Nonpareil 1kg', price: 8500, code: 'PF-ALM-01' },
        { id: 'p2', name: 'Nuez Mariposa 500g', price: 6200, code: 'PF-NUE-01' },
        { id: 'p3', name: 'Mix Frutos Secos 1kg', price: 9000, code: 'PF-MIX-01' },
        { id: 'p4', name: 'Mantequilla de Maní 500g', price: 3200, code: 'PF-MAN-01' },
      ];

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
    setSuccessMsg(null);
    setErrorMsg(null);
    setEditingOrder(order);
    setEditCustomerId(order.customerId || '');
    setEditSellerId(order.sellerId || currentUser?.id || '');
    setEditPaymentMethod(normalizePaymentMethodCode(order.paymentMethod));
    setEditChannel(order.channel || 'LOCAL');
    setEditStatus(order.status || 'RECEIVED');
    setEditDiscount(Number(order.discountAmount) || 0);
    setEditDeliveryFee(Number(order.deliveryFee) || 0);
    setEditNotes(order.notes || '');
    setEditIsVerified(Boolean(order.isVerified));

    const existingItems = Array.isArray(order.items) && order.items.length > 0
      ? order.items.map(it => ({
          productId: it.productId || '',
          productName: it.productName || 'Producto',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          subtotal: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
        }))
      : [{
          productId: catalogProducts[0]?.id || '',
          productName: catalogProducts[0]?.name || 'Producto',
          quantity: 1,
          unitPrice: Number(order.totalAmount) || 0,
          subtotal: Number(order.totalAmount) || 0
        }];
    setEditItems(existingItems);
  };

  const editSubtotal = editItems.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0);
  const editTotal = Math.max(0, editSubtotal - (Number(editDiscount) || 0) + (Number(editDeliveryFee) || 0));

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const validItems = editItems.filter(it => (Number(it.quantity) || 0) > 0 && it.productName.trim().length > 0);
    if (validItems.length === 0) {
      alert('La venta debe tener al menos un producto con cantidad mayor a 0.');
      return;
    }

    const matchedSeller = activeSellers.find(u => u.id === editSellerId);
    const sellerName = matchedSeller ? matchedSeller.name : (editingOrder.sellerName || '');
    const selectedCust = customers.find(c => c.id === editCustomerId);
    const customerName = selectedCust ? `${selectedCust.firstName} ${selectedCust.lastName}` : editingOrder.customerName;

    updateOrderFull.mutate(
      {
        id: editingOrder.id,
        data: {
          customerId: editCustomerId || editingOrder.customerId,
          customerName,
          sellerId: editSellerId,
          sellerName,
          paymentMethod: editPaymentMethod,
          channel: editChannel,
          status: editStatus,
          discountAmount: Number(editDiscount) || 0,
          deliveryFee: Number(editDeliveryFee) || 0,
          notes: editNotes,
          isVerified: editIsVerified,
          verifiedBy: currentUser?.name || 'Administrador',
          items: validItems
        }
      },
      {
        onSuccess: () => {
          setSuccessMsg(`✅ Venta ${editingOrder.orderNumber || ''} corregida y sincronizada con Stock y Cuenta Corriente.`);
          setEditingOrder(null);
          refetchSales();
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'Error al actualizar la venta.');
        }
      }
    );
  };

  const handleToggleVerifyOrder = (order: Order) => {
    const nextState = !order.isVerified;
    updateOrderDetails.mutate(
      {
        id: order.id,
        data: {
          isVerified: nextState,
          verifiedBy: currentUser?.name || 'Administrador'
        }
      },
      {
        onSuccess: () => {
          setSuccessMsg(
            nextState
              ? `✅ Venta ${order.orderNumber || ''} marcada como VERIFICADA por ${currentUser?.name || 'Admin'}.`
              : `⏳ Venta ${order.orderNumber || ''} marcada como pendiente de verificación.`
          );
          refetchSales();
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'No se pudo cambiar el estado de verificación.');
        }
      }
    );
  };

  const handleCancelOrder = (order: Order) => {
    if (order.status === 'CANCELLED') return;
    if (!confirm(`¿Desea ANULAR la venta ${order.orderNumber || ''} de ${order.customerName || 'Cliente'} por ${formatCurrency(order.totalAmount)}?\n\nEl stock de los productos se reincorporará automáticamente al inventario.`)) {
      return;
    }
    updateOrderDetails.mutate(
      {
        id: order.id,
        data: { status: 'CANCELLED' }
      },
      {
        onSuccess: () => {
          setSuccessMsg(`🚫 Venta ${order.orderNumber || ''} anulada y stock devuelto al inventario.`);
          refetchSales();
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'No se pudo anular la venta.');
        }
      }
    );
  };

  const handleDeleteOrder = (order: Order) => {
    if (!confirm(`⚠️ ¿Está seguro de ELIMINAR DEFINITIVAMENTE la venta ${order.orderNumber || ''} (${formatCurrency(order.totalAmount)})?\n\n• Se devolverá el stock al inventario (Kardex).\n• Se revertirá el cargo en Cuenta Corriente si era fiado.\n• El registro desaparecerá del listado.`)) {
      return;
    }
    deleteOrderMut.mutate(order.id, {
      onSuccess: (res) => {
        setSuccessMsg(`🗑️ ${res?.message || 'Venta eliminada y stock revertido correctamente.'}`);
        if (editingOrder?.id === order.id) {
          setEditingOrder(null);
        }
        refetchSales();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al eliminar la venta.');
      }
    });
  };

  const formatCurrency = (amount?: number) => {
    return (amount || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  // Filtrado de órdenes para la pestaña de Registro y Verificación
  const filteredRegistryOrders = recentOrders.filter((order: Order) => {
    if (regSearch.trim()) {
      const q = regSearch.toLowerCase();
      const cust = customers.find((c: Customer) => c.id === order.customerId);
      const custName = (order.customerName || (cust ? `${cust.firstName} ${cust.lastName}` : '')).toLowerCase();
      const ordNum = (order.orderNumber || '').toLowerCase();
      const itemsMatch = (order.items || []).some(i => (i.productName || '').toLowerCase().includes(q));
      if (!custName.includes(q) && !ordNum.includes(q) && !itemsMatch) return false;
    }
    if (regSellerFilter) {
      if ((order.sellerId || '') !== regSellerFilter) return false;
    }
    if (regPaymentFilter) {
      if (normalizePaymentMethodCode(order.paymentMethod) !== regPaymentFilter) return false;
    }
    if (regVerifyFilter === 'VERIFIED' && (!order.isVerified || order.status === 'CANCELLED')) return false;
    if (regVerifyFilter === 'PENDING' && (order.isVerified || order.status === 'CANCELLED')) return false;
    if (regVerifyFilter === 'CANCELLED' && order.status !== 'CANCELLED') return false;
    return true;
  });

  const totalActiveSalesCount = recentOrders.filter(o => o.status !== 'CANCELLED').length;
  const verifiedSalesCount = recentOrders.filter(o => o.isVerified && o.status !== 'CANCELLED').length;
  const pendingVerifyCount = recentOrders.filter(o => !o.isVerified && o.status !== 'CANCELLED').length;
  const cancelledSalesCount = recentOrders.filter(o => o.status === 'CANCELLED').length;

  return (
    <div className="page-container">
      <header className="page-header flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">
            {activeView === 'pos' ? 'Nueva Venta / Punto de Venta' : 'Registro de Ventas y Operaciones'}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {activeView === 'pos'
              ? 'Punto de venta mostrador, asignación de vendedora e impacto directo en stock y cuenta corriente'
              : 'Control, verificación de datos cargados y corrección de errores en ventas, compras y movimientos de stock'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className={`btn ${activeView === 'pos' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            onClick={() => setActiveView('pos')}
          >
            <ShoppingBag size={16} /> 🛒 Nueva Venta (POS)
          </button>
          <button
            type="button"
            className={`btn ${activeView === 'registry' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            onClick={() => setActiveView('registry')}
          >
            <ClipboardCheck size={16} /> 📋 Registro de Ventas y Operaciones
            {pendingVerifyCount > 0 && (
              <span className="badge amber text-[11px] font-bold ml-1">
                {pendingVerifyCount} por verificar
              </span>
            )}
          </button>
        </div>
      </header>

      {successMsg && (
        <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
          <button type="button" className="text-xs underline" onClick={() => setSuccessMsg(null)}>Cerrar</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-terracotta text-sm rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} /> {errorMsg}
          </div>
          <button type="button" className="text-xs underline" onClick={() => setErrorMsg(null)}>Cerrar</button>
        </div>
      )}

      {/* VISTA 1: PUNTO DE VENTA (NUEVA VENTA) */}
      {activeView === 'pos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-col gap-4">
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
                      <div className="col-span-6">
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
                          step="any"
                          className="input text-xs"
                          {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                          min="0.01"
                          placeholder="Cant."
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          className="input text-xs text-right"
                          {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                          min="0"
                          placeholder="Precio $"
                          title="Precio unitario"
                        />
                      </div>

                      <div className="col-span-1 text-right font-semibold text-xs text-text-dark">
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-text-dark flex items-center gap-2">
                  <ShoppingBag size={18} className="text-primary-sage" /> Ventas Recientes
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveView('registry')}
                  className="text-xs font-semibold text-primary-sage hover:underline"
                >
                  Ver todas / Corregir →
                </button>
              </div>

              {loadingOrders ? (
                <div className="py-8 text-center text-text-muted">Cargando ventas recientes...</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recentOrders.slice(0, 10).map((order: Order) => {
                    const cust = customers.find((c: Customer) => c.id === order.customerId);
                    const custName = order.customerName || (cust ? `${cust.firstName} ${cust.lastName}` : 'Cliente Registrado');
                    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') : '-';
                    const sellerObj = activeSellers.find(u => u.id === order.sellerId);
                    const sellerLabel = order.sellerName || sellerObj?.name || 'Sin vendedora asignada';
                    const isCancelled = order.status === 'CANCELLED';

                    return (
                      <div key={order.id} className={`p-3 border rounded-lg bg-bg-linen flex flex-col gap-1.5 ${isCancelled ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-semibold text-sm text-text-dark block">{custName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {order.orderNumber && (
                                <span className="text-[10px] text-text-muted font-mono">{order.orderNumber}</span>
                              )}
                              {isCancelled ? (
                                <span className="badge red text-[10px]">Anulada</span>
                              ) : order.isVerified ? (
                                <span className="badge green text-[10px]">✅ Verificada</span>
                              ) : (
                                <span className="badge amber text-[10px]">⏳ Sin verificar</span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-sm text-primary-sage">{formatCurrency(order.totalAmount)}</span>
                        </div>

                        {Array.isArray(order.items) && order.items.length > 0 && (
                          <div className="text-[11px] text-text-muted bg-white/80 px-2 py-1 rounded border border-gray-200/60">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="truncate">
                                • {it.quantity}x {it.productName} ({formatCurrency(it.unitPrice)})
                              </div>
                            ))}
                          </div>
                        )}

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
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleVerifyOrder(order)}
                              className={`btn btn-sm text-[11px] py-0.5 px-2 ${order.isVerified ? 'btn-secondary' : 'btn-primary'}`}
                              title={order.isVerified ? 'Quitar marca de verificado' : 'Marcar venta como verificada'}
                            >
                              {order.isVerified ? '✓ Verificada' : 'Verificar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditOrder(order)}
                              className="btn btn-secondary btn-sm text-[11px] py-0.5 px-2 flex items-center gap-1"
                              title="Corregir productos, cantidades, precios, medio de pago o vendedora"
                            >
                              <Pencil size={11} /> Corregir
                            </button>
                          </div>
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
      )}

      {/* VISTA 2: REGISTRO CENTRALIZADO DE VENTAS Y OPERACIONES */}
      {activeView === 'registry' && (
        <div className="flex flex-col gap-5">
          {/* KPIs de Control y Verificación */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4 border-l-4" style={{ borderLeftColor: '#2E5339' }}>
              <div className="text-xs text-text-muted uppercase font-semibold">Ventas Activas Registradas</div>
              <div className="text-2xl font-bold text-text-dark mt-1">{totalActiveSalesCount}</div>
              <div className="text-xs text-text-muted mt-1">Sincronizadas en MySQL</div>
            </div>
            <div className="card p-4 border-l-4" style={{ borderLeftColor: '#10B981' }}>
              <div className="text-xs text-text-muted uppercase font-semibold flex items-center gap-1">
                <CheckSquare size={14} className="text-green-600" /> Ventas Verificadas
              </div>
              <div className="text-2xl font-bold text-green-700 mt-1">{verifiedSalesCount}</div>
              <div className="text-xs text-text-muted mt-1">Auditadas y validadas</div>
            </div>
            <div className="card p-4 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
              <div className="text-xs text-text-muted uppercase font-semibold flex items-center gap-1">
                <Clock size={14} className="text-amber-600" /> Pendientes de Verificar
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{pendingVerifyCount}</div>
              <div className="text-xs text-text-muted mt-1">Requieren revisión de carga</div>
            </div>
            <div className="card p-4 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
              <div className="text-xs text-text-muted uppercase font-semibold flex items-center gap-1">
                <XCircle size={14} className="text-terracotta" /> Ventas Anuladas
              </div>
              <div className="text-2xl font-bold text-terracotta mt-1">{cancelledSalesCount}</div>
              <div className="text-xs text-text-muted mt-1">Stock reincorporado al Kardex</div>
            </div>
          </div>

          {/* Selector de Sub-Módulo de Operaciones */}
          <div className="card">
            <div className="flex flex-wrap justify-between items-center gap-3 pb-4 mb-4 border-b">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn ${registrySubTab === 'sales' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1.5 text-xs`}
                  onClick={() => setRegistrySubTab('sales')}
                >
                  <ShoppingBag size={15} /> 🛍️ Ventas y Pedidos ({recentOrders.length})
                </button>
                <button
                  type="button"
                  className={`btn ${registrySubTab === 'purchases' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1.5 text-xs`}
                  onClick={() => setRegistrySubTab('purchases')}
                >
                  <Package size={15} /> 🚚 Recepciones de Compra / Proveedores ({receiptsList.length})
                </button>
                <button
                  type="button"
                  className={`btn ${registrySubTab === 'kardex' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1.5 text-xs`}
                  onClick={() => setRegistrySubTab('kardex')}
                >
                  <History size={15} /> 📊 Auditoría Kardex de Stock ({stockMovementsList.length})
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
                onClick={() => {
                  refetchSales();
                  refetchReceipts();
                  refetchMovements();
                }}
              >
                <RefreshCw size={14} /> Actualizar Datos desde MySQL
              </button>
            </div>

            {/* SUB-TAB 1: VENTAS Y PEDIDOS */}
            {registrySubTab === 'sales' && (
              <div>
                <div className="bg-bg-linen p-3 rounded-lg border mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Buscar por Pedido, Cliente o Producto</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="input text-xs w-full"
                        placeholder="Ej: PED-2026, Martina, Almendras..."
                        value={regSearch}
                        onChange={(e) => setRegSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Filtrar por Vendedora</label>
                    <select
                      className="input text-xs w-full"
                      value={regSellerFilter}
                      onChange={(e) => setRegSellerFilter(e.target.value)}
                    >
                      <option value="">Todas las vendedoras</option>
                      {activeSellers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Método de Pago</label>
                    <select
                      className="input text-xs w-full"
                      value={regPaymentFilter}
                      onChange={(e) => setRegPaymentFilter(e.target.value)}
                    >
                      <option value="">Todos los medios de pago</option>
                      {PAYMENT_METHOD_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Estado de Verificación</label>
                    <select
                      className="input text-xs w-full font-semibold"
                      value={regVerifyFilter}
                      onChange={(e) => setRegVerifyFilter(e.target.value as any)}
                    >
                      <option value="ALL">Todas las ventas</option>
                      <option value="PENDING">⏳ Pendientes de Verificar</option>
                      <option value="VERIFIED">✅ Solo Verificadas</option>
                      <option value="CANCELLED">🚫 Solo Anuladas</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table w-full text-sm">
                    <thead>
                      <tr>
                        <th>N° Pedido / Fecha</th>
                        <th>Cliente & Canal</th>
                        <th>Productos Cargados (Cant. × Precio)</th>
                        <th>Medio de Pago</th>
                        <th>Vendedora</th>
                        <th className="text-right">Total Venta</th>
                        <th className="text-center">Verificación</th>
                        <th className="text-right">Acciones de Corrección</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistryOrders.map((order: Order) => {
                        const cust = customers.find((c: Customer) => c.id === order.customerId);
                        const custName = order.customerName || (cust ? `${cust.firstName} ${cust.lastName}` : 'Cliente Registrado');
                        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
                        const sellerObj = activeSellers.find(u => u.id === order.sellerId);
                        const sellerLabel = order.sellerName || sellerObj?.name || 'Sin asignar';
                        const isCancelled = order.status === 'CANCELLED';

                        return (
                          <tr key={order.id} className={isCancelled ? 'opacity-60 bg-red-50/30' : (order.isVerified ? 'bg-green-50/20' : '')}>
                            <td className="whitespace-nowrap">
                              <div className="font-mono font-bold text-xs text-primary-sage">
                                {order.orderNumber || `#${order.id.slice(0, 8)}`}
                              </div>
                              <div className="text-[11px] text-text-muted">{dateStr}</div>
                              {isCancelled && <span className="badge red text-[10px] mt-0.5">ANULADA</span>}
                            </td>
                            <td>
                              <div className="font-semibold text-text-dark">{custName}</div>
                              <span className="badge gray text-[10px]">{order.channel || 'LOCAL'}</span>
                            </td>
                            <td>
                              <div className="flex flex-col gap-0.5 max-w-xs">
                                {Array.isArray(order.items) && order.items.length > 0 ? (
                                  order.items.map((it, idx) => (
                                    <div key={idx} className="text-xs text-text-dark">
                                      <strong>{it.quantity}x</strong> {it.productName}{' '}
                                      <span className="text-text-muted">({formatCurrency(it.unitPrice)} c/u)</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-text-muted italic">Sin desglose de ítems</span>
                                )}
                                {order.notes && (
                                  <div className="text-[11px] text-text-muted italic mt-0.5">Nota: {order.notes}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="badge gray text-xs font-semibold">
                                {formatPaymentMethodLabel(order.paymentMethod)}
                              </span>
                            </td>
                            <td className="text-xs font-medium text-text-dark">
                              {sellerLabel}
                            </td>
                            <td className="text-right font-bold text-primary-sage whitespace-nowrap">
                              {formatCurrency(order.totalAmount)}
                            </td>
                            <td className="text-center whitespace-nowrap">
                              {isCancelled ? (
                                <span className="badge red text-[10px]">Anulada</span>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVerifyOrder(order)}
                                    className={`btn btn-sm text-xs py-1 px-2.5 flex items-center gap-1 ${
                                      order.isVerified ? 'btn-primary' : 'btn-secondary'
                                    }`}
                                    title={order.isVerified ? 'Clic para desmarcar verificación' : 'Clic para marcar como Verificado'}
                                  >
                                    <CheckCircle2 size={13} />
                                    {order.isVerified ? 'Verificado' : 'Verificar'}
                                  </button>
                                  {order.isVerified && order.verifiedBy && (
                                    <span className="text-[10px] text-text-muted">
                                      por {order.verifiedBy}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditOrder(order)}
                                  className="btn btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1"
                                  title="Corregir productos, cantidades, precios, cliente, vendedora o medio de pago"
                                >
                                  <Pencil size={13} /> Corregir Datos
                                </button>
                                {!isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelOrder(order)}
                                    className="btn btn-secondary btn-sm text-xs py-1 px-2 text-amber-700"
                                    title="Anular venta y devolver stock al inventario"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrder(order)}
                                    className="btn btn-secondary btn-sm text-xs py-1 px-2 text-terracotta"
                                    title="Eliminar venta definitivamente revirtiendo stock y cuenta corriente"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredRegistryOrders.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-text-muted">
                            No se encontraron ventas para los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: RECEPCIONES DE COMPRA / PROVEEDORES */}
            {registrySubTab === 'purchases' && (
              <div>
                <div className="flex justify-between items-center mb-3 bg-bg-linen p-3 rounded border">
                  <div className="text-xs text-text-muted">
                    Historial de comprobantes de compra e ingreso de mercadería cargados. Si necesitas editar o eliminar una factura de proveedor revirtiendo stock y deuda, puedes hacerlo desde <strong>Proveedores → Historial de Compras</strong>.
                  </div>
                  {onTabChange && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm text-xs whitespace-nowrap"
                      onClick={() => onTabChange('suppliers')}
                    >
                      Ir a Proveedores y Compras →
                    </button>
                  )}
                </div>

                {loadingReceipts ? (
                  <div className="py-8 text-center text-text-muted">Cargando recepciones de mercadería...</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table w-full text-sm">
                      <thead>
                        <tr>
                          <th>Comprobante / Remito</th>
                          <th>Fecha</th>
                          <th>Proveedor</th>
                          <th>Ítems Ingresados</th>
                          <th className="text-right">Total Compra</th>
                          <th>Estado Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiptsList.slice(0, 50).map((rec: any) => (
                          <tr key={rec.id}>
                            <td className="font-mono font-bold text-xs text-primary-sage">
                              {rec.receiptNumber || `REC-${String(rec.id).slice(0, 6)}`}
                            </td>
                            <td className="text-xs text-text-muted">
                              {rec.receptionDate ? new Date(rec.receptionDate).toLocaleDateString('es-AR') : '-'}
                            </td>
                            <td className="font-semibold text-text-dark">{rec.supplierName || 'Proveedor'}</td>
                            <td className="text-xs">
                              {Array.isArray(rec.items) && rec.items.length > 0
                                ? rec.items.map((it: any, i: number) => (
                                    <div key={i}>
                                      • {it.quantity} {it.unitOfMeasure || 'un.'} {it.itemName || it.productName} ({formatCurrency(it.unitCost)})
                                    </div>
                                  ))
                                : `${rec.itemsCount || 0} ítem(s)`}
                            </td>
                            <td className="text-right font-bold text-text-dark">
                              {formatCurrency(rec.totalAmount)}
                            </td>
                            <td>
                              <span className={`badge ${rec.paymentStatus === 'PAID' ? 'green' : 'amber'} text-xs`}>
                                {rec.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente / Cta. Cte.'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {receiptsList.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-text-muted">
                              No hay recepciones de compra registradas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: AUDITORÍA KARDEX DE STOCK */}
            {registrySubTab === 'kardex' && (
              <div>
                <div className="flex justify-between items-center mb-3 bg-bg-linen p-3 rounded border">
                  <div className="text-xs text-text-muted">
                    Registro inmutable de todas las entradas, salidas, correcciones de ventas y ajustes manuales de inventario.
                  </div>
                  {onTabChange && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm text-xs whitespace-nowrap"
                      onClick={() => onTabChange('stock')}
                    >
                      Abrir Stock y Ajuste Manual →
                    </button>
                  )}
                </div>

                {loadingMovements ? (
                  <div className="py-8 text-center text-text-muted">Cargando movimientos del Kardex...</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table w-full text-sm">
                      <thead>
                        <tr>
                          <th>Fecha / Hora</th>
                          <th>Tipo</th>
                          <th>Artículo</th>
                          <th className="text-right">Variación</th>
                          <th className="text-center">Stock Antes ➔ Después</th>
                          <th>Comprobante</th>
                          <th>Motivo / Usuario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockMovementsList.slice(0, 60).map((m: any) => {
                          const isPos = Number(m.quantity) > 0;
                          return (
                            <tr key={m.id}>
                              <td className="text-xs text-text-muted whitespace-nowrap">
                                {m.createdAt ? new Date(m.createdAt).toLocaleString('es-AR') : '-'}
                              </td>
                              <td>
                                <span className={`badge ${isPos ? 'green' : 'red'} text-xs`}>
                                  {m.movementType}
                                </span>
                              </td>
                              <td className="font-semibold text-text-dark">{m.itemName}</td>
                              <td className={`text-right font-bold ${isPos ? 'text-green-700' : 'text-terracotta'}`}>
                                {isPos ? `+${m.quantity}` : m.quantity} {m.unitOfMeasure}
                              </td>
                              <td className="text-center text-xs">
                                {m.previousStock} ➔ <strong>{m.resultingStock}</strong> {m.unitOfMeasure}
                              </td>
                              <td className="text-xs font-mono text-primary-sage">{m.referenceNumber || '-'}</td>
                              <td className="text-xs text-text-muted">
                                {m.reason} ({m.userName || 'Sistema'})
                              </td>
                            </tr>
                          );
                        })}
                        {stockMovementsList.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-text-muted">
                              No hay movimientos de stock registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Integral: Corregir / Editar Venta Completa (Productos, Cantidades, Precios, Cliente, Vendedora, Pago y Verificación) */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title="✏️ Corregir / Editar Venta y Verificar Datos"
        maxWidth="760px"
      >
        {editingOrder && (
          <form onSubmit={handleSaveEditOrder} className="flex flex-col gap-4">
            <div className="p-3 bg-bg-linen rounded-lg border text-xs flex flex-wrap justify-between items-center gap-2">
              <div>
                <div className="font-bold text-text-dark text-sm">
                  {editingOrder.orderNumber || `Pedido #${editingOrder.id.slice(0, 8)}`}
                </div>
                <div className="text-text-muted">
                  Al guardar cambios en productos o cantidades, el <strong>Stock (Kardex)</strong> y la <strong>Cuenta Corriente</strong> se ajustan automáticamente.
                </div>
              </div>
              <div className="text-right">
                <div className="text-text-muted">Nuevo Total Calculado</div>
                <div className="text-lg font-bold text-primary-sage">{formatCurrency(editTotal)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="form-field">
                <label className="text-xs font-bold text-text-dark mb-1 block">
                  👤 Cliente Asociado *
                </label>
                <select
                  className="input text-xs font-medium"
                  value={editCustomerId}
                  onChange={(e) => setEditCustomerId(e.target.value)}
                >
                  <option value={editingOrder.customerId || ''}>
                    {editingOrder.customerName || 'Cliente Actual'}
                  </option>
                  {customers
                    .filter(c => c.id !== editingOrder.customerId)
                    .map((c: Customer) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.phoneWhatsapp})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-field">
                <label className="text-xs font-bold text-text-dark mb-1 block">
                  👩‍💼 Vendedora Asignada (Recalcula comisión) *
                </label>
                <select
                  className="input text-xs font-semibold"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="form-field">
                <label className="text-xs font-bold text-text-dark mb-1 block">
                  💳 Método de Pago *
                </label>
                <select
                  className="input text-xs font-semibold"
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
                  className="input text-xs"
                  value={editChannel}
                  onChange={(e) => setEditChannel(e.target.value)}
                >
                  <option value="LOCAL">🏪 Local / Mostrador</option>
                  <option value="WHATSAPP">📱 WhatsApp</option>
                  <option value="ONLINE_STORE">🌐 Tienda Online</option>
                  <option value="INSTAGRAM">📷 Instagram</option>
                </select>
              </div>

              <div className="form-field">
                <label className="text-xs font-bold text-text-dark mb-1 block">
                  📦 Estado del Pedido
                </label>
                <select
                  className="input text-xs font-medium"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="RECEIVED">Recibido / Entregado</option>
                  <option value="PREPARING">En Preparación</option>
                  <option value="READY">Listo para Entrega</option>
                  <option value="DELIVERED">Entregado Finalizado</option>
                  <option value="CANCELLED">🚫 Anulado (Devuelve Stock)</option>
                </select>
              </div>
            </div>

            {/* Editor de Productos, Cantidades y Precios Unitarios */}
            <div className="border rounded-lg p-3 bg-bg-linen flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-dark">
                  🛒 Productos Vendidos (Puedes corregir producto, cantidad o precio unitario)
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1"
                  onClick={() => {
                    const firstProd = catalogProducts[0];
                    setEditItems([
                      ...editItems,
                      {
                        productId: firstProd?.id || '',
                        productName: firstProd?.name || 'Producto',
                        quantity: 1,
                        unitPrice: firstProd?.price || 0,
                        subtotal: firstProd?.price || 0
                      }
                    ]);
                  }}
                >
                  <Plus size={13} /> Agregar Producto
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {editItems.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border">
                    <div className="col-span-6">
                      <label className="text-[10px] text-text-muted block">Producto</label>
                      <select
                        className="input text-xs w-full"
                        value={it.productId || ''}
                        onChange={(e) => {
                          const selId = e.target.value;
                          const prod = catalogProducts.find(p => p.id === selId);
                          const next = [...editItems];
                          if (prod) {
                            next[idx] = {
                              ...next[idx],
                              productId: prod.id,
                              productName: prod.name,
                              unitPrice: prod.price
                            };
                          } else {
                            next[idx] = { ...next[idx], productId: '' };
                          }
                          setEditItems(next);
                        }}
                      >
                        {!it.productId && (
                          <option value="">{it.productName || 'Seleccionar producto...'}</option>
                        )}
                        {catalogProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-text-muted block">Cantidad</label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        className="input text-xs text-center font-bold w-full"
                        value={it.quantity}
                        onChange={(e) => {
                          const next = [...editItems];
                          next[idx] = { ...next[idx], quantity: parseFloat(e.target.value) || 0 };
                          setEditItems(next);
                        }}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-text-muted block">Precio Unit. ($)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input text-xs text-right w-full"
                        value={it.unitPrice}
                        onChange={(e) => {
                          const next = [...editItems];
                          next[idx] = { ...next[idx], unitPrice: parseFloat(e.target.value) || 0 };
                          setEditItems(next);
                        }}
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-between pt-3 pl-1">
                      <span className="text-xs font-bold text-primary-sage">
                        {formatCurrency((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm text-terracotta p-1"
                        onClick={() => {
                          if (editItems.length <= 1) {
                            alert('La venta debe conservar al menos 1 ítem. Si deseas anular toda la venta, usa el botón Eliminar o Anular.');
                            return;
                          }
                          setEditItems(editItems.filter((_, i) => i !== idx));
                        }}
                        title="Quitar producto de la venta"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="form-field">
                <label className="text-xs font-semibold text-text-dark mb-1 block">Descuento ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input text-xs"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-field">
                <label className="text-xs font-semibold text-text-dark mb-1 block">Costo Envío ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input text-xs"
                  value={editDeliveryFee}
                  onChange={(e) => setEditDeliveryFee(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-field flex items-end">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded border bg-green-50/70 border-green-300 w-full text-xs font-bold text-green-900">
                  <input
                    type="checkbox"
                    checked={editIsVerified}
                    onChange={(e) => setEditIsVerified(e.target.checked)}
                  />
                  <span>✅ Marcar Venta como Verificada</span>
                </label>
              </div>
            </div>

            <div className="form-field">
              <label className="text-xs font-semibold text-text-dark mb-1 block">Notas / Motivo de Corrección</label>
              <textarea
                rows={2}
                className="input text-xs"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ej: Se corrigió cantidad de 2 a 1 unidad / cambio de medio de pago..."
              />
            </div>

            <div className="form-actions flex flex-wrap justify-between items-center gap-2 border-t pt-3">
              {isAdmin ? (
                <button
                  type="button"
                  className="btn btn-secondary text-terracotta text-xs flex items-center gap-1"
                  onClick={() => handleDeleteOrder(editingOrder)}
                >
                  <Trash2 size={14} /> Eliminar Venta y Revertir Stock
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingOrder(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateOrderFull.isPending}>
                  {updateOrderFull.isPending ? 'Guardando y Sincronizando...' : '💾 Guardar Corrección'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
