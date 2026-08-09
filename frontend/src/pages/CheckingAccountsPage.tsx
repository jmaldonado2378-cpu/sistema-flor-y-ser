import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  useAllCheckingAccounts, 
  useCheckingAccountSummary, 
  useCheckingAccountStatement, 
  useRegisterCollection, 
  useUpdateCreditLimit 
} from '../hooks/useCheckingAccounts';
import { useCustomers } from '../hooks/useCustomers';
import { Modal } from '../components/ui/Modal';
import { Customer } from '../api/customers';
import { CheckingAccountSummary } from '../api/checkingAccounts';
import { CreditCard, DollarSign, Users, AlertCircle, CheckCircle2, FileText, Settings, X } from 'lucide-react';

interface CheckingAccountsPageProps {
  onTabChange?: (tab: string) => void;
}

const collectionSchema = z.object({
  amount: z.coerce.number().min(0.01, 'El monto a cobrar debe ser mayor a 0'),
  description: z.string().min(1, 'Ingrese una descripción o comprobante de pago'),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

export const CheckingAccountsPage: React.FC<CheckingAccountsPageProps> = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isCreditLimitModalOpen, setIsCreditLimitModalOpen] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState<number>(50000);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: allAccounts, isLoading: isLoadingAccounts, isError: isErrorAccounts, refetch: refetchAccounts } = useAllCheckingAccounts();
  const { data: customerResult } = useCustomers();
  const customers: Customer[] = customerResult?.data || [];

  const { data: summary } = useCheckingAccountSummary(selectedCustomerId || undefined);
  const { data: statement, isLoading: isLoadingStatement } = useCheckingAccountStatement(selectedCustomerId || undefined);
  const registerCollection = useRegisterCollection(selectedCustomerId);
  const updateCreditLimit = useUpdateCreditLimit(selectedCustomerId);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      amount: 0,
      description: 'Pago a cuenta de saldo pendiente'
    }
  });

  const formatCurrency = (val?: number) => (val || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const accountsList: CheckingAccountSummary[] = Array.isArray(allAccounts) ? allAccounts : [];

  // KPIs globales
  const totalDebtorBalance = accountsList.reduce((sum, acc) => sum + (acc.currentBalance || acc.balance || 0), 0);
  const debtorsCount = accountsList.filter(acc => (acc.currentBalance || acc.balance || 0) > 0).length;
  const totalCreditLimit = accountsList.reduce((sum, acc) => sum + (acc.creditLimit || 50000), 0);

  const onRegisterCollection = (data: CollectionFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    registerCollection.mutate(data, {
      onSuccess: () => {
        setSuccessMsg('✅ Cobro registrado correctamente en la cuenta corriente.');
        setIsCollectionModalOpen(false);
        reset();
        refetchAccounts();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al registrar el cobro.');
      }
    });
  };

  const onUpdateCreditLimit = () => {
    setSuccessMsg(null);
    setErrorMsg(null);

    updateCreditLimit.mutate(newCreditLimit, {
      onSuccess: () => {
        setSuccessMsg('✅ Límite de crédito actualizado correctamente.');
        setIsCreditLimitModalOpen(false);
        refetchAccounts();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al actualizar el límite de crédito.');
      }
    });
  };

  const activeCustomerObj = customers.find(c => c.id === selectedCustomerId);
  const activeAccountObj = accountsList.find(a => a.customerId === selectedCustomerId);
  const activeCustomerName = summary?.customerName || (activeCustomerObj ? `${activeCustomerObj.firstName} ${activeCustomerObj.lastName}` : (activeAccountObj?.customerName || 'Cliente'));

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <CreditCard className="text-primary-sage" /> Cuenta Corriente de Clientes
          </h1>
          <p className="text-sm text-text-muted mt-1">Control global de saldos fiados, extractos de movimientos y cobros</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-dark">Ficha Cliente:</label>
          <select 
            value={selectedCustomerId} 
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="input"
            style={{ width: '260px' }}
          >
            <option value="">Todas las Cuentas...</option>
            {customers.map((c: Customer) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phoneWhatsapp || 'Sin TE'})</option>
            ))}
          </select>
        </div>
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
            <span className="text-sm font-medium text-text-muted">Total Saldo Deudor Pendiente</span>
            <DollarSign className="text-terracotta" size={20} />
          </div>
          <div className="text-2xl font-bold text-terracotta mt-2">
            {formatCurrency(totalDebtorBalance)}
          </div>
          <div className="text-xs text-text-muted mt-1">Suma acumulada a cobrar</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Clientes con Saldo Deudor</span>
            <Users className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-text-dark mt-2">
            {debtorsCount} <span className="text-sm font-normal text-text-muted">/ {accountsList.length} cuentas</span>
          </div>
          <div className="text-xs text-text-muted mt-1">Clientes con fiado activo</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Crédito Autorizado Total</span>
            <CreditCard className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-primary-sage mt-2">
            {formatCurrency(totalCreditLimit)}
          </div>
          <div className="text-xs text-text-muted mt-1">Límite de fiado total otorgado</div>
        </div>
      </div>

      {/* Ficha / Extracto Individual Seleccionado */}
      {selectedCustomerId && (
        <div className="card mb-6 border-2 border-primary-sage">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
                <FileText className="text-primary-sage" size={18} /> Ficha de Cuenta Corriente: {activeCustomerName}
              </h3>
              <p className="text-xs text-text-muted">Teléfono / WA: {summary?.phoneWhatsapp || activeCustomerObj?.phoneWhatsapp || activeAccountObj?.phoneWhatsapp || '-'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsCollectionModalOpen(true)} className="btn btn-primary btn-sm flex items-center gap-1">
                <DollarSign size={15} /> Registrar Cobro
              </button>
              <button onClick={() => { setNewCreditLimit(summary?.creditLimit || 50000); setIsCreditLimitModalOpen(true); }} className="btn btn-secondary btn-sm flex items-center gap-1">
                <Settings size={15} /> Límite
              </button>
              <button onClick={() => setSelectedCustomerId('')} className="btn btn-secondary btn-sm text-text-muted" title="Cerrar Ficha">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-bg-linen p-3 rounded">
            <div>
              <div className="text-xs text-text-muted">Saldo Deudor Actual</div>
              <div className="text-xl font-bold text-terracotta">{formatCurrency(summary?.currentBalance || summary?.balance || 0)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Límite Autorizado</div>
              <div className="text-xl font-bold text-text-dark">{formatCurrency(summary?.creditLimit || 50000)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Crédito Disponible</div>
              <div className="text-xl font-bold text-primary-sage">{formatCurrency(summary?.availableCredit || 50000)}</div>
            </div>
          </div>

          <h4 className="font-semibold text-sm text-text-dark mb-3">Historial de Movimientos y Pagos</h4>
          {isLoadingStatement ? (
            <div className="py-6 text-center text-text-muted">Cargando movimientos...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th className="text-right">Monto</th>
                    <th className="text-right">Saldo Resultante</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(statement) && statement.map((item: any) => {
                    const dateStr = item.date || item.createdAt || item.fecha;
                    const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString('es-AR') : '-';
                    const isDebit = item.type === 'DEBIT' || item.movementType === 'DEBIT' || item.tipoMovimiento === 'DEBIT';
                    const amountVal = item.amount || item.monto || 0;
                    const balanceVal = item.balance || item.balanceAfter || item.saldoPosterior || 0;

                    return (
                      <tr key={item.id}>
                        <td>{dateFormatted}</td>
                        <td>
                          <span className={`badge ${isDebit ? 'terracotta' : 'green'} text-xs font-semibold`}>
                            {isDebit ? 'DÉBITO (COMPRA)' : 'CRÉDITO (PAGO)'}
                          </span>
                        </td>
                        <td className="text-sm font-medium">{item.description || item.descripcion}</td>
                        <td className={`text-right font-semibold ${isDebit ? 'text-terracotta' : 'text-primary-sage'}`}>
                          {isDebit ? `+ ${formatCurrency(amountVal)}` : `- ${formatCurrency(amountVal)}`}
                        </td>
                        <td className="text-right font-bold text-text-dark">
                          {formatCurrency(balanceVal)}
                        </td>
                      </tr>
                    );
                  })}
                  {(!statement || statement.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-text-muted">No se registraron movimientos en esta cuenta corriente</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabla Principal: Listado General de Cuentas Corrientes */}
      <div className="card">
        <div className="card-header mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-text-dark">Listado General de Cuentas Corrientes</h2>
          <span className="badge gray text-xs font-semibold">{accountsList.length} cuentas registradas</span>
        </div>

        {isLoadingAccounts ? (
          <div className="py-8 text-center text-text-muted">Cargando cuentas corrientes...</div>
        ) : isErrorAccounts ? (
          <div className="py-8 text-center text-terracotta">
            Error al cargar el listado de cuentas corrientes.{' '}
            <button onClick={() => refetchAccounts()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th className="text-right">Saldo Deudor</th>
                  <th className="text-right">Límite Crédito</th>
                  <th className="text-right">Disponible</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accountsList.map((account) => {
                  const balance = account.currentBalance !== undefined ? account.currentBalance : (account.balance || 0);
                  const creditLimit = account.creditLimit || 50000;
                  const available = account.availableCredit !== undefined ? account.availableCredit : (creditLimit - balance);
                  const hasDebt = balance > 0;

                  return (
                    <tr key={account.customerId} className={selectedCustomerId === account.customerId ? 'bg-bg-linen' : ''}>
                      <td className="font-semibold text-text-dark">{account.customerName}</td>
                      <td className="text-sm text-text-muted">{account.phoneWhatsapp || '-'}</td>
                      <td className={`text-right font-bold ${hasDebt ? 'text-terracotta' : 'text-text-dark'}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td className="text-right font-medium text-text-dark">{formatCurrency(creditLimit)}</td>
                      <td className="text-right font-semibold text-primary-sage">{formatCurrency(available)}</td>
                      <td className="text-center">
                        <span className={`badge ${hasDebt ? 'terracotta' : 'green'} text-xs font-semibold`}>
                          {hasDebt ? 'CON DEUDA' : 'AL DÍA'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedCustomerId(account.customerId)}
                            className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
                            title="Ver extracto de movimientos"
                          >
                            <FileText size={14} /> Extracto
                          </button>

                          <button
                            onClick={() => { setSelectedCustomerId(account.customerId); setIsCollectionModalOpen(true); }}
                            className="btn btn-primary btn-sm text-xs flex items-center gap-1"
                            title="Registrar pago / cobro"
                          >
                            <DollarSign size={14} /> Cobrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {accountsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-text-muted">No se registraron cuentas corrientes de clientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Cobro */}
      <Modal isOpen={isCollectionModalOpen} onClose={() => setIsCollectionModalOpen(false)} title="💵 Registrar Cobro de Cuenta Corriente">
        <form onSubmit={handleSubmit(onRegisterCollection)} className="flex flex-col gap-4">
          <div className="p-3 bg-bg-linen rounded border text-sm">
            Cliente: <strong>{activeCustomerName}</strong>
          </div>

          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Monto a Cobrar ($) *</label>
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
            <label className="text-sm font-medium text-text-dark mb-1 block">Descripción / Detalle del Pago *</label>
            <input 
              type="text" 
              placeholder="Ej: Pago de saldo en efectivo / Transferencia recibida" 
              className={`input ${errors.description ? 'has-error' : ''}`}
              {...register('description')} 
            />
            {errors.description && <span className="field-error">{errors.description.message}</span>}
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" onClick={() => setIsCollectionModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={registerCollection.isPending}>
              {registerCollection.isPending ? 'Guardando...' : 'Confirmar Cobro'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Límite de Crédito */}
      <Modal isOpen={isCreditLimitModalOpen} onClose={() => setIsCreditLimitModalOpen(false)} title="⚙️ Actualizar Límite de Crédito">
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-bg-linen rounded border text-sm">
            Cliente: <strong>{activeCustomerName}</strong>
          </div>

          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Nuevo Límite de Crédito ($) *</label>
            <input 
              type="number" 
              step="1000" 
              className="input"
              value={newCreditLimit} 
              onChange={(e) => setNewCreditLimit(Number(e.target.value))} 
            />
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" onClick={() => setIsCreditLimitModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="button" onClick={onUpdateCreditLimit} className="btn btn-primary" disabled={updateCreditLimit.isPending}>
              {updateCreditLimit.isPending ? 'Guardando...' : 'Actualizar Límite'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
