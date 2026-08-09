import React, { useMemo } from 'react';
import { ShoppingCart, DollarSign, CheckSquare, Truck, UserPlus, TrendingUp, Users, Package, AlertTriangle } from 'lucide-react';
import { useSales, useCustomers } from '../hooks';
import { Order } from '../api/sales';

interface DashboardPageProps {
  onTabChange: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onTabChange }) => {
  const { data: salesResult, isLoading: isLoadingSales, isError: isErrorSales } = useSales();
  const { data: customerResult, isLoading: isLoadingCustomers, isError: isErrorCustomers } = useCustomers();

  const orders: Order[] = salesResult?.data || [];
  const customers = customerResult?.data || [];

  const totalSales = useMemo(() => {
    return orders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0);
  }, [orders]);

  const salesGoal = 1200000;
  const salesProgress = Math.min((totalSales / salesGoal) * 100, 100);

  const averageTicket = useMemo(() => {
    if (orders.length === 0) return 0;
    return totalSales / orders.length;
  }, [orders, totalSales]);

  const ticketGoal = 15000;
  const ticketProgress = Math.min((averageTicket / ticketGoal) * 100, 100);

  const totalCustomers = customers.length;
  const totalInventoryValue = 1485200;

  // Placeholder channel distribution
  const channels = [
    { name: 'WhatsApp', percentage: 52.6, color: 'var(--primary-sage)' },
    { name: 'Local', percentage: 30.7, color: 'var(--terracotta)' },
    { name: 'Tienda Online', percentage: 16.7, color: 'var(--text-muted)' }
  ];

  // Placeholder stock alerts
  const stockAlerts = [
    { id: 1, product: 'Almendras Nonpareil', currentStock: 2, minStock: 5 },
    { id: 2, product: 'Harina de Almendras', currentStock: 0, minStock: 10 },
    { id: 3, product: 'Aceite de Coco Neutro', currentStock: 1, minStock: 3 }
  ];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  return (
    <div className="page-container">
      <header className="page-header mb-6">
        <h1 className="text-xl font-serif text-text-dark">Dashboard General & Centro de Control</h1>
      </header>

      <section className="card mb-6">
        <h2 className="text-md font-semibold text-text-dark mb-4">Acciones Rápidas</h2>
        <div className="flex gap-3 flex-wrap">
          <button className="btn btn-primary flex items-center gap-2" onClick={() => onTabChange('tab-sales')}>
            <ShoppingCart size={18} /> Nueva Venta
          </button>
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => onTabChange('tab-finance-customers')}>
            <DollarSign size={18} /> Registrar Cobro
          </button>
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => onTabChange('tab-kanban-tasks')}>
            <CheckSquare size={18} /> Nueva Tarea
          </button>
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => onTabChange('tab-goods-receipt')}>
            <Truck size={18} /> Recepción Mercadería
          </button>
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => onTabChange('tab-crm')}>
            <UserPlus size={18} /> Nuevo Cliente
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-text-muted">Ventas del Mes</h3>
            <TrendingUp size={20} className="text-primary-sage" />
          </div>
          {isLoadingSales ? <div className="text-sm text-text-muted">Cargando...</div> : isErrorSales ? <div className="text-sm text-terracotta">Error</div> : (
            <>
              <div className="text-2xl font-bold text-text-dark">{formatCurrency(totalSales)}</div>
              <div className="mt-3 w-full bg-bg-linen rounded-full h-2">
                <div className="bg-primary-sage h-2 rounded-full" style={{ width: `${salesProgress}%` }}></div>
              </div>
              <div className="text-xs text-text-muted mt-2">Meta: {formatCurrency(salesGoal)}</div>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-text-muted">Ticket Promedio</h3>
            <ShoppingCart size={20} className="text-primary-sage" />
          </div>
          {isLoadingSales ? <div className="text-sm text-text-muted">Cargando...</div> : isErrorSales ? <div className="text-sm text-terracotta">Error</div> : (
            <>
              <div className="text-2xl font-bold text-text-dark">{formatCurrency(averageTicket)}</div>
              <div className="mt-3 w-full bg-bg-linen rounded-full h-2">
                <div className="bg-primary-sage h-2 rounded-full" style={{ width: `${ticketProgress}%` }}></div>
              </div>
              <div className="text-xs text-text-muted mt-2">Meta: {formatCurrency(ticketGoal)}</div>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-text-muted">Clientes Registrados</h3>
            <Users size={20} className="text-primary-sage" />
          </div>
          {isLoadingCustomers ? <div className="text-sm text-text-muted">Cargando...</div> : isErrorCustomers ? <div className="text-sm text-terracotta">Error</div> : (
            <div className="text-2xl font-bold text-text-dark">{totalCustomers}</div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-text-muted">Valor Total Inventario</h3>
            <Package size={20} className="text-primary-sage" />
          </div>
          <div className="text-2xl font-bold text-text-dark">{formatCurrency(totalInventoryValue)}</div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card">
          <h3 className="text-md font-semibold text-text-dark mb-4">Distribución por Canales</h3>
          <div className="flex flex-col gap-4">
            {channels.map(channel => (
              <div key={channel.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-dark font-medium">{channel.name}</span>
                  <span className="text-text-muted">{channel.percentage}%</span>
                </div>
                <div className="w-full bg-bg-linen rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${channel.percentage}%`, backgroundColor: channel.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-terracotta" />
            <h3 className="text-md font-semibold text-text-dark">Alertas de Stock</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-text-muted font-medium">Producto</th>
                <th className="text-right py-2 text-text-muted font-medium">Stock Actual</th>
                <th className="text-right py-2 text-text-muted font-medium">Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {stockAlerts.map(alert => (
                <tr key={alert.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 text-text-dark">{alert.product}</td>
                  <td className="py-3 text-right text-terracotta font-semibold">{alert.currentStock}</td>
                  <td className="py-3 text-text-muted">{alert.minStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};
