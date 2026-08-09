import React from 'react';
import { useSalesKanbanBoard, useUpdateOrderStatus } from '../hooks/useOrders';
import { useCustomers } from '../hooks/useCustomers';
import { Customer } from '../api/customers';
import { Clock, PackageCheck, Truck, CheckCircle2, ChevronRight } from 'lucide-react';

interface OrdersKanbanPageProps {
  onTabChange?: (tab: string) => void;
}

const COLUMN_CONFIGS = [
  { id: 'RECEIVED', key: 'RECEIVED', title: '📥 Pendiente / Recibido', nextStatus: 'IN_PREPARATION', nextLabel: 'Comenzar Preparación', badgeClass: 'gray' },
  { id: 'IN_PREPARATION', key: 'IN_PREPARATION', title: '⏳ En Preparación', nextStatus: 'READY_FOR_DELIVERY', nextLabel: 'Marcar Listo', badgeClass: 'terracotta' },
  { id: 'READY_FOR_DELIVERY', key: 'READY_FOR_DELIVERY', title: '📦 Listo para Despacho', nextStatus: 'IN_DELIVERY', nextLabel: 'Despachar / Enviar', badgeClass: 'green' },
  { id: 'IN_DELIVERY', key: 'IN_DELIVERY', title: '🚚 En Camino / Reparto', nextStatus: 'DELIVERED', nextLabel: 'Marcar Entregado', badgeClass: 'green' },
  { id: 'DELIVERED', key: 'DELIVERED', title: '✅ Entregado', nextStatus: null, nextLabel: null, badgeClass: 'green' },
];

export const OrdersKanbanPage: React.FC<OrdersKanbanPageProps> = () => {
  const { data: boardData, isLoading, isError, refetch } = useSalesKanbanBoard();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const { data: customerResult } = useCustomers();
  const customers: Customer[] = customerResult?.data || [];

  const formatCurrency = (val?: number) => (val || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  // Normalize boardData into columns
  const normalizeColumns = () => {
    if (!boardData) return [];

    // Case 1: Backend returns array of columns [ { id, title, items }, ... ]
    if (Array.isArray(boardData)) {
      return COLUMN_CONFIGS.map(cfg => {
        const foundCol = boardData.find((c: any) => c.id === cfg.id || c.title === cfg.title);
        return {
          ...cfg,
          items: foundCol?.items || []
        };
      });
    }

    // Case 2: Backend returns object { RECEIVED: [...], IN_PREPARATION: [...], ... }
    return COLUMN_CONFIGS.map(cfg => {
      const items = boardData[cfg.key] || boardData[cfg.id] || [];
      return {
        ...cfg,
        items
      };
    });
  };

  const columns = normalizeColumns();

  return (
    <div className="page-container">
      <div className="page-header mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Kanban de Estado de Pedidos</h1>
          <p className="text-sm text-text-muted mt-1">
            Seguimiento visual del flujo de despacho: desde la recepción de la venta hasta la entrega al cliente
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="card text-center py-12 text-text-muted">Cargando tablero kanban de ventas...</div>
      ) : isError ? (
        <div className="card text-center py-12 text-terracotta">
          Error al consultar el tablero de pedidos.{' '}
          <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {columns.map((column) => (
            <div key={column.id} className="card min-w-[300px] max-w-[340px] flex-shrink-0 flex flex-col bg-bg-linen border p-0 overflow-hidden">
              <div className="p-3 bg-white border-b flex justify-between items-center">
                <h2 className="text-sm font-bold text-text-dark">{column.title}</h2>
                <span className="badge gray text-xs font-semibold">{column.items.length}</span>
              </div>

              <div className="p-3 flex flex-col gap-3 flex-grow overflow-y-auto" style={{ minHeight: '380px', maxHeight: '650px' }}>
                {column.items.map((item: any) => {
                  const cust = customers.find((c) => c.id === item.customerId);
                  const custName = item.customerName || (cust ? `${cust.firstName} ${cust.lastName}` : 'Cliente Mostrador');
                  const orderNum = item.orderNumber || `PED-${(item.id || '').slice(0, 6)}`;
                  const dateFormatted = item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-AR') : '-';

                  return (
                    <div key={item.id} className="card p-3 border bg-white shadow-sm hover:shadow transition">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-xs text-primary-sage">{orderNum}</span>
                        <span className="text-xs text-text-muted">{dateFormatted}</span>
                      </div>

                      <div className="text-sm font-semibold text-text-dark mb-1">{custName}</div>
                      
                      {item.channel && (
                        <div className="text-xs text-text-muted mb-2">
                          Canal: <span className="font-medium text-text-dark">{item.channel}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t mt-2">
                        <span className="text-xs text-text-muted">Total Venta</span>
                        <span className="text-md font-bold text-primary-sage">
                          {formatCurrency(item.totalAmount)}
                        </span>
                      </div>

                      {column.nextStatus && (
                        <button 
                          onClick={() => updateStatus({ id: item.id, status: column.nextStatus! }, { onSuccess: () => refetch() })} 
                          disabled={isUpdating}
                          className="btn btn-primary btn-sm mt-3 w-full flex items-center justify-center gap-1 text-xs"
                        >
                          <span>{column.nextLabel}</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {column.items.length === 0 && (
                  <div className="py-12 text-center text-xs text-text-muted">
                    Sin pedidos en este estado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
