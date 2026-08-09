import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAccountsPayableCalendar, useRegisterSupplierPayment } from '../hooks/useAccountsPayable';
import { useSuppliers } from '../hooks/useSuppliers';
import { Modal } from '../components/ui/Modal';
import { AccountsPayableCalendarItem } from '../api/accountsPayable';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface AccountsPayablePageProps {
  onTabChange?: (tab: string) => void;
}

const paymentSchema = z.object({
  receiptId: z.string().optional(),
  supplierId: z.string().min(1, 'El proveedor es requerido'),
  amount: z.coerce.number().min(0.01, 'El monto es requerido y debe ser mayor a 0'),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export const AccountsPayablePage: React.FC<AccountsPayablePageProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: response, isLoading, isError, refetch } = useAccountsPayableCalendar();
  const { data: suppliers } = useSuppliers();
  const registerPayment = useRegisterSupplierPayment();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      receiptId: '',
      supplierId: '',
      amount: 0,
      paymentMethod: 'TRANSFERENCIA',
      referenceNumber: '',
      notes: ''
    }
  });

  const formatCurrency = (val?: number) => (val || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const calendarItems: AccountsPayableCalendarItem[] = response?.calendar || [];
  const summary = response?.summary;

  const supplierList = Array.isArray(suppliers) ? suppliers : [];
  const selectedReceiptId = watch('receiptId');

  const onSubmit = (data: PaymentFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    registerPayment.mutate(data, {
      onSuccess: () => {
        setSuccessMsg('✅ Pago a proveedor registrado exitosamente en la cuenta corriente.');
        setIsModalOpen(false);
        reset();
        refetch();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al registrar el pago a proveedor.');
      }
    });
  };

  const getUrgencyBadge = (urgency?: string, status?: string) => {
    if (status === 'OVERDUE' || urgency === 'VENCIDO') {
      return <span className="badge terracotta text-xs font-semibold">⚠️ VENCIDO</span>;
    }
    if (urgency === 'CRITICO') {
      return <span className="badge terracotta text-xs font-semibold">🔥 CRÍTICO</span>;
    }
    if (urgency === 'PROXIMO') {
      return <span className="badge gray text-xs font-semibold">⏳ PRÓXIMO</span>;
    }
    if (status === 'PAID') {
      return <span className="badge green text-xs font-semibold">✅ PAGADO</span>;
    }
    return <span className="badge gray text-xs font-semibold">PENDIENTE</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <CreditCard className="text-primary-sage" /> Cuentas por Pagar a Proveedores
          </h1>
          <p className="text-sm text-text-muted mt-1">Calendario de vencimientos, facturas de compras registradas e historial de pagos</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <DollarSign size={16} />
          Registrar Pago a Proveedor
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 text-green-800 text-sm rounded mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 text-terracotta text-sm rounded mb-4 flex items-center gap-2">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Total Cuentas por Pagar</span>
            <DollarSign className="text-terracotta" size={20} />
          </div>
          <div className="text-2xl font-bold text-terracotta mt-2">
            {formatCurrency(summary?.totalGlobalAccountsPayable)}
          </div>
          <div className="text-xs text-text-muted mt-1">Saldo total pendiente con proveedores</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Deuda Vencida</span>
            <AlertTriangle className="text-terracotta" size={20} />
          </div>
          <div className="text-2xl font-bold text-terracotta mt-2">
            {formatCurrency(summary?.totalOverdueAmount)}
          </div>
          <div className="text-xs text-text-muted mt-1">{summary?.totalOverdueReceiptsCount || 0} comprobantes vencidos</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Vencimientos Próximos (7 días)</span>
            <CreditCard className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-text-dark mt-2">
            {formatCurrency(summary?.totalDueNext7DaysAmount)}
          </div>
          <div className="text-xs text-text-muted mt-1">Pagos a cubrir en la semana</div>
        </div>
      </div>
      
      {/* Tabla del Calendario de Vencimientos */}
      <div className="card">
        <div className="card-header mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-text-dark">Calendario de Vencimientos y Facturas de Compra</h2>
          <span className="badge gray text-xs font-semibold">{calendarItems.length} comprobantes</span>
        </div>
        
        {isLoading ? (
          <div className="py-8 text-center text-text-muted">Cargando cuentas por pagar...</div>
        ) : isError ? (
          <div className="py-8 text-center text-terracotta">
            Error al consultar el calendario de vencimientos.{' '}
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>N° Comprobante</th>
                  <th>Proveedor</th>
                  <th>Fecha Emisión</th>
                  <th>Vencimiento</th>
                  <th className="text-right">Monto Total</th>
                  <th className="text-right">Saldo Pendiente</th>
                  <th className="text-center">Urgencia / Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {calendarItems.map((item) => {
                  const receiptNum = item.receiptNumber || item.receiptId || '-';
                  const issueDateFormatted = item.issueDate ? new Date(item.issueDate).toLocaleDateString('es-AR') : '-';
                  const dueDateFormatted = item.dueDate ? new Date(item.dueDate).toLocaleDateString('es-AR') : '-';
                  const totalAmt = item.totalAmount !== undefined ? item.totalAmount : (item.amount || 0);
                  const pendingAmt = item.pendingBalance !== undefined ? item.pendingBalance : totalAmt;

                  return (
                    <tr key={item.receiptId || item.id || receiptNum}>
                      <td className="font-semibold text-text-dark">{receiptNum}</td>
                      <td className="font-medium">{item.supplierName}</td>
                      <td className="text-sm text-text-muted">{issueDateFormatted}</td>
                      <td className="text-sm font-semibold">{dueDateFormatted}</td>
                      <td className="text-right font-medium">{formatCurrency(totalAmt)}</td>
                      <td className="text-right font-bold text-terracotta">
                        {formatCurrency(pendingAmt)}
                      </td>
                      <td className="text-center">
                        {getUrgencyBadge(item.urgency, item.status)}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            setValue('receiptId', item.receiptId || item.id || '');
                            setValue('supplierId', item.supplierId);
                            setValue('amount', pendingAmt);
                            setIsModalOpen(true);
                          }}
                          className="btn btn-primary btn-sm text-xs flex items-center gap-1 mx-auto"
                        >
                          <DollarSign size={14} /> Pagar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {calendarItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-text-muted">No hay facturas ni pagos próximos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Pago */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="💳 Registrar Pago a Proveedor">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Factura / Comprobante de Recepción (Opcional)</label>
            <select 
              className="input"
              {...register('receiptId')}
              onChange={(e) => {
                const recId = e.target.value;
                setValue('receiptId', recId);
                const rec = calendarItems.find(i => (i.receiptId || i.id) === recId);
                if (rec) {
                  setValue('supplierId', rec.supplierId);
                  setValue('amount', rec.pendingBalance !== undefined ? rec.pendingBalance : (rec.totalAmount || 0));
                }
              }}
            >
              <option value="">Seleccionar comprobante pendiente...</option>
              {calendarItems.map((item) => (
                <option key={item.receiptId || item.id} value={item.receiptId || item.id}>
                  {item.receiptNumber || item.receiptId} - {item.supplierName} ({formatCurrency(item.pendingBalance || item.totalAmount)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Proveedor Maestro *</label>
            <select className={`input ${errors.supplierId ? 'has-error' : ''}`} {...register('supplierId')}>
              <option value="">Seleccione un proveedor...</option>
              {supplierList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name || s.businessName}</option>
              ))}
            </select>
            {errors.supplierId && <span className="field-error">{errors.supplierId.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Monto Abonado ($) *</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                className={`input ${errors.amount ? 'has-error' : ''}`}
                {...register('amount')} 
              />
              {errors.amount && <span className="field-error">{errors.amount.message}</span>}
            </div>

            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Método de Pago</label>
              <select className="input" {...register('paymentMethod')}>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">N° Comprobante / Referencia de Pago</label>
            <input 
              type="text" 
              placeholder="Ej: N° Transferencia 8849201" 
              className="input"
              {...register('referenceNumber')} 
            />
          </div>

          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Notas / Observaciones</label>
            <textarea className="input" {...register('notes')} placeholder="Detalles de la operación..." rows={2}></textarea>
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={registerPayment.isPending}>
              {registerPayment.isPending ? 'Guardando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
