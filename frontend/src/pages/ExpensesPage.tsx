import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { useExpensesList, useExpenseSummary, useRegisterExpense, useDeleteExpense } from '../hooks/useExpenses';
import { Modal } from '../components/ui/Modal';
import { ExpenseCategorySummary } from '../api/expenses';

interface ExpensesPageProps {
  onTabChange?: (tab: string) => void;
}

const expenseSchema = z.object({
  category: z.string().min(1, 'La categoría es requerida'),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  paymentMethod: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const CATEGORIES_LABEL_MAP: Record<string, string> = {
  SERVICIOS: 'Servicios (Luz / Agua / Internet)',
  ALQUILER: 'Alquiler & Expensas',
  SUELDOS: 'Sueldos & Honorarios',
  LOGISTICA: 'Empaques y Logística',
  MARKETING: 'Publicidad y Marketing Digital',
  MANTENIMIENTO: 'Mantenimiento Depósito / Local',
  IMPUESTOS: 'Impuestos y Tasas',
  OTROS: 'Varios / Otros'
};

export const ExpensesPage: React.FC<ExpensesPageProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: expensesList, isLoading: loadingList, isError: errorList, refetch: refetchList } = useExpensesList();
  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useExpenseSummary();
  const registerExpense = useRegisterExpense();
  const deleteExpense = useDeleteExpense();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'SERVICIOS',
      description: '',
      amount: 0,
      paymentMethod: 'EFECTIVO'
    }
  });

  const formatCurrency = (val?: number) => (val || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const onSubmit = (data: ExpenseFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    registerExpense.mutate(data, {
      onSuccess: () => {
        setSuccessMsg('✅ Gasto operativo registrado exitosamente.');
        setIsModalOpen(false);
        reset({
          category: 'SERVICIOS',
          description: '',
          amount: 0,
          paymentMethod: 'EFECTIVO'
        });
        refetchList();
        refetchSummary();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al registrar el gasto operativo.');
      }
    });
  };

  const totalExpenseAmount = summary?.totalExpenseAmount || 0;
  const categoriesSummary: ExpenseCategorySummary[] = summary?.byCategory || [];
  const expenses: any[] = Array.isArray(expensesList) ? expensesList : [];

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <DollarSign className="text-primary-sage" /> Gastos Operativos & Estructura
          </h1>
          <p className="text-sm text-text-muted mt-1">Imputación de egresos, gastos fijos/variables y análisis mensual</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nuevo Gasto
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

      {loadingList || loadingSummary ? (
        <div className="card text-center py-8 text-text-muted">Cargando desglose de gastos...</div>
      ) : errorList ? (
        <div className="card text-center py-8 text-terracotta">
          Error al cargar desglose de gastos.{' '}
          <button onClick={() => { refetchList(); refetchSummary(); }} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-text-dark mb-2">Total de Egresos del Mes</h3>
              <div className="text-3xl font-bold text-terracotta mt-2">
                {formatCurrency(totalExpenseAmount)}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-text-dark mb-2">Egresos por Categoría</h3>
              <div className="flex flex-col gap-2 mt-2">
                {categoriesSummary.filter(cat => cat.totalAmount > 0).map(cat => (
                  <div key={cat.category} className="flex justify-between items-center text-sm border-b py-1">
                    <span className="text-text-muted font-medium">
                      {cat.categoryName || CATEGORIES_LABEL_MAP[cat.category] || cat.category}
                    </span>
                    <span className="font-semibold text-text-dark">
                      {formatCurrency(cat.totalAmount)} ({cat.percentageOfTotal}%)
                    </span>
                  </div>
                ))}
                {categoriesSummary.every(cat => cat.totalAmount === 0) && (
                  <div className="text-sm text-text-muted">Sin categorías registradas este mes</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-text-dark">Listado de Gastos Registrados</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th className="text-right">Monto Egresado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((item) => {
                    const dateVal = item.expenseDate || item.date || item.createdAt;
                    const dateFormatted = dateVal ? new Date(dateVal).toLocaleDateString('es-AR') : '-';

                    return (
                      <tr key={item.id}>
                        <td>{dateFormatted}</td>
                        <td>
                          <span className="badge gray text-xs font-semibold">
                            {CATEGORIES_LABEL_MAP[item.category] || item.category || 'GENERAL'}
                          </span>
                        </td>
                        <td className="font-medium text-text-dark">{item.description}</td>
                        <td className="text-right font-semibold text-terracotta">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="text-center">
                          <button 
                            onClick={() => deleteExpense.mutate(item.id, { onSuccess: () => { refetchList(); refetchSummary(); } })} 
                            className="btn btn-secondary btn-sm text-terracotta"
                            title="Eliminar Gasto"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-text-muted">No se registraron gastos en el período</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Registrar Nuevo Gasto */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="💸 Registrar Nuevo Gasto Operativo">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Categoría del Gasto *</label>
            <select {...register('category')} className={`input ${errors.category ? 'has-error' : ''}`}>
              <option value="SERVICIOS">Servicios (Luz / Agua / Internet)</option>
              <option value="ALQUILER">Alquiler & Expensas</option>
              <option value="SUELDOS">Sueldos & Honorarios</option>
              <option value="LOGISTICA">Insumos de Empaque / Bolsas / Logística</option>
              <option value="MARKETING">Publicidad & Marketing Digital</option>
              <option value="MANTENIMIENTO">Mantenimiento Depósito / Local</option>
              <option value="IMPUESTOS">Impuestos y Tasas Municipales</option>
              <option value="OTROS">Varios / Otros</option>
            </select>
            {errors.category && <span className="field-error">{errors.category.message}</span>}
          </div>

          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Descripción / Concepto *</label>
            <input 
              type="text" 
              placeholder="Ej: Telefonía móvil / Factura de electricidad"
              className={`input ${errors.description ? 'has-error' : ''}`}
              {...register('description')} 
            />
            {errors.description && <span className="field-error">{errors.description.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Monto Egresado ($) *</label>
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
              <select {...register('paymentMethod')} className="input">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
              </select>
            </div>
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={registerExpense.isPending}>
              {registerExpense.isPending ? 'Guardando...' : 'Confirmar Gasto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
