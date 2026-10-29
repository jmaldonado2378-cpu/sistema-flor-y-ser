import React, { useState } from 'react';
import { useSalesKanbanBoard, useUpdateOrderStatus } from '../hooks/useOrders';
import { useUpdateOrderDetails } from '../hooks/useSales';
import { useCustomers } from '../hooks/useCustomers';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/ui/Modal';
import { Customer } from '../api/customers';
import { formatPaymentMethodLabel, normalizePaymentMethodCode } from './SalesPage';
import { ChevronRight, ChevronLeft, Search, RotateCcw, Package, AlertCircle, Pencil, UserCheck } from 'lucide-react';

interface OrdersKanbanPageProps {
  onTabChange?: (tab: string) => void;
}

const COLUMN_CONFIGS = [
  { 
    id: 'RECEIVED', 
    key: 'RECEIVED', 
    title: '📥 Pendiente / Recibido', 
    prevStatus: null,
    prevLabel: null,
    nextStatus: 'IN_PREPARATION', 
    nextLabel: 'Preparar', 
    badgeClass: 'gray' 
  },
  { 
    id: 'IN_PREPARATION', 
    key: 'IN_PREPARATION', 
    title: '⏳ En Preparación', 
    prevStatus: 'RECEIVED',
    prevLabel: 'Pendiente',
    nextStatus: 'READY_FOR_DELIVERY', 
    nextLabel: 'Marcar Listo', 
    badgeClass: 'terracotta' 
  },
  { 
    id: 'READY_FOR_DELIVERY', 
    key: 'READY_FOR_DELIVERY', 
    title: '📦 Listo para Despacho', 
    prevStatus: 'IN_PREPARATION',
    prevLabel: 'Preparación',
    nextStatus: 'IN_DELIVERY', 
    nextLabel: 'Despachar', 
    badgeClass: 'terracotta' 
  },
  { 
    id: 'IN_DELIVERY', 
    key: 'IN_DELIVERY', 
    title: '🚚 En Reparto', 
    prevStatus: 'READY_FOR_DELIVERY',
    prevLabel: 'Despacho',
    nextStatus: 'DELIVERED', 
    nextLabel: 'Entregar', 
    badgeClass: 'green' 
  },
  { 
    id: 'DELIVERED', 
    key: 'DELIVERED', 
    title: '✅ Entregado', 
    prevStatus: 'IN_DELIVERY',
    prevLabel: 'Reparto',
    nextStatus: null, 
    nextLabel: null, 
    badgeClass: 'green' 
  },
];

