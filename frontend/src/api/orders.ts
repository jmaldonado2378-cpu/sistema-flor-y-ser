import { apiRequest } from './client';

export interface OrderKanbanItem {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: OrderKanbanItem[];
}

export const getSalesKanbanBoard = async (): Promise<KanbanColumn[]> => {
  const res = await apiRequest<any>('/tasks/sales-kanban/board');
  return res.data || res;
};

export const updateOrderStatus = async (id: string, status: string): Promise<any> => {
  const res = await apiRequest<any>(`/sales/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  return res.data || res;
};
