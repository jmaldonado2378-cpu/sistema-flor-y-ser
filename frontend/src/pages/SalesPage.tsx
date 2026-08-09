import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCustomers, useSales, useCreateOrder } from '../hooks';
import { useFinalProducts } from '../hooks/useInventory';
import { Customer } from '../api/customers';
import { Order } from '../api/sales';

interface SalesPageProps {
  onTabChange?: (tab: string) => void;
}

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Seleccione un producto'),
  productName: z.string().min(1, 'Nombre de producto requerido'),
  quantity: z.number().min(1, 'Mínimo 1 unidad'),
  unitPrice: z.number().min(0, 'El precio debe ser >= 0')
});

const saleSchema = z.object({
  customerId: z.string().min(1, 'Seleccione un cliente'),
  channel: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'Agregue al menos un producto al pedido'),
  discount: z.number().min(0).optional(),
  shippingFee: z.number().min(0).optional(),
  paymentMethod: z.string().min(1, 'Seleccione método de pago')
});

type SaleFormValues = z.infer<typeof saleSchema>;

export const SalesPage: React.FC<SalesPageProps> = () => {
  const { data: customerResult } = useCustomers();
  const { data: salesResult, isLoading: loadingOrders, refetch: refetchSales } = useSales();
  const { data: finalProducts } = useFinalProducts();
  const createOrder = useCreateOrder();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const customers: Customer[] = customerResult?.data || [];

  const recentOrders: Order[] = Array.isArray(salesResult) 
    ? salesResult 
    : (salesResult?.data || (salesResult as any)?.orders || []);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: '',
      channel: 'LOCAL',
      items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
      discount: 0,
      shippingFee: 0,
      paymentMethod: 'Efectivo'
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

    createOrder.mutate({
      customerId: data.customerId,
      customerName,
      channel: data.channel || 'LOCAL',
      items: data.items,
      totalAmount: total,
      paymentMethod: data.paymentMethod,
    }, {
      onSuccess: () => {
        setSuccessMsg(`✅ Venta registrada exitosamente para ${customerName}.`);
        refetchSales();
        reset({
          customerId: '',
          channel: 'LOCAL',
          items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
          discount: 0,
          shippingFee: 0,
          paymentMethod: 'Efectivo'
        });
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al procesar la venta. Verifique los datos ingresados.');
      }
    });
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Ítems del Pedido *</label>
              
              <div className="flex flex-col gap-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-bg-linen rounded border">
                    <div className="col-span-7">
                      <select 
                        className="input text-xs"
                        {...register(`items.${index}.productId` as const)}
                        onChange={(e) => {
                          const product = catalogProducts.find(p => p.id === e.target.value);
                          if (product) {
                            setValue(`items.${index}.productId`, product.id);
                            setValue(`items.${index}.productName`, product.name);
                            setValue(`items.${index}.unitPrice`, product.price);
                          } else {
                            setValue(`items.${index}.productId`, '');
                            setValue(`items.${index}.productName`, '');
                            setValue(`items.${index}.unitPrice`, 0);
                          }
                        }}
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
                <label className="text-sm font-medium text-text-dark mb-1 block">Método de Pago *</label>
                <select className="input" {...register('paymentMethod')}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Cuenta Corriente">Cuenta Corriente (Fiado)</option>
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
              <div className="flex flex-col gap-2">
                {recentOrders.slice(0, 8).map((order: Order) => {
                  const cust = customers.find((c: Customer) => c.id === order.customerId);
                  const custName = order.customerName || (cust ? `${cust.firstName} ${cust.lastName}` : 'Cliente Registrado');
                  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') : '-';

                  return (
                    <div key={order.id} className="p-3 border rounded bg-bg-linen flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-text-dark">{custName}</span>
                        <span className="font-bold text-sm text-primary-sage">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>{order.paymentMethod || 'Efectivo'}</span>
                        <span>{dateStr}</span>
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
    </div>
  );
};