export const OrdersKanbanPage: React.FC<OrdersKanbanPageProps> = () => {
  const { user: currentUser, users: systemUsers } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const activeSellers = (systemUsers || []).filter(u => u.active !== false);

  const { data: boardData, isLoading, isError, refetch } = useSalesKanbanBoard();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const updateOrderDetails = useUpdateOrderDetails();
  const { data: customerResult } = useCustomers();
  const customers: Customer[] = customerResult?.data || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editSellerId, setEditSellerId] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('EFECTIVO');
  const [editChannel, setEditChannel] = useState<string>('LOCAL');

  const formatCurrency = (val?: number) => (val || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const normalizeStatus = (status?: string): string => {
    if (!status) return 'RECEIVED';
    const s = status.toUpperCase().trim();
    if (s === 'PENDING' || s === 'RECEIVED') return 'RECEIVED';
    if (s === 'IN_PREPARATION' || s === 'PREPARING' || s === 'EN PREPARACIÓN') return 'IN_PREPARATION';
    if (s === 'READY_FOR_DELIVERY' || s === 'READY' || s === 'LISTO') return 'READY_FOR_DELIVERY';
    if (s === 'IN_DELIVERY' || s === 'REPARTO' || s === 'EN CAMINO') return 'IN_DELIVERY';
    if (s === 'DELIVERED' || s === 'ENTREGADO' || s === 'COMPLETED') return 'DELIVERED';
    return 'RECEIVED';
  };

  // Normaliza boardData sea array de columnas, array plano de pedidos u objeto agrupado
  const normalizeColumns = () => {
    if (!boardData) return COLUMN_CONFIGS.map(c => ({ ...c, items: [] }));

    let raw: any = boardData;
    if (raw && typeof raw === 'object' && 'data' in raw && raw.data !== null && (typeof raw.data === 'object' || Array.isArray(raw.data))) {
      raw = raw.data;
    }

    let allOrders: any[] = [];

    // Caso 1: Array de columnas [ { id, items: [...] }, ... ]
    if (Array.isArray(raw) && raw.length > 0 && Array.isArray((raw[0] as any)?.items)) {
      raw.forEach((col: any) => {
        if (Array.isArray(col.items)) {
          col.items.forEach((item: any) => {
            allOrders.push({
              ...item,
              status: item.status || col.id
            });
          });
        }
      });
    }
    // Caso 2: Array plano de pedidos [ { id, status, customerName }, ... ]
    else if (Array.isArray(raw)) {
      allOrders = [...raw];
    }
    // Caso 3: Objeto agrupado { RECEIVED: [...], IN_PREPARATION: [...], ... }
    else if (typeof raw === 'object' && raw !== null) {
      Object.entries(raw).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((item: any) => {
            allOrders.push({
              ...item,
              status: item.status || key
            });
          });
        }
      });
    }

    // Filtrar por término de búsqueda si existe
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      allOrders = allOrders.filter(o => 
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.channel && o.channel.toLowerCase().includes(q))
      );
    }

    return COLUMN_CONFIGS.map(cfg => {
      const colItems = allOrders.filter(o => normalizeStatus(o.status) === cfg.id);
      return {
        ...cfg,
        items: colItems
      };
    });
  };

  const columns = normalizeColumns();

  const handleMoveStatus = (orderId: string, targetStatus: string) => {
    updateStatus(
      { id: orderId, status: targetStatus },
      {
        onSuccess: () => refetch(),
        onError: (err: any) => {
          console.error('Error al actualizar estado:', err);
          alert(`No se pudo mover el pedido: ${err.message || 'Error en el servidor'}`);
        }
      }
    );
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    if (orderId) {
      handleMoveStatus(orderId, targetStatus);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="page-container">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <span>📦</span> Kanban de Despacho y Pedidos
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Flujo logístico: desde la venta hasta la preparación, despacho y entrega al cliente. Arrastra las tarjetas o usa los botones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por cliente o nro de pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 pr-3 py-1.5 text-xs w-64"
            />
          </div>

          <button onClick={() => refetch()} className="btn btn-secondary btn-sm flex items-center gap-1.5" title="Actualizar tablero">
            <RotateCcw size={14} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card text-center py-16 text-text-muted">Cargando tablero kanban de ventas y despacho...</div>
      ) : isError ? (
        <div className="card text-center py-12 text-terracotta">
          <AlertCircle size={32} className="mx-auto mb-2 text-terracotta" />
          <p className="font-semibold">Error al consultar el tablero de pedidos.</p>
          <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-3">Reintentar</button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {columns.map((column) => (
            <div 
              key={column.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="card min-w-[290px] max-w-[320px] flex-shrink-0 flex flex-col bg-bg-linen border p-0 overflow-hidden shadow-xs"
            >
              <div className="p-3 bg-white border-b flex justify-between items-center">
                <h2 className="text-xs font-bold text-text-dark uppercase tracking-wider">{column.title}</h2>
                <span className="badge gray text-xs font-semibold px-2 py-0.5 rounded-full">{column.items.length}</span>
              </div>

              <div className="p-3 flex flex-col gap-3 flex-grow overflow-y-auto" style={{ minHeight: '420px', maxHeight: '680px' }}>
                {column.items.map((item: any) => {
                  const cust = customers.find((c) => c.id === item.customerId);
                  const custName = item.customerName || (cust ? `${cust.firstName} ${cust.lastName}` : 'Cliente Mostrador');
                  const orderNum = item.orderNumber || `PED-${(item.id || '').slice(0, 6)}`;
                  const dateFormatted = item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-AR') : '-';
                  const isExpanded = expandedOrderId === item.id;

                  return (
                    <div 
                      key={item.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className="card p-3 border bg-white shadow-sm hover:shadow transition cursor-grab active:cursor-grabbing flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-primary-sage">{orderNum}</span>
                        <span className="text-[11px] text-text-muted">{dateFormatted}</span>
                      </div>

                      <div className="text-sm font-semibold text-text-dark">{custName}</div>
                      
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>Canal: <strong className="text-text-dark font-medium">{item.channel || 'LOCAL'}</strong></span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                          {formatPaymentMethodLabel(item.paymentMethod)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-gray-100">
                        <span className="flex items-center gap-1 truncate" title={item.sellerName || 'Sin vendedora asignada'}>
                          <UserCheck size={12} className="text-primary-sage flex-shrink-0" />
                          <span className="truncate font-medium text-text-dark">
                            {item.sellerName || activeSellers.find(u => u.id === item.sellerId)?.name || 'Sin vendedora'}
                          </span>
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrder(item);
                              setEditSellerId(item.sellerId || currentUser?.id || '');
                              setEditPaymentMethod(normalizePaymentMethodCode(item.paymentMethod));
                              setEditChannel(item.channel || 'LOCAL');
                            }}
                            className="text-[11px] text-primary-sage hover:underline flex items-center gap-0.5 font-semibold"
                            title="Modificar vendedora, medio de pago o canal"
                          >
                            <Pencil size={11} /> Editar
                          </button>
                        )}
                      </div>

                      {item.items && item.items.length > 0 && (
                        <div className="text-xs border-t pt-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : item.id)}
                            className="text-[11px] text-primary-sage font-medium hover:underline flex items-center gap-1"
                          >
                            <Package size={12} />
                            <span>{item.items.length} {item.items.length === 1 ? 'producto' : 'productos'} {isExpanded ? '▲' : '▼'}</span>
                          </button>
                          {isExpanded && (
                            <ul className="mt-1.5 pl-2 space-y-1 text-[11px] text-text-dark bg-slate-50 p-1.5 rounded">
                              {item.items.map((prod: any, pIdx: number) => (
                                <li key={pIdx} className="flex justify-between">
                                  <span>{prod.quantity}x {prod.productName || prod.name}</span>
                                  <span className="text-text-muted">{formatCurrency(prod.unitPrice * prod.quantity)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t mt-1">
                        <span className="text-xs text-text-muted">Total Venta</span>
                        <span className="text-sm font-bold text-primary-sage">
                          {formatCurrency(item.totalAmount)}
                        </span>
                      </div>

                      {/* Botones de cambio de estado (Avanzar y Retroceder) */}
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t">
                        {column.prevStatus && (
                          <button 
                            type="button"
                            onClick={() => handleMoveStatus(item.id, column.prevStatus!)} 
                            disabled={isUpdating}
                            title={`Mover a ${column.prevLabel}`}
                            className="btn btn-secondary btn-sm flex items-center justify-center gap-0.5 text-[11px] py-1 px-2 text-text-muted hover:text-text-dark"
                          >
                            <ChevronLeft size={13} />
                            <span>{column.prevLabel}</span>
                          </button>
                        )}

                        {column.nextStatus ? (
                          <button 
                            type="button"
                            onClick={() => handleMoveStatus(item.id, column.nextStatus!)} 
                            disabled={isUpdating}
                            title={`Avanzar a ${column.nextLabel}`}
                            className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-1 text-[11px] py-1 px-2"
                          >
                            <span>{column.nextLabel}</span>
                            <ChevronRight size={13} />
                          </button>
                        ) : (
                          <span className="text-xs text-green-700 font-bold flex-1 text-center py-1 bg-green-50 rounded">
                            ✅ Entregado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {column.items.length === 0 && (
                  <div className="py-12 text-center text-xs text-text-muted border-2 border-dashed border-gray-200 rounded-lg m-1">
                    Sin pedidos en este estado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Administrador en Kanban: Modificar Vendedora, Medio de Pago y Canal */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title="✏️ Modificar Pedido / Vendedora / Medio de Pago"
        maxWidth="480px"
      >
        {editingOrder && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const matchedSeller = activeSellers.find(u => u.id === editSellerId);
              const sellerName = matchedSeller ? matchedSeller.name : '';
              updateOrderDetails.mutate(
                {
                  id: editingOrder.id,
                  data: {
                    sellerId: editSellerId,
                    sellerName,
                    paymentMethod: editPaymentMethod,
                    channel: editChannel
                  }
                },
                {
                  onSuccess: () => {
                    setEditingOrder(null);
                    refetch();
                  }
                }
              );
            }}
            className="flex flex-col gap-4"
          >
            <div className="p-3 bg-bg-linen rounded border text-xs flex justify-between items-center">
              <div>
                <div className="font-bold text-text-dark text-sm">{editingOrder.orderNumber || 'Pedido'}</div>
                <div className="text-text-muted">Cliente: <strong>{editingOrder.customerName}</strong></div>
              </div>
              <div className="text-right font-bold text-primary-sage text-sm">
                {formatCurrency(editingOrder.totalAmount)}
              </div>
            </div>

            <div className="form-field">
              <label className="text-xs font-bold text-text-dark mb-1 block">👩‍💼 Vendedora Asignada *</label>
              <select
                className="input font-semibold"
                value={editSellerId}
                onChange={(e) => setEditSellerId(e.target.value)}
              >
                <option value="">-- Sin vendedora asignada --</option>
                {activeSellers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'ADMIN' ? 'Admin' : 'Vendedora'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="text-xs font-bold text-text-dark mb-1 block">💳 Método de Pago</label>
                <select
                  className="input font-semibold"
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="MERCADO_PAGO">💳 Mercado Pago</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="TARJETA_DEBITO">💳 Tarjeta Débito</option>
                  <option value="TARJETA_CREDITO">💳 Tarjeta Crédito</option>
                  <option value="CUENTA_CORRIENTE">📒 Cuenta Corriente (Fiado)</option>
                </select>
              </div>
              <div className="form-field">
                <label className="text-xs font-bold text-text-dark mb-1 block">🏪 Canal de Venta</label>
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

            <div className="form-actions flex justify-end gap-2 border-t pt-3">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingOrder(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={updateOrderDetails.isPending}>
                {updateOrderDetails.isPending ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
